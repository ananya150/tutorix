import { CanvasDimensions } from './CanvasCalculator'

export interface CameraPosition {
	x: number
	y: number
	z: number // zoom level
}

export interface CameraCalculationResult {
	position: CameraPosition
	reasoning: string
	visibleRows: {
		top: number
		bottom: number
		target: number
		emptyRowsBelow: number
	}
}

/**
 * Calculate optimal camera position for new content
 * Ensures user can see the new content with proper context
 */
export function calculateOptimalCameraPosition(
	targetRow: number,
	canvasDimensions: CanvasDimensions
): CameraCalculationResult {
	const { rowHeight, topMargin, horizontalPadding, windowHeight, canvasWidth, windowWidth } = canvasDimensions
	
	// Use actual viewport height instead of hardcoded value
	const VIEWPORT_HEIGHT = windowHeight
	const ROWS_PER_SCREEN = Math.floor((VIEWPORT_HEIGHT - topMargin) / rowHeight)
	const MIN_EMPTY_ROWS_BELOW = 5 // Always show at least 5 empty rows below new content
	
	console.log('📹 Camera calculation inputs:', {
		targetRow,
		rowHeight,
		topMargin,
		VIEWPORT_HEIGHT,
		ROWS_PER_SCREEN,
		MIN_EMPTY_ROWS_BELOW
	})
	
	// Calculate optimal top row to show
	let topRow: number
	let reasoning: string
	
	if (targetRow < 12) {
		// For early rows, always show from the beginning
		topRow = 1
		reasoning = `Target row ${targetRow} is early in document, showing from row 1 to provide full context`
	} else {
		// For later rows, position so target row is visible with 5 empty rows below
		const desiredBottomRow = targetRow + MIN_EMPTY_ROWS_BELOW
		topRow = Math.max(1, desiredBottomRow - ROWS_PER_SCREEN + 1)
		reasoning = `Target row ${targetRow} positioned with ${MIN_EMPTY_ROWS_BELOW} empty rows below, showing rows ${topRow}-${topRow + ROWS_PER_SCREEN - 1}`
	}
	
	// Calculate camera position
	// IMPORTANT: In tldraw, when camera.y = X, the viewport shows content from Y = -X to Y = (-X + viewportHeight)
	// To show content starting from topRow, we need to position the camera so that topRowY is visible
	// If we want topRowY to appear at the top of viewport: camera.y = -topRowY
	// If we want topRowY to appear with some offset: camera.y = -(topRowY - offset)
	
	const topRowY = topMargin + (topRow - 1) * rowHeight
	const targetRowY = topMargin + (targetRow - 1) * rowHeight
	
	// Position camera so that topRow appears at the top of the viewport
	const cameraY = -topRowY
	
	// For X positioning, we want to center the content area in the viewport
	// The content area spans from horizontalPadding to (horizontalPadding + canvasWidth)
	// We want this to be centered in the viewport
	// If viewport width is W and content area width is C, then:
	// Camera X should be positioned so that content area appears centered
	const contentAreaStart = horizontalPadding
	const contentAreaWidth = canvasWidth
	const viewportWidth = windowWidth
	
	// Center the content area in the viewport
	// Camera X = -(contentAreaStart - (viewportWidth - contentAreaWidth) / 2)
	const viewportCenterOffset = (viewportWidth - contentAreaWidth) / 2
	const cameraX = -(contentAreaStart - viewportCenterOffset)
	
	const cameraZ = 1 // Standard zoom level
	
	const visibleRows = {
		top: topRow,
		bottom: topRow + ROWS_PER_SCREEN - 1,
		target: targetRow,
		emptyRowsBelow: Math.max(0, (topRow + ROWS_PER_SCREEN - 1) - targetRow)
	}
	
	const result: CameraCalculationResult = {
		position: { x: cameraX, y: cameraY, z: cameraZ },
		reasoning,
		visibleRows
	}
	
	console.log('📹 Camera calculation result:', result)
	console.log('📹 Camera positioning details:', {
		topRowY: topRowY,
		targetRowY: targetRowY,
		cameraY: cameraY,
		cameraX: cameraX,
		cameraXCalculation: {
			contentAreaStart: contentAreaStart,
			contentAreaWidth: contentAreaWidth,
			viewportWidth: viewportWidth,
			viewportCenterOffset: viewportCenterOffset,
			calculation: `-(${contentAreaStart} - ${viewportCenterOffset}) = ${cameraX}`
		},
		expectedViewportTop: -cameraY,
		expectedViewportBottom: -cameraY + VIEWPORT_HEIGHT,
		targetRowRelativeToViewport: targetRowY - (-cameraY),
		note: 'Camera coordinates are negative of viewport bounds'
	})
	
	return result
}

/**
 * Determine if camera movement is needed for new content
 */
export function shouldMoveCameraForNewContent(
	targetRow: number,
	currentCameraY: number,
	canvasDimensions: CanvasDimensions
): boolean {
	const { rowHeight, topMargin, windowHeight } = canvasDimensions
	const VIEWPORT_HEIGHT = windowHeight
	
	// Calculate current visible row range
	const currentTopRow = Math.max(1, Math.floor((currentCameraY - topMargin) / rowHeight) + 1)
	const currentBottomRow = currentTopRow + Math.floor(VIEWPORT_HEIGHT / rowHeight) - 1
	
	// Check if target row is visible with enough context
	const hasEnoughSpaceBelow = (currentBottomRow - targetRow) >= 5
	const isTargetVisible = targetRow >= currentTopRow && targetRow <= currentBottomRow
	
	const shouldMove = !isTargetVisible || !hasEnoughSpaceBelow
	
	console.log('📹 Camera movement check:', {
		targetRow,
		currentTopRow,
		currentBottomRow,
		isTargetVisible,
		hasEnoughSpaceBelow,
		shouldMove
	})
	
	return shouldMove
} 