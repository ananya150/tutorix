export interface CanvasDimensions {
	windowWidth: number
	windowHeight: number
	canvasWidth: number
	canvasHeight: number
	horizontalPadding: number
	topMargin: number
	rowHeight: number
}

export interface TextBoxPosition {
	x: number
	y: number
	width: number
	height: number
}

export interface PositionSpec {
	row: number
	horizontalPosition: 'left' | 'center' | 'right' | number // number for custom position (0-1)
	width: number | string // number for pixels, string for fractions like "1/4"
	textAlign?: 'left' | 'center' | 'right'
	fontSize?: 'small' | 'medium' | 'large' | 'xlarge'
	fontWeight?: 'normal' | 'bold'
	color?: string
	bullet?: boolean
}

/**
 * Calculate responsive canvas dimensions with padding
 */
export function calculateCanvasDimensions(windowWidth: number, windowHeight: number): CanvasDimensions {
	// Horizontal padding: reduced from windowWidth/12 to windowWidth/16 for more space
	const horizontalPadding = windowWidth / 16
	const canvasWidth = windowWidth - (horizontalPadding * 2)
	
	// Top margin: small margin at top
	const topMargin = Math.max(windowHeight / 24, 30) // Responsive top margin, min 30px
	const canvasHeight = windowHeight - topMargin // Full height minus top margin
	
	// Responsive row height: max(screenHeight/12, 60px)
	const rowHeight = Math.max(windowHeight / 12, 60)
	
	return {
		windowWidth,
		windowHeight,
		canvasWidth,
		canvasHeight,
		horizontalPadding,
		topMargin,
		rowHeight
	}
}

/**
 * Parse width specification (fractions, decimals, pixels)
 */
export function parseWidth(widthSpec: string | number, canvasWidth: number): number {
	if (typeof widthSpec === 'number') {
		return widthSpec // Already in pixels
	}
	
	const spec = widthSpec.toLowerCase().trim()
	
	// Handle fractions like "1/4", "1/2", "3/4"
	if (spec.includes('/')) {
		const [numerator, denominator] = spec.split('/').map(s => parseFloat(s.trim()))
		if (numerator && denominator) {
			return (numerator / denominator) * canvasWidth
		}
	}
	
	// Handle decimals like "0.25", "0.5"
	if (spec.match(/^0?\.\d+$/)) {
		return parseFloat(spec) * canvasWidth
	}
	
	// Handle percentages like "25%", "50%"
	if (spec.endsWith('%')) {
		const percentage = parseFloat(spec.replace('%', ''))
		return (percentage / 100) * canvasWidth
	}
	
	// Handle pixels like "200px", "300px"
	if (spec.endsWith('px')) {
		return parseFloat(spec.replace('px', ''))
	}
	
	// Handle "full" or "1"
	if (spec === 'full' || spec === '1' || spec === '1/1') {
		return canvasWidth
	}
	
	// Default fallback
	console.warn(`Unable to parse width spec: ${widthSpec}, using 200px default`)
	return 200
}

/**
 * Parse horizontal position specification
 */
export function parseHorizontalPosition(
	positionSpec: string | number,
	canvasWidth: number,
	textBoxWidth: number
): number {
	console.log('🔍 parseHorizontalPosition called with:', {
		positionSpec,
		canvasWidth,
		textBoxWidth
	})

	if (typeof positionSpec === 'number') {
		// For fractional positions (0.0, 0.33, 0.66), calculate as direct percentage of canvas
		// This ensures proper spacing for multi-column layouts
		const result = positionSpec * canvasWidth
		console.log('📊 Numeric position calculation (fixed):', {
			positionSpec,
			calculation: `${positionSpec} * ${canvasWidth}`,
			result,
			note: 'Using direct canvas percentage to prevent overlap'
		})
		return result
	}
	
	const spec = positionSpec.toLowerCase().trim()
	
	switch (spec) {
		case 'left':
			console.log('📍 Left position: 0')
			return 0
		case 'center':
		case 'middle':
			const centerResult = (canvasWidth - textBoxWidth) / 2
			console.log('📍 Center position calculation:', {
				calculation: `(${canvasWidth} - ${textBoxWidth}) / 2`,
				result: centerResult
			})
			return centerResult
		case 'right':
			const rightResult = canvasWidth - textBoxWidth
			console.log('📍 Right position calculation:', {
				calculation: `${canvasWidth} - ${textBoxWidth}`,
				result: rightResult
			})
			return rightResult
		default:
			// Try to parse as fraction like "1/4", "3/4"
			if (spec.includes('/')) {
				const [numerator, denominator] = spec.split('/').map(s => parseFloat(s.trim()))
				if (numerator && denominator) {
					const fraction = numerator / denominator
					const result = fraction * canvasWidth
					console.log('📊 Fraction position calculation (fixed):', {
						spec,
						fraction,
						calculation: `${fraction} * ${canvasWidth}`,
						result,
						note: 'Using direct canvas percentage'
					})
					return result
				}
			}
			
			// Try to parse as decimal like "0.25", "0.75"
			if (spec.match(/^0?\.\d+$/)) {
				const fraction = parseFloat(spec)
				const result = fraction * canvasWidth
				console.log('📊 Decimal position calculation (fixed):', {
					spec,
					fraction,
					calculation: `${fraction} * ${canvasWidth}`,
					result,
					note: 'Using direct canvas percentage'
				})
				return result
			}
			
			console.warn(`Unable to parse position spec: ${positionSpec}, using left default`)
			return 0
	}
}

