import { TLTextShape, createShapeId, toRichText } from 'tldraw'
import { ContentType, ContentTypeLayout, getContentTypeLayout } from './ContentTypes'
import { GridPosition, GridMetadata } from './GridManager'

export interface CanvasPosition {
	x: number
	y: number
	width?: number
	height?: number
}

export interface TextShapeConfig {
	id: string
	text: string
	contentType: ContentType
	gridPosition: GridPosition
	canvasPosition: CanvasPosition
	layout: ContentTypeLayout
}

/**
 * Convert grid position to canvas coordinates
 */
export function gridPositionToCanvasCoordinates(
	gridPosition: GridPosition,
	metadata: GridMetadata
): CanvasPosition {
	const { row, columnStart, columnEnd } = gridPosition
	const { columnWidth, rowHeight } = metadata

	// Calculate x position (left edge of first column)
	const x = (columnStart - 1) * columnWidth

	// Calculate y position (top edge of row)
	const y = (row - 1) * rowHeight

	// Calculate width (span across columns)
	const width = (columnEnd - columnStart + 1) * columnWidth

	// Height is typically one row, but can be adjusted
	const height = rowHeight

	return { x, y, width, height }
}

/**
 * Convert canvas coordinates back to grid position (for reverse operations)
 */
export function canvasCoordinatesToGridPosition(
	canvasPosition: CanvasPosition,
	metadata: GridMetadata
): GridPosition {
	const { x, y, width } = canvasPosition
	const { columnWidth, rowHeight } = metadata

	// Calculate row (1-based)
	const row = Math.floor(y / rowHeight) + 1

	// Calculate column start (1-based)
	const columnStart = Math.floor(x / columnWidth) + 1

	// Calculate column end based on width
	const columnSpan = Math.ceil((width || columnWidth) / columnWidth)
	const columnEnd = columnStart + columnSpan - 1

	return { row, columnStart, columnEnd }
}

/**
 * Generate tldraw text shape from grid configuration
 */
export function createTextShapeFromGrid(config: TextShapeConfig, metadata: GridMetadata): Partial<TLTextShape> {
	const { canvasPosition, layout, text, contentType } = config

	// Map content type styling to tldraw properties
	const fontSize = mapFontSizeToTldraw(layout.fontSize)
	const color = mapColorToTldraw(layout.color)
	const textAlign = mapAlignmentToTldraw(layout.alignment)

	// For centered alignment, use the full column span width and let textAlign do the centering
	const useAutoSize = layout.alignment !== 'middle'
	
	// Calculate the full column span width for centered content
	let textWidth = canvasPosition.width || 200
	if (layout.alignment === 'middle') {
		// For centered content, use the actual canvas width for perfect centering
		if (contentType === 'title') {
			// Use the full canvas width from metadata for responsive centering
			textWidth = metadata.canvasWidth
		} else {
			// For other centered content (like formulas), use column span
			const { columnStart, columnEnd } = config.gridPosition
			textWidth = (columnEnd - columnStart + 1) * metadata.columnWidth
		}
	}

	return {
		id: createShapeId(config.id),
		type: 'text',
		x: canvasPosition.x,
		y: canvasPosition.y,
		props: {
			richText: toRichText(text),
			color: color,
			textAlign: textAlign,
			size: fontSize,
			font: layout.fontFamily === 'monospace' ? 'mono' : 'draw',
			w: textWidth,
			autoSize: useAutoSize, // disable autoSize for centered text to allow proper centering
			scale: 1, // required property
		},
		meta: {
			contentType: contentType,
			gridPosition: JSON.stringify(config.gridPosition), // Convert to string for JSON compatibility
			description: `${contentType} content: ${text.substring(0, 50)}...`
		}
	}
}



/**
 * Map content type font size to tldraw size
 */
function mapFontSizeToTldraw(fontSize: string): 's' | 'm' | 'l' | 'xl' {
	switch (fontSize) {
		case 'small': return 's'
		case 'normal': return 'm'
		case 'medium': return 'm'
		case 'large': return 'l'
		case 'xlarge': return 'xl'
		default: return 'm'
	}
}

/**
 * Map content type color to tldraw color
 */
