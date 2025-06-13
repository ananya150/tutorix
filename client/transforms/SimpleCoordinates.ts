import { TLAiChange, TLAiPrompt, TldrawAiTransform } from '@tldraw/ai'
import { Box, TLShapePartial } from 'tldraw'

export class SimpleCoordinates extends TldrawAiTransform {
	offsetIds = new Set<string>()
	before: Record<string, number> = {}
	bounds = {} as Box

	override transformPrompt = (input: TLAiPrompt) => {
		const { canvasContent, promptBounds, contextBounds } = input
		// Save the original coordinates of context bounds (the user's viewport)
		this.bounds = contextBounds.clone()

		// FIXED: Use viewport dimensions instead of window dimensions for zoom independence
		// The contextBounds represents the actual visible area in the editor
		const canvasDimensions = {
			width: contextBounds.width,
			height: contextBounds.height
		}
		
		console.log('🖼️ Canvas dimensions for absolute positioning (zoom-independent):', {
			viewportDimensions: canvasDimensions,
			contextBounds: contextBounds,
			promptBounds: promptBounds,
			note: 'Using viewport size for zoom independence'
		})
		
		// Add canvas dimensions to the prompt (we'll use this in the worker)
		;(input as any).canvasDimensions = canvasDimensions

		// Save the original coordinates of all shapes (text only)
		for (const s of canvasContent.shapes) {
			// Only process text shapes
			if (s.type !== 'text') continue

			for (const prop of ['x', 'y'] as const) {
				this.before[s.id + '_' + prop] = s[prop]
				s[prop] = Math.floor(s[prop] - this.bounds[prop])
			}
			for (const key in s.props) {
				const v = (s.props as any)[key]
				if (Number.isFinite(v)) {
					;(s.props as any)[key] = Math.floor(v)
				}
			}
		}

		// Make the prompt bounds relative to the context bounds
		promptBounds.x -= contextBounds.x
		promptBounds.y -= contextBounds.y

		// Zero the context bounds
		contextBounds.x = 0
		contextBounds.y = 0

		return input
	}

	override transformChange = (change: TLAiChange) => {
		const { offsetIds } = this
		switch (change.type) {
			case 'createShape':
			case 'updateShape': {
				const { shape } = change
				
				// Only handle text shapes
				if (shape.type !== 'text') {
					return change
				}

				// FIXED: Don't add viewport offset - worker already calculates absolute coordinates
				// The worker calculates absolute coordinates from canvas origin (0,0)
				// Adding viewport offset would cause double-offset and incorrect positioning
				for (const prop of ['x', 'y'] as const) {
					if (shape[prop] !== undefined) {
						// Shape already has absolute coordinates from worker - use as-is
						console.log(`🎯 Using absolute ${prop} coordinate from worker:`, {
							absoluteCoordinate: shape[prop],
							viewportOffset: this.bounds[prop],
							note: 'Not adding offset - worker calculated absolute position'
						})
					} else {
						// Fallback for shapes without coordinates
						if (offsetIds.has(shape.id)) {
							shape[prop] = this.before[shape.id + '_' + prop]
						} else {
							shape[prop] = this.bounds[prop]
						}
					}
				}
				return {
					...change,
					shape: shape as TLShapePartial,
				}
			}
			default: {
				return change
			}
		}
	}
}
