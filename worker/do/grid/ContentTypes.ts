export enum ContentType {
	TITLE = 'title',
	HEADING = 'heading',
	SUBHEADING = 'subheading',
	DEFINITION = 'definition',
	BULLET = 'bullet',
	NUMBERED = 'numbered',
	FORMULA = 'formula',
	NOTE = 'note',
	EXAMPLE = 'example',
	SUMMARY = 'summary'
}

export interface ContentTypeSpacing {
	top: number // rows above
	bottom: number // rows below
}

export interface ContentTypeLayout {
	columnStart: number // 1-12
	columnEnd: number // 1-12
	alignment: 'start' | 'middle' | 'end'
	fontSize: 'small' | 'normal' | 'medium' | 'large' | 'xlarge'
	fontWeight: 'normal' | 'medium' | 'semibold' | 'bold'
	fontStyle?: 'normal' | 'italic'
	fontFamily?: 'default' | 'monospace'
	color: string
	backgroundColor?: string
	border?: 'none' | 'top' | 'bottom' | 'full'
	spacing: ContentTypeSpacing
	prefix?: string // for bullets, numbers, etc.
	autoNumber?: boolean // for numbered lists
}

export const CONTENT_TYPE_LAYOUTS: Record<ContentType, ContentTypeLayout> = {
	[ContentType.TITLE]: {
		columnStart: 3,
		columnEnd: 10,
		alignment: 'middle',
		fontSize: 'xlarge',
		fontWeight: 'bold',
		color: 'black',
		spacing: { top: 1, bottom: 2 }
	},

	[ContentType.HEADING]: {
		columnStart: 2,
		columnEnd: 11,
		alignment: 'start',
		fontSize: 'large',
		fontWeight: 'bold',
		color: 'black',
		spacing: { top: 1, bottom: 1 }
	},

	[ContentType.SUBHEADING]: {
		columnStart: 3,
		columnEnd: 11,
		alignment: 'start',
		fontSize: 'medium',
		fontWeight: 'semibold',
		color: 'black',
		spacing: { top: 0, bottom: 0 }
	},

	[ContentType.DEFINITION]: {
		columnStart: 1,
		columnEnd: 12,
		alignment: 'start',
		fontSize: 'normal',
		fontWeight: 'normal',
		color: 'black',
		spacing: { top: 0, bottom: 1 }
	},

	[ContentType.BULLET]: {
		columnStart: 2,
		columnEnd: 12,
		alignment: 'start',
		fontSize: 'normal',
		fontWeight: 'normal',
		color: 'black',
		spacing: { top: 0, bottom: 0 },
		prefix: '•'
	},

	[ContentType.NUMBERED]: {
		columnStart: 2,
		columnEnd: 12,
		alignment: 'start',
		fontSize: 'normal',
		fontWeight: 'normal',
		color: 'black',
		spacing: { top: 0, bottom: 0 },
		autoNumber: true
	},

	[ContentType.FORMULA]: {
		columnStart: 4,
		columnEnd: 9,
		alignment: 'middle',
		fontSize: 'normal',
		fontWeight: 'normal',
		fontFamily: 'monospace',
		color: 'black',
		spacing: { top: 1, bottom: 1 }
	},

	[ContentType.NOTE]: {
		columnStart: 8,
		columnEnd: 12,
		alignment: 'start',
		fontSize: 'small',
		fontWeight: 'normal',
		fontStyle: 'italic',
		color: 'grey',
		spacing: { top: 0, bottom: 0 }
	},

	[ContentType.EXAMPLE]: {
		columnStart: 2,
		columnEnd: 11,
		alignment: 'start',
		fontSize: 'normal',
		fontWeight: 'normal',
		color: 'black',
		backgroundColor: 'light-grey',
		spacing: { top: 1, bottom: 1 }
	},

	[ContentType.SUMMARY]: {
		columnStart: 1,
		columnEnd: 12,
		alignment: 'start',
		fontSize: 'normal',
		fontWeight: 'medium',
		color: 'black',
		border: 'top',
		spacing: { top: 2, bottom: 1 }
	}
}

/**
 * Get layout configuration for a content type
 */
export function getContentTypeLayout(contentType: ContentType): ContentTypeLayout {
	return CONTENT_TYPE_LAYOUTS[contentType]
}

/**
 * Get column span for a content type
 */
export function getContentTypeColumnSpan(contentType: ContentType): number {
	const layout = getContentTypeLayout(contentType)
	return layout.columnEnd - layout.columnStart + 1
}