function mapColorToTldraw(color: string): 'black' | 'blue' | 'green' | 'grey' | 'light-blue' | 'light-green' | 'light-red' | 'light-violet' | 'orange' | 'red' | 'violet' | 'white' | 'yellow' {
	const colorMap: Record<string, 'black' | 'blue' | 'green' | 'grey' | 'light-blue' | 'light-green' | 'light-red' | 'light-violet' | 'orange' | 'red' | 'violet' | 'white' | 'yellow'> = {
		'black': 'black',
		'grey': 'grey',
		'gray': 'grey',
		'red': 'red',
		'blue': 'blue',
		'green': 'green',
		'yellow': 'yellow',
		'orange': 'orange',
		'violet': 'violet',
		'light-blue': 'light-blue',
		'light-green': 'light-green',
		'light-red': 'light-red'
	}
	return colorMap[color] || 'black'
}

/**
 * Map content type alignment to tldraw text alignment
 */
function mapAlignmentToTldraw(alignment: string): 'start' | 'middle' | 'end' {
	switch (alignment) {
		case 'start': return 'start'
		case 'middle': return 'middle'
		case 'end': return 'end'
		default: return 'start'
	}
}

/**
 * Calculate optimal text width based on content and layout
 */
export function calculateTextWidth(
	text: string,
	layout: ContentTypeLayout,
	metadata: GridMetadata
): number {
	const { columnStart, columnEnd } = layout
	const availableWidth = (columnEnd - columnStart + 1) * metadata.columnWidth

	// Estimate character width (rough approximation)
	const avgCharWidth = layout.fontSize === 'small' ? 8 : 
						layout.fontSize === 'large' ? 16 :
						layout.fontSize === 'xlarge' ? 20 : 12

	const estimatedTextWidth = text.length * avgCharWidth

	// Use smaller of available width or estimated text width
	return Math.min(availableWidth * 0.9, estimatedTextWidth + 20) // 10% padding
}

/**
 * Apply spacing rules to determine actual row position
 */
export function applySpacingToRow(
	baseRow: number,
	contentType: ContentType,
	context?: {
		previousContentType?: ContentType
		isFirstContent?: boolean
	}
): number {
	const layout = getContentTypeLayout(contentType)
	let adjustedRow = baseRow

	// Apply top spacing
	adjustedRow += layout.spacing.top

	// Apply additional spacing based on previous content
	if (context?.previousContentType && !context.isFirstContent) {
		const previousLayout = getContentTypeLayout(context.previousContentType)
		adjustedRow += previousLayout.spacing.bottom
	}

	return adjustedRow
}

/**
 * Generate complete text shape configuration from grid parameters
 */
export function generateTextShapeConfig(
	id: string,
	text: string,
	contentType: ContentType,
	gridPosition: GridPosition,
	metadata: GridMetadata,
	context?: {
		numberInSequence?: number
		previousContentType?: ContentType
		isFirstContent?: boolean
	}
): TextShapeConfig {
	const layout = getContentTypeLayout(contentType)
	
	// Use the grid position as-is (spacing already handled in main logic)
	const finalGridPosition: GridPosition = {
		...gridPosition
	}

	// Convert to canvas coordinates
	const canvasPosition = gridPositionToCanvasCoordinates(finalGridPosition, metadata)

	// Calculate optimal width
	const optimalWidth = calculateTextWidth(text, layout, metadata)
	canvasPosition.width = optimalWidth

	return {
		id,
		text,
		contentType,
		gridPosition: finalGridPosition,
		canvasPosition,
		layout
	}
}

/**
 * Batch create multiple text shapes with proper spacing
 */
export function createMultipleTextShapes(
	contents: Array<{
		id: string
		text: string
		contentType: ContentType
	}>,
	startingRow: number,
	metadata: GridMetadata
): TextShapeConfig[] {
	const configs: TextShapeConfig[] = []
	let currentRow = startingRow

	contents.forEach((content, index) => {
		const layout = getContentTypeLayout(content.contentType)
		
		// Determine grid position based on content type layout
		const gridPosition: GridPosition = {
			row: currentRow,
			columnStart: layout.columnStart,
			columnEnd: layout.columnEnd
		}

		// Generate configuration
		const config = generateTextShapeConfig(
			content.id,
			content.text,
			content.contentType,
			gridPosition,
			metadata,
			{
				numberInSequence: index + 1,
				previousContentType: index > 0 ? contents[index - 1].contentType as ContentType : undefined,
				isFirstContent: index === 0
			}
		)

		configs.push(config)

		// Update current row for next content
		currentRow = config.gridPosition.row + 1 + layout.spacing.bottom
	})

	return configs
} 