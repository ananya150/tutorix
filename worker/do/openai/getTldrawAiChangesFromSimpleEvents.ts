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
	createShapeId,
} from 'tldraw'
import {
	ISimpleCreateEvent,
	ISimpleDeleteEvent,
	ISimpleEvent,
	ISimpleFill,
	ISimpleMoveEvent,
	ISimpleCameraEvent,
} from './schema'
import { 
	calculateCanvasDimensions, 
	calculateTextBoxPosition, 
	mapTextAlignment, 
	mapFontSize, 
	mapColor,
	PositionSpec 
} from '../positioning/CanvasCalculator'
import { calculateOptimalCameraPosition } from '../positioning/CameraManager'

// Custom change type for camera positioning
interface TLAiCameraChange {
	type: 'camera'
	description: string
	camera: {
		x: number
		y: number
		z: number
	}
	reasoning: string
}

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
		case 'camera': {
			return getTldrawAiChangesFromSimpleCameraEvent(prompt, event)
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

	// Only handle text shapes with explicit positioning
	if (shape.type === 'text') {
		// Get canvas dimensions from the prompt (sent by client)
		const canvasDimensions = (prompt as any).canvasDimensions
		if (!canvasDimensions) {
			console.error('Canvas dimensions not found in prompt')
			return changes
		}

		console.log('🖼️ Canvas dimensions from prompt:', canvasDimensions)

		// Calculate responsive canvas dimensions
		const responsiveCanvas = calculateCanvasDimensions(
			canvasDimensions.width,
			canvasDimensions.height
		)

		console.log('📐 Responsive canvas calculated:', responsiveCanvas)

		// Create position specification from shape data
		const positionSpec: PositionSpec = {
			row: shape.row,
			horizontalPosition: shape.horizontalPosition,
			width: shape.width,
			textAlign: shape.textAlign,
			fontSize: shape.fontSize,
			fontWeight: shape.fontWeight,
			color: shape.color,
			bullet: shape.bullet
		}

		console.log('📋 Position spec created:', positionSpec)

		// Calculate absolute position
		const position = calculateTextBoxPosition(positionSpec, responsiveCanvas)

		console.log('🎯 Calculated position:', position)

		// Process text content - add bullet symbol if needed
		let processedText = shape.text
		if (shape.bullet && !processedText.startsWith('•')) {
			processedText = '• ' + processedText
		}

		// Map styling properties
		const textAlign = mapTextAlignment(shape.textAlign)
		const fontSize = mapFontSize(shape.fontSize)
		const color = mapColor(shape.color)

		// Debug logging
		console.log('🎨 Styling mapped:', {
			originalTextAlign: shape.textAlign,
			mappedTextAlign: textAlign,
			originalFontSize: shape.fontSize,
			mappedFontSize: fontSize,
			originalColor: shape.color,
			mappedColor: color
		})

		console.log('✨ Creating tldraw shape with:', {
			shapeId: shape.shapeId,
			position,
			processedText: processedText.substring(0, 50) + '...',
			styling: { textAlign, fontSize, color }
		})

		// Create change object
		if (event.type === 'create') {
			changes.push({
				type: 'createShape',
				description: shape.note,
				shape: {
					id: createShapeId(shape.shapeId),
					type: 'text',
					x: position.x,
					y: position.y,
					props: {
						richText: toRichText(processedText),
						color: color as any,
						textAlign: textAlign,
						size: fontSize,
						font: 'draw',
						w: position.width,
						autoSize: false, // Fixed width for explicit positioning
						scale: 1,
					},
					meta: {
						positionSpec: JSON.stringify(positionSpec),
						description: shape.note
					}
				},
			} satisfies TLAiCreateShapeChange<TLTextShape>)
		} else {
			changes.push({
				type: 'updateShape',
				description: shape.note,
				shape: {
					id: createShapeId(shape.shapeId),
					type: 'text',
					x: position.x,
					y: position.y,
					props: {
						richText: toRichText(processedText),
						color: color as any,
						textAlign: textAlign,
						size: fontSize,
						font: 'draw',
						w: position.width,
						autoSize: false,
						scale: 1,
					},
					meta: {
						positionSpec: JSON.stringify(positionSpec),
						description: shape.note
					}
				},
			} satisfies TLAiUpdateShapeChange<TLTextShape>)
		}
	}

	// Add shapes to canvas content for reference
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

function getTldrawAiChangesFromSimpleCameraEvent(
	prompt: TLAiSerializedPrompt,
	event: ISimpleCameraEvent
): TLAiCameraChange[] {
	// Get canvas dimensions from the prompt
	const canvasDimensions = (prompt as any).canvasDimensions
	if (!canvasDimensions) {
		console.error('Canvas dimensions not found in prompt for camera event')
		return []
	}

	console.log('📹 Processing camera event:', event)

	// Calculate responsive canvas dimensions
	const responsiveCanvas = calculateCanvasDimensions(
		canvasDimensions.width,
		canvasDimensions.height
	)

	// Calculate optimal camera position
	const cameraResult = calculateOptimalCameraPosition(event.targetRow, responsiveCanvas)

	console.log('📹 Camera change created:', {
		targetRow: event.targetRow,
		position: cameraResult.position,
		visibleRows: cameraResult.visibleRows
	})

	return [{
		type: 'camera',
		description: `Move camera to show row ${event.targetRow} with proper context`,
		camera: cameraResult.position,
		reasoning: cameraResult.reasoning
	}]
}

