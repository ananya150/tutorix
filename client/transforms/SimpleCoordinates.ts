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

		// Add canvas dimensions to the prompt for responsive grid system
		// Get the actual canvas/viewport dimensions
		const canvasDimensions = {
			width: contextBounds.width,
			height: contextBounds.height
		}
		
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

				// Add back in the offset
				for (const prop of ['x', 'y'] as const) {
					if (shape[prop] !== undefined) {
						shape[prop] += this.bounds[prop]
					} else {
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