/**
 * Calculate absolute text box position from specification
 */
export function calculateTextBoxPosition(
	positionSpec: PositionSpec,
	canvasDimensions: CanvasDimensions
): TextBoxPosition {
	const { canvasWidth, horizontalPadding, topMargin, rowHeight } = canvasDimensions
	
	console.log('🎯 calculateTextBoxPosition called with:', {
		positionSpec,
		canvasDimensions: {
			canvasWidth,
			horizontalPadding,
			topMargin,
			rowHeight
		}
	})
	
	// Calculate width in pixels
	let width = parseWidth(positionSpec.width, canvasWidth)
	
	// Add horizontal padding between text boxes (reduce width slightly for spacing)
	const textBoxPadding = 8 // 8px padding between boxes
	if (typeof positionSpec.width === 'string' && positionSpec.width.includes('/')) {
		// For fractional widths (like 1/3), reduce width to create spacing
		width = width - textBoxPadding
	}
	
	console.log('📏 Width calculation result:', {
		widthSpec: positionSpec.width,
		canvasWidth,
		originalWidth: parseWidth(positionSpec.width, canvasWidth),
		adjustedWidth: width,
		paddingApplied: textBoxPadding
	})
	
	// Calculate Y position (row-based)
	const y = topMargin + (positionSpec.row - 1) * rowHeight
	console.log('📐 Y position calculation:', {
		row: positionSpec.row,
		calculation: `${topMargin} + (${positionSpec.row} - 1) * ${rowHeight}`,
		result: y
	})
	
	// Calculate X position (relative to canvas, then add padding)
	const relativeX = parseHorizontalPosition(positionSpec.horizontalPosition, canvasWidth, width)
	
	// Add small offset for fractional positions to create spacing
	let xOffset = 0
	if (typeof positionSpec.horizontalPosition === 'number' && positionSpec.horizontalPosition > 0) {
		xOffset = textBoxPadding / 2 // Half padding as offset for middle/right boxes
	}
	
	const x = horizontalPadding + relativeX + xOffset
	console.log('📐 X position calculation:', {
		horizontalPosition: positionSpec.horizontalPosition,
		relativeX,
		horizontalPadding,
		xOffset,
		calculation: `${horizontalPadding} + ${relativeX} + ${xOffset}`,
		finalX: x
	})
	
	// Height is typically one row, but could be adjusted for content
	const height = rowHeight
	
	const result = { x, y, width, height }
	console.log('🎯 Final position result:', result)
	
	return result
}

/**
 * Convert tldraw text alignment to our internal format
 */
export function mapTextAlignment(align?: string): 'start' | 'middle' | 'end' {
	switch (align?.toLowerCase()) {
		case 'left':
		case 'start':
			return 'start'
		case 'center':
		case 'middle':
			return 'middle'
		case 'right':
		case 'end':
			return 'end'
		default:
			return 'start'
	}
}

/**
 * Map font size to tldraw format
 */
export function mapFontSize(size?: string): 's' | 'm' | 'l' | 'xl' {
	switch (size?.toLowerCase()) {
		case 'small':
			return 's'
		case 'medium':
		case 'normal':
			return 'm'
		case 'large':
			return 'l'
		case 'xlarge':
		case 'extra-large':
			return 'xl'
		default:
			return 'm'
	}
}

/**
 * Map color to tldraw format
 */
export function mapColor(color?: string): string {
	const colorMap: Record<string, string> = {
		'black': 'black',
		'red': 'red',
		'blue': 'blue',
		'green': 'green',
		'yellow': 'yellow',
		'orange': 'orange',
		'purple': 'violet',
		'violet': 'violet',
		'grey': 'grey',
		'gray': 'grey',
		'white': 'white'
	}
	
	return colorMap[color?.toLowerCase() || 'black'] || 'black'
} 