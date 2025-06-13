import type { TLAiResult, TLAiSerializedPrompt } from '@tldraw/ai'
import { DurableObject } from 'cloudflare:workers'
import { AutoRouter, error } from 'itty-router'
import { TldrawAiBaseService } from '../TldrawAiBaseService'
import { Environment } from '../types'
import { OpenAiService } from './openai/OpenAiService'
import { CustomProviderService } from './custom/CustomProviderService'
import { GridManager } from './grid/GridManager'

export class TldrawAiDurableObject extends DurableObject<Environment> {
	service: TldrawAiBaseService
	gridManager: GridManager

	constructor(ctx: DurableObjectState, env: Environment) {
		super(ctx, env)
		// GridManager will be created when we receive the first request with canvas dimensions
		this.gridManager = new GridManager() // Default fallback
		this.service = new OpenAiService(this.env, this.gridManager) // swap this with your own service
		
		// Initialize grid state from persistent storage
		this.initializeGridState()
		
		// Log grid manager state for debugging
		console.log('GridManager initialized with currentRow:', this.gridManager.getCurrentGridState().currentRow)
	}

	/**
	 * Initialize grid state from persistent storage
	 */
	private async initializeGridState() {
		try {
			const storedState = await this.ctx.storage.get('gridState')
			if (storedState) {
				console.log('Restoring grid state from storage:', storedState)
				this.gridManager.restoreState(storedState as any)
			} else {
				console.log('No stored grid state found, starting fresh')
			}
		} catch (error) {
			console.error('Error loading grid state:', error)
		}
	}

	/**
	 * Save grid state to persistent storage
	 */
	private async saveGridState() {
		try {
			const currentState = this.gridManager.getFullState()
			await this.ctx.storage.put('gridState', currentState)
			console.log('Grid state saved to storage')
		} catch (error) {
			console.error('Error saving grid state:', error)
		}
	}

	/**
	 * Update GridManager with canvas dimensions if needed
	 */
	private updateGridManagerWithCanvasDimensions(prompt: TLAiSerializedPrompt) {
		const canvasDimensions = (prompt as any).canvasDimensions
		if (canvasDimensions && canvasDimensions.width) {
			const currentWidth = this.gridManager.getCurrentGridState().metadata.canvasWidth
			
			// Only recreate if canvas width has changed significantly (more than 50px difference)
			if (Math.abs(currentWidth - canvasDimensions.width) > 50) {
				console.log('Updating GridManager with new canvas width:', canvasDimensions.width)
				
				// Save current state
				const currentState = this.gridManager.getFullState()
				
				// Create new GridManager with proper canvas width
				this.gridManager = new GridManager(canvasDimensions.width)
				
				// Restore the content state but with new metadata
				if (currentState.state.currentRow > 1 || currentState.state.contentHistory.length > 0) {
					this.gridManager.restoreState({
						state: currentState.state,
						metadata: this.gridManager.getCurrentGridState().metadata // Use new metadata
					})
				}
				
				// Update the service with new grid manager
				this.service = new OpenAiService(this.env, this.gridManager)
				
				console.log('GridManager updated with canvas width:', canvasDimensions.width)
			}
		}
	}

	private readonly router = AutoRouter({
		catch: (e) => {
			console.error(e)
			return error(e)
		},
	})
		// when we get a connection request, we stash the room id if needed and handle the connection
		.post('/generate', (request) => this.generate(request))
		.post('/stream', (request) => this.stream(request))
		.post('/cancel', (request) => this.cancel(request))
		.post('/reset', (request) => this.resetGrid(request))

	// `fetch` is the entry point for all requests to the Durable Object
	override fetch(request: Request): Response | Promise<Response> {
		return this.router.fetch(request)
	}

	/**
	 * Cancel the current stream.
	 *
	 * @param _request - The request object containing the prompt.
	 * @returns A Promise that resolves to a Response object containing the cancelled response.
	 */
	cancel(_request: Request) {
		return new Response('Not implemented', {
			status: 501,
		})
	}

	/**
	 * Reset the grid state (for testing)
	 *
	 * @param _request - The request object.
	 * @returns A Promise that resolves to a Response object.
	 */
	async resetGrid(_request: Request) {
		console.log('Resetting grid state')
		try {
			this.gridManager.reset()
			await this.ctx.storage.delete('gridState')
			console.log('Grid state reset')
			
			return new Response(JSON.stringify({ success: true, message: 'Grid state reset' }), {
				headers: { 'Content-Type': 'application/json' },
			})
		} catch (error: any) {
			console.error('Error resetting grid state:', error)
			return new Response('Error resetting grid state', {
				status: 500,
			})
		}
	}

	/**
	 * Generate a set of changes from the model.
	 *
	 * @param request - The request object containing the prompt.
	 * @returns A Promise that resolves to a Response object containing the generated changes.
	 */
	private async generate(request: Request) {
		const prompt = (await request.json()) as TLAiSerializedPrompt

		try {
			// Update GridManager with canvas dimensions if needed
			this.updateGridManagerWithCanvasDimensions(prompt)

			const response = await this.service.generate(prompt)

			// Save grid state after generation
			await this.saveGridState()

			// Send back the response as a JSON object
			return new Response(JSON.stringify(response), {
				headers: { 'Content-Type': 'application/json' },
			})
		} catch (error: any) {
			console.error('AI response error:', error)
			return new Response('An internal server error occurred.', {
				status: 500,
			})
		}
	}

	/**
	 * Stream changes from the model.
	 *
	 * @param request - The request object containing the prompt.
	 * @returns A Promise that resolves to a Response object containing the streamed changes.
	 */
	private async stream(request: Request): Promise<Response> {
		const encoder = new TextEncoder()
		const { readable, writable } = new TransformStream()
		const writer = writable.getWriter()

		const response: TLAiResult = {
			changes: [],
		}

		;(async () => {
			try {
				const prompt = await request.json()

				// Update GridManager with canvas dimensions if needed
				this.updateGridManagerWithCanvasDimensions(prompt as TLAiSerializedPrompt)

				for await (const change of this.service.stream(prompt as TLAiSerializedPrompt)) {
					response.changes.push(change)
					const data = `data: ${JSON.stringify(change)}\n\n`
					await writer.write(encoder.encode(data))
					await writer.ready
				}
				
				// Save grid state after streaming
				await this.saveGridState()
				
				await writer.close()
			} catch (error) {
				console.error('Stream error:', error)
				await writer.abort(error)
			}
		})()

		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache, no-transform',
				Connection: 'keep-alive',
				'X-Accel-Buffering': 'no',
				'Transfer-Encoding': 'chunked',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		})
	}
}