/**
 * Detect content type from text and context
 */
export function detectContentType(
	text: string,
	instruction?: string,
	context?: {
		recentContent: Array<{ contentType: string }>
		isFirstContent: boolean
	}
): ContentType {
	const lowerText = text.toLowerCase()
	const lowerInstruction = instruction?.toLowerCase() || ''

	// Explicit instruction-based detection
	if (lowerInstruction.includes('title') || lowerInstruction.includes('main heading')) {
		return ContentType.TITLE
	}
	if (lowerInstruction.includes('heading') || lowerInstruction.includes('section')) {
		return ContentType.HEADING
	}
	if (lowerInstruction.includes('subheading') || lowerInstruction.includes('subsection')) {
		return ContentType.SUBHEADING
	}
	if (lowerInstruction.includes('definition') || lowerInstruction.includes('define')) {
		return ContentType.DEFINITION
	}
	if (lowerInstruction.includes('bullet') || lowerInstruction.includes('list')) {
		return ContentType.BULLET
	}
	if (lowerInstruction.includes('number') || lowerInstruction.includes('step')) {
		return ContentType.NUMBERED
	}
	if (lowerInstruction.includes('formula') || lowerInstruction.includes('equation')) {
		return ContentType.FORMULA
	}
	if (lowerInstruction.includes('note') || lowerInstruction.includes('aside')) {
		return ContentType.NOTE
	}
	if (lowerInstruction.includes('example') || lowerInstruction.includes('demo')) {
		return ContentType.EXAMPLE
	}
	if (lowerInstruction.includes('summary') || lowerInstruction.includes('conclusion')) {
		return ContentType.SUMMARY
	}

	// Context-based detection
	if (context?.isFirstContent) {
		return ContentType.TITLE
	}

	// Text pattern-based detection
	if (text.length < 50 && !text.includes('.') && !text.includes(',')) {
		// Short text without punctuation - likely a heading
		return ContentType.HEADING
	}

	if (text.includes('=') || text.includes('+') || text.includes('∑') || text.includes('∫')) {
		return ContentType.FORMULA
	}

	if (text.startsWith('•') || text.startsWith('-') || text.startsWith('*')) {
		return ContentType.BULLET
	}

	if (/^\d+\./.test(text)) {
		return ContentType.NUMBERED
	}

	if (text.includes(':') && text.split(':')[0].length < 30) {
		return ContentType.DEFINITION
	}

	// Default to definition for longer explanatory text
	return ContentType.DEFINITION
}

/**
 * Apply content type styling to text
 */
export function applyContentTypeStyling(
	text: string,
	contentType: ContentType,
	context?: {
		numberInSequence?: number
	}
): string {
	const layout = getContentTypeLayout(contentType)
	let styledText = text

	// Apply prefix
	if (layout.prefix) {
		styledText = `${layout.prefix} ${text}`
	}

	// Apply auto-numbering
	if (layout.autoNumber && context?.numberInSequence) {
		styledText = `${context.numberInSequence}. ${text}`
	}

	return styledText
}

/**
 * Get content type description for AI context
 */
export function getContentTypeDescription(contentType: ContentType): string {
	const descriptions: Record<ContentType, string> = {
		[ContentType.TITLE]: 'Main lesson title, centered and prominent',
		[ContentType.HEADING]: 'Major section header, left-aligned and bold',
		[ContentType.SUBHEADING]: 'Subsection header, indented and medium weight',
		[ContentType.DEFINITION]: 'Key definition or explanation, full width',
		[ContentType.BULLET]: 'Bullet point item, indented with bullet prefix',
		[ContentType.NUMBERED]: 'Numbered list item, indented with auto-numbering',
		[ContentType.FORMULA]: 'Mathematical formula, centered and monospace',
		[ContentType.NOTE]: 'Side note or clarification, right-aligned and italic',
		[ContentType.EXAMPLE]: 'Example or demonstration, highlighted background',
		[ContentType.SUMMARY]: 'Summary or conclusion, full width with top border'
	}
	return descriptions[contentType]
}

/**
 * Get all available content types for AI context
 */
export function getAllContentTypes(): Array<{
	type: ContentType
	description: string
	layout: ContentTypeLayout
}> {
	return Object.values(ContentType).map(type => ({
		type,
		description: getContentTypeDescription(type),
		layout: getContentTypeLayout(type)
	}))
} 