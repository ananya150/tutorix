import { TLAiContent } from '@tldraw/ai'
import {
	TLArrowBinding,
	TLArrowShape,
	TLGeoShape,
	TLLineShape,
	TLNoteShape,
	TLTextShape,
} from 'tldraw'
import { shapeFillToSimpleFill } from './conversions'
import { ISimpleShape } from './schema'

export function getSimpleContentFromCanvasContent(content: TLAiContent): {
	shapes: ISimpleShape[]
} {
	return {
		shapes: compact(
			content.shapes.map((shape) => {
				// Only handle text shapes
				if (shape.type === 'text') {
					const s = shape as TLTextShape
					// For simplicity, we'll convert richText to string by getting its text representation
					const textContent = JSON.stringify(s.props.richText || '')
					return {
						shapeId: s.id,
						type: 'text',
						text: textContent,
						x: s.x,
						y: s.y,
						color: s.props.color,
						textAlign: s.props.textAlign,
						note: (s.meta?.description as string) ?? '',
					}
				}

				// Skip all other shape types
				return undefined
			})
		),
	}
}

function compact<T>(arr: T[]): Exclude<T, undefined>[] {
	return arr.filter(Boolean) as Exclude<T, undefined>[]
}
