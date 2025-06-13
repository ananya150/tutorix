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
import { GridManager } from '../grid/GridManager'
import { gridPositionToCanvasCoordinates, createTextShapeFromGrid, generateTextShapeConfig } from '../grid/GridToCanvas'
import { ContentType, getContentTypeLayout } from '../grid/ContentTypes'
import { detectContentTypeFromInstruction, DetectionContext } from '../grid/ContentTypeDetector'

export function getTldrawAiChangesFromSimpleEvents(
	prompt: TLAiSerializedPrompt,
	event: ISimpleEvent,
	gridManager?: GridManager
) {
	switch (event.type) {
		case 'update':
		case 'create': {
			return getTldrawAiChangesFromSimpleCreateOrUpdateEvent(prompt, event, gridManager)
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
	event: ISimpleCreateEvent,
	gridManager?: GridManager
): TLAiChange[] {
	const { shape } = event

	const changes: TLAiChange[] = []

	const shapeEventType = event.type === 'create' ? 'createShape' : 'updateShape'

	// Only handle text shapes now
	if (shape.type === 'text') {
		if (gridManager && 'contentType' in shape) {
			// Grid-based text shape processing
			const gridState = gridManager.getCurrentGridState()
			
			// Debug logging
			console.log('Grid state before processing:', {
				currentRow: gridState.currentRow,
				recentContentCount: gridState.recentContent.length,
				recentContent: gridState.recentContent.map(c => ({ row: c.row, type: c.contentType }))
			})
			
			// Get content type layout first
			const contentType = shape.contentType as ContentType
			const layout = getContentTypeLayout(contentType)
			
			// Detect extra spacing from intent/instruction
			const instruction = event.intent || ''
			const detectionResult = detectContentTypeFromInstruction(
				shape.text || '',
				instruction,
				{
					recentContent: gridState.recentContent,
					isFirstContent: gridState.recentContent.length === 0,
					userInstruction: instruction
				}
			)
			
			// Debug logging for content type
			console.log('Content type processing:', {
				shapeId: shape.shapeId,
				detectedType: contentType,
				layoutColumns: [layout.columnStart, layout.columnEnd],
				layoutSpacing: layout.spacing,
				extraSpacing: detectionResult.extraSpacing,
				instruction: instruction
			})
			
			// Determine target row - use the current available row
			let targetRow = shape.targetRow || gridState.currentRow
			
			// For first content, start at row 1
			if (gridState.recentContent.length === 0) {
				targetRow = 1
			}
			
			// Apply spacing based on content type
			const spacing = layout.spacing.top
			if (spacing > 0 && gridState.recentContent.length > 0) {
				targetRow += spacing
			}
			
			// Apply extra spacing from instruction keywords (e.g., "next paragraph")
			if (detectionResult.extraSpacing && detectionResult.extraSpacing > 0) {
				targetRow += detectionResult.extraSpacing
				console.log(`Added ${detectionResult.extraSpacing} extra row(s) for spacing based on instruction: "${instruction}"`)
			}
			
			// Determine column span from layout
			const columnSpan = shape.columnSpan || [layout.columnStart, layout.columnEnd]
			
			// Create grid position
			const gridPosition = {
				row: targetRow,
				columnStart: columnSpan[0],
				columnEnd: columnSpan[1]
			}
			
			// Process text content - add bullet symbols for bullet points
			let processedText = shape.text || ''
			if (contentType === 'bullet' && !processedText.startsWith('•')) {
				processedText = '• ' + processedText
			}
			
			// Generate text shape configuration
			const config = generateTextShapeConfig(
				shape.shapeId,
				processedText,
				contentType,
				gridPosition,
				gridState.metadata,
				{
					isFirstContent: gridState.recentContent.length === 0,
					previousContentType: gridState.recentContent[0]?.contentType as ContentType
				}
			)
			
			// Create the tldraw shape
			const tldrawShape = createTextShapeFromGrid(config, gridState.metadata)
			
			// Debug logging
			console.log('Final shape coordinates:', {
				shapeId: shape.shapeId,
				targetRow,
				gridPosition,
				canvasX: tldrawShape.x,
				canvasY: tldrawShape.y,
				metadata: tldrawShape.meta
			})
			
			// Create proper change object based on event type
			if (event.type === 'create') {
				changes.push({
					type: 'createShape',
					description: shape.note ?? '',
					shape: {
						id: shape.shapeId as any,
						type: 'text' as const,
						x: tldrawShape.x ?? 0,
						y: tldrawShape.y ?? 0,
						props: tldrawShape.props ?? {
							richText: toRichText(shape.text ?? ''),
							color: 'black',
							textAlign: 'start',
							size: 'm',
							font: 'draw',
							w: 200,
							autoSize: true,
							scale: 1,
						},
						meta: tldrawShape.meta ?? {},
					},
				} satisfies TLAiCreateShapeChange<TLTextShape>)
			} else {
				changes.push({
					type: 'updateShape',
					description: shape.note ?? '',
					shape: {
						id: shape.shapeId as any,
						type: 'text' as const,
						x: tldrawShape.x ?? 0,
						y: tldrawShape.y ?? 0,
						props: tldrawShape.props ?? {
							richText: toRichText(shape.text ?? ''),
							color: 'black',
							textAlign: 'start',
							size: 'm',
							font: 'draw',
							w: 200,
							autoSize: true,
							scale: 1,
						},
						meta: tldrawShape.meta ?? {},
					},
				} satisfies TLAiUpdateShapeChange<TLTextShape>)
			}
			
			// Update grid state
			if (event.type === 'create') {
				console.log('Updating grid state with:', {
					id: shape.shapeId,
					row: targetRow,
					contentType: contentType.toString()
				})
				
				gridManager.updateGridState({
					id: shape.shapeId,
					row: targetRow,
					columnStart: columnSpan[0],
					columnEnd: columnSpan[1],
					text: shape.text || '',
					contentType: contentType.toString()
				})
				
				console.log('Grid state after update:', {
					currentRow: gridManager.getCurrentGridState().currentRow,
					contentHistoryLength: gridManager.getCurrentGridState().recentContent.length
				})
			}
		} else {
			// Fallback to coordinate-based processing for compatibility
			if ('x' in shape && 'y' in shape) {
				changes.push({
					type: shapeEventType,
					description: shape.note ?? '',
					shape: {
						id: shape.shapeId as any,
						type: 'text',
						x: shape.x as number,
						y: shape.y as number,
						props: {
							richText: toRichText(shape.text ?? ''),
							color: shape.color ?? 'black',
							textAlign: shape.textAlign ?? 'middle',
						},
					},
				} satisfies TLAiCreateShapeChange<TLTextShape> | TLAiUpdateShapeChange<TLTextShape>)
			}
		}
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

