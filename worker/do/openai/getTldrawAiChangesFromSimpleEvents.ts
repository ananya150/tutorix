import {
	TLAiChange,
	TLAiCreateBindingChange,
	TLAiCreateShapeChange,
	TLAiSerializedPrompt,
	TLAiUpdateShapeChange,
	exhaustiveSwitchError,
} from '@tldraw/ai'
import {
	IndexKey,
	TLArrowBinding,
	TLArrowShape,
	TLDefaultFillStyle,
	TLGeoShape,
	TLLineShape,
	TLNoteShape,
	TLTextShape,
	toRichText,
} from 'tldraw'
import {
	ISimpleCreateEvent,
	ISimpleDeleteEvent,
	ISimpleEvent,
	ISimpleFill,
	ISimpleMoveEvent,
} from './schema'

export function getTldrawAiChangesFromSimpleEvents(
	prompt: TLAiSerializedPrompt,
	event: ISimpleEvent
) {
	switch (event.type) {
		case 'update':
		case 'create': {
			return getTldrawAiChangesFromSimpleCreateOrUpdateEvent(prompt, event)
		}
		case 'delete': {
			return getTldrawAiChangesFromSimpleDeleteEvent(prompt, event)
		}
		case 'move': {
			return getTldrawAiChangesFromSimpleMoveEvent(prompt, event)
		}
		case 'think': {
			return []
		}
		default: {
			throw exhaustiveSwitchError(event, 'type')
		}
	}
}

const FILL_MAP: Record<ISimpleFill, TLDefaultFillStyle> = {
	none: 'none',
	solid: 'fill',
	semi: 'semi',
	tint: 'solid',
	pattern: 'pattern',
}

function simpleFillToShapeFill(fill: ISimpleFill): TLDefaultFillStyle {
	return FILL_MAP[fill]
}

function getTldrawAiChangesFromSimpleCreateOrUpdateEvent(
	prompt: TLAiSerializedPrompt,
	event: ISimpleCreateEvent
): TLAiChange[] {
	const { shape } = event

	const changes: TLAiChange[] = []

	const shapeEventType = event.type === 'create' ? 'createShape' : 'updateShape'

	// Only handle text shapes now
	if (shape.type === 'text') {
		changes.push({
			type: shapeEventType,
			description: shape.note ?? '',
			shape: {
				id: shape.shapeId as any,
				type: 'text',
				x: shape.x,
				y: shape.y,
				props: {
					richText: toRichText(shape.text ?? ''),
					color: shape.color ?? 'black',
					textAlign: shape.textAlign ?? 'middle',
				},
			},
		} satisfies TLAiCreateShapeChange<TLTextShape> | TLAiUpdateShapeChange<TLTextShape>)
	}
	// Skip all other shape types

	// Since we made new shapes, we need to add them provisionally to the canvasContent
	// so that other references to these shapes or bindings will work correctly
	for (const change of changes) {
		if (change.type === 'createShape') {
			prompt.canvasContent.shapes.push(change.shape as any)
		} else if (change.type === 'createBinding') {
			prompt.canvasContent.bindings?.push(change.binding as any)
		}
	}

	return changes
}

function getTldrawAiChangesFromSimpleDeleteEvent(
	prompt: TLAiSerializedPrompt,
	event: ISimpleDeleteEvent
): TLAiChange[] {
	const { shapeId, intent } = event

	return [
		{
			type: 'deleteShape',
			description: intent ?? '',
			shapeId: shapeId as any,
		},
	]
}

function getTldrawAiChangesFromSimpleMoveEvent(
	prompt: TLAiSerializedPrompt,
	event: ISimpleMoveEvent
): TLAiChange[] {
	const { shapeId, intent } = event
	return [
		{
			type: 'updateShape',
			description: intent ?? '',
			shape: {
				id: shapeId as any,
				x: event.x,
				y: event.y,
			},
		},
	]
}
