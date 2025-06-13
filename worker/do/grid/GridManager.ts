export interface GridPosition {
	row: number
	columnStart: number
	columnEnd: number
}

export interface GridContent {
	id: string
	row: number
	columnStart: number
	columnEnd: number
	contentType: string
	text: string
	timestamp: number
}

export interface GridState {
	currentRow: number
	totalColumns: number
	rowHeight: number
	contentHistory: GridContent[]
	occupiedCells: Set<string> // "row:col" format
}

export interface GridMetadata {
	totalColumns: number
	rowHeight: number
	columnWidth: number
	canvasWidth: number
	canvasHeight: number
}

export class GridManager {
	private state: GridState
	private metadata: GridMetadata

	constructor() {
		this.metadata = {
			totalColumns: 12,
			rowHeight: 60, // pixels
			columnWidth: 100, // pixels  
			canvasWidth: 1200, // 12 * 100
			canvasHeight: 0 // grows dynamically
		}

		this.state = {
			currentRow: 1,
			totalColumns: this.metadata.totalColumns,
			rowHeight: this.metadata.rowHeight,
			contentHistory: [],
			occupiedCells: new Set()
		}
	}

	/**
	 * Get current grid state for AI context
	 */
	getCurrentGridState(): {
		currentRow: number
		recentContent: GridContent[]
		availableSpace: {
			totalColumns: number
			rowHeight: number
		}
		metadata: GridMetadata
	} {
		// Get last 3 items for context
		const recentContent = this.state.contentHistory
			.slice(-3)
			.sort((a, b) => b.timestamp - a.timestamp)

		return {
			currentRow: this.state.currentRow,
			recentContent,
			availableSpace: {
				totalColumns: this.state.totalColumns,
				rowHeight: this.state.rowHeight
			},
			metadata: this.metadata
		}
	}

	/**
	 * Update grid state with new content
	 */
	updateGridState(content: {
		id: string
		row: number
		columnStart: number
		columnEnd: number
		contentType: string
		text: string
	}): GridPosition {
		const gridContent: GridContent = {
			...content,
			timestamp: Date.now()
		}

		// Add to content history
		this.state.contentHistory.push(gridContent)

		// Mark cells as occupied
		for (let col = content.columnStart; col <= content.columnEnd; col++) {
			this.state.occupiedCells.add(`${content.row}:${col}`)
		}

		// Update current row if this content is on or after current row
		if (content.row >= this.state.currentRow) {
			this.state.currentRow = content.row + 1
		}

		// Update canvas height
		this.metadata.canvasHeight = Math.max(
			this.metadata.canvasHeight,
			content.row * this.metadata.rowHeight + this.metadata.rowHeight
		)

		return {
			row: content.row,
			columnStart: content.columnStart,
			columnEnd: content.columnEnd
		}
	}

	/**
	 * Get next available row for content
	 */
	getNextAvailableRow(): number {
		return this.state.currentRow
	}

	/**
	 * Check if a grid position is available
	 */
	isPositionAvailable(row: number, columnStart: number, columnEnd: number): boolean {
		for (let col = columnStart; col <= columnEnd; col++) {
			if (this.state.occupiedCells.has(`${row}:${col}`)) {
				return false
			}
		}
		return true
	}

	/**
	 * Find next available position for content with given column span
	 */
	findNextAvailablePosition(columnSpan: number): GridPosition {
		let row = this.state.currentRow
		
		// Try to fit in current row first
		for (let startCol = 1; startCol <= this.state.totalColumns - columnSpan + 1; startCol++) {
			const endCol = startCol + columnSpan - 1
			if (this.isPositionAvailable(row, startCol, endCol)) {
				return {
					row,
					columnStart: startCol,
					columnEnd: endCol
				}
			}
		}

		// If current row is full, move to next row
		row++
		return {
			row,
			columnStart: 1,
			columnEnd: columnSpan
		}
	}

	/**
	 * Get content history for debugging/analysis
	 */
	getContentHistory(): GridContent[] {
		return [...this.state.contentHistory]
	}

	/**
	 * Get grid metadata
	 */
	getMetadata(): GridMetadata {
		return { ...this.metadata }
	}

	/**
	 * Reset grid state (useful for testing)
	 */
	reset(): void {
		this.state = {
			currentRow: 1,
			totalColumns: this.metadata.totalColumns,
			rowHeight: this.metadata.rowHeight,
			contentHistory: [],
			occupiedCells: new Set()
		}
		this.metadata.canvasHeight = 0
	}

	/**
	 * Get current canvas dimensions
	 */
	getCanvasDimensions(): { width: number; height: number } {
		return {
			width: this.metadata.canvasWidth,
			height: this.metadata.canvasHeight
		}
	}
} 