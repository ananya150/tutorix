import { ContentType, detectContentType } from './ContentTypes'
import { GridContent } from './GridManager'

export interface DetectionContext {
	recentContent: GridContent[]
	isFirstContent: boolean
	userInstruction?: string
}

export interface DetectionResult {
	contentType: ContentType
	confidence: number // 0-1 scale
	reasoning: string
	extraSpacing?: number // Additional rows to skip for spacing
}

/**
 * Detect spacing requirements from instruction text
 */
export function detectSpacingFromInstruction(instruction: string): number {
	const lowerInstruction = instruction.toLowerCase()
	
	// Keywords that indicate need for extra spacing
	const spacingKeywords = [
		'next paragraph',
		'new paragraph', 
		'new section',
		'next section',
		'skip a line',
		'leave space',
		'add space',
		'blank line',
		'new topic',
		'next topic',
		'start fresh',
		'separate section',
		'break here',
		'space before',
		'gap before'
	]
	
	for (const keyword of spacingKeywords) {
		if (lowerInstruction.includes(keyword)) {
			return 1 // Add 1 extra row for spacing
		}
	}
	
	return 0 // No extra spacing needed
}

/**
 * Enhanced content type detection with instruction parsing
 */
export function detectContentTypeFromInstruction(
	text: string,
	instruction: string,
	context: DetectionContext
): DetectionResult {
	const lowerInstruction = instruction.toLowerCase()
	const lowerText = text.toLowerCase()

	// High confidence explicit instructions
	const explicitMappings: Array<{ keywords: string[], type: ContentType, confidence: number }> = [
		{ keywords: ['title', 'main title', 'lesson title'], type: ContentType.TITLE, confidence: 0.95 },
		{ keywords: ['heading', 'header', 'section'], type: ContentType.HEADING, confidence: 0.9 },
		{ keywords: ['subheading', 'subheader', 'subsection'], type: ContentType.SUBHEADING, confidence: 0.9 },
		{ keywords: ['definition', 'define', 'explanation', 'explain'], type: ContentType.DEFINITION, confidence: 0.85 },
		{ keywords: ['bullet', 'bullet point', 'list item'], type: ContentType.BULLET, confidence: 0.9 },
		{ keywords: ['number', 'numbered', 'step', 'steps'], type: ContentType.NUMBERED, confidence: 0.9 },
		{ keywords: ['formula', 'equation', 'math'], type: ContentType.FORMULA, confidence: 0.95 },
		{ keywords: ['note', 'side note', 'aside', 'comment'], type: ContentType.NOTE, confidence: 0.85 },
		{ keywords: ['example', 'demo', 'demonstration'], type: ContentType.EXAMPLE, confidence: 0.85 },
		{ keywords: ['summary', 'conclusion', 'recap'], type: ContentType.SUMMARY, confidence: 0.9 }
	]

	// Detect spacing requirements
	const extraSpacing = detectSpacingFromInstruction(instruction)

	// Check for explicit instructions
	for (const mapping of explicitMappings) {
		for (const keyword of mapping.keywords) {
			if (lowerInstruction.includes(keyword)) {
				return {
					contentType: mapping.type,
					confidence: mapping.confidence,
					reasoning: `Explicit instruction contains "${keyword}" indicating ${mapping.type} content type`,
					extraSpacing
				}
			}
		}
	}

	// Context-based detection
	if (context.isFirstContent && text.length < 100) {
		return {
			contentType: ContentType.TITLE,
			confidence: 0.8,
			reasoning: 'First content on empty canvas, likely a title',
			extraSpacing
		}
	}

	// Pattern-based detection with medium confidence
	const patternDetections: Array<{ pattern: RegExp | ((text: string) => boolean), type: ContentType, confidence: number, reasoning: string }> = [
		{
			pattern: (text) => text.includes('=') || text.includes('+') || text.includes('∑') || text.includes('∫') || /\b\d+\s*[+\-*/]\s*\d+/.test(text),
			type: ContentType.FORMULA,
			confidence: 0.85,
			reasoning: 'Text contains mathematical symbols or expressions'
		},
		{
			pattern: /^•|^-|^\*/,
			type: ContentType.BULLET,
			confidence: 0.8,
			reasoning: 'Text starts with bullet point marker'
		},
		{
			pattern: /^\d+\./,
			type: ContentType.NUMBERED,
			confidence: 0.8,
			reasoning: 'Text starts with number and period'
		},
		{
			pattern: (text) => text.includes(':') && text.split(':')[0].length < 30,
			type: ContentType.DEFINITION,
			confidence: 0.7,
			reasoning: 'Text contains colon with short prefix, likely a definition'
		},
		{
			pattern: (text) => text.length < 50 && !text.includes('.') && !text.includes(','),
			type: ContentType.HEADING,
			confidence: 0.6,
			reasoning: 'Short text without punctuation, likely a heading'
		}
	]

	for (const detection of patternDetections) {
		const matches = typeof detection.pattern === 'function' 
			? detection.pattern(text)
			: detection.pattern.test(text)
		
		if (matches) {
			return {
				contentType: detection.type,
				confidence: detection.confidence,
				reasoning: detection.reasoning,
				extraSpacing
			}
		}
	}

	// Contextual flow detection
	if (context.recentContent.length > 0) {
		const lastContent = context.recentContent[0] // Most recent
		
		// Follow logical educational flow
		if (lastContent.contentType === ContentType.TITLE.toString()) {
			return {
				contentType: ContentType.HEADING,
				confidence: 0.7,
				reasoning: 'Following title with heading maintains educational flow',
				extraSpacing
			}
		}
		
		if (lastContent.contentType === ContentType.HEADING.toString()) {
			return {
				contentType: ContentType.DEFINITION,
				confidence: 0.6,
				reasoning: 'Following heading with definition is common educational pattern',
				extraSpacing
			}
		}
		
		if (lastContent.contentType === ContentType.DEFINITION.toString()) {
			return {
				contentType: ContentType.BULLET,
				confidence: 0.6,
				reasoning: 'Following definition with bullet points for elaboration',
				extraSpacing
			}
		}
	}

	// Default fallback
	return {
		contentType: ContentType.DEFINITION,
		confidence: 0.4,
		reasoning: 'Default to definition for general explanatory text',
		extraSpacing
	}
}

/**
 * Validate content type detection result
 */
export function validateDetection(
	detection: DetectionResult,
	text: string,
	context: DetectionContext
): DetectionResult {
	// Confidence threshold checks
	if (detection.confidence < 0.5) {
		// Low confidence, try alternative detection
		const fallback = detectContentType(text, context.userInstruction, {
			recentContent: context.recentContent.map(c => ({ contentType: c.contentType })),
			isFirstContent: context.isFirstContent
		})
		
		return {
			contentType: fallback,
			confidence: 0.5,
			reasoning: `Low confidence detection, using fallback: ${fallback}`
		}
	}

	// Logical validation
	if (detection.contentType === ContentType.TITLE && !context.isFirstContent && context.recentContent.length > 0) {
		// Multiple titles might not make sense
		return {
			contentType: ContentType.HEADING,
			confidence: Math.max(0.6, detection.confidence - 0.2),
			reasoning: 'Adjusted from title to heading - multiple titles uncommon'
		}
	}

	return detection
}

/**
 * Get content type with full analysis
 */
export function analyzeContentType(
	text: string,
	instruction: string,
	context: DetectionContext
): {
	detection: DetectionResult
	alternatives: DetectionResult[]
	recommendation: string
} {
	const primary = detectContentTypeFromInstruction(text, instruction, context)
	const validated = validateDetection(primary, text, context)
	
	// Generate alternatives
	const alternatives: DetectionResult[] = []
	
	// Try different detection methods for alternatives
	const basicDetection = detectContentType(text, instruction, {
		recentContent: context.recentContent.map(c => ({ contentType: c.contentType })),
		isFirstContent: context.isFirstContent
	})
	
	if (basicDetection !== validated.contentType) {
		alternatives.push({
			contentType: basicDetection,
			confidence: 0.5,
			reasoning: 'Alternative from basic pattern detection'
		})
	}

	// Educational flow alternatives
	if (context.recentContent.length > 0) {
		const lastType = context.recentContent[0].contentType
		const flowAlternatives = getEducationalFlowAlternatives(lastType as ContentType)
		
		for (const alt of flowAlternatives) {
			if (alt !== validated.contentType) {
				alternatives.push({
					contentType: alt,
					confidence: 0.4,
					reasoning: `Educational flow alternative after ${lastType}`
				})
			}
		}
	}

	const recommendation = generateRecommendation(validated, alternatives, context)

	return {
		detection: validated,
		alternatives: alternatives.slice(0, 3), // Limit to top 3
		recommendation
	}
}

/**
 * Get logical next content types based on educational flow
 */
function getEducationalFlowAlternatives(lastType: ContentType): ContentType[] {
	const flowMap: Record<ContentType, ContentType[]> = {
		[ContentType.TITLE]: [ContentType.HEADING, ContentType.DEFINITION],
		[ContentType.HEADING]: [ContentType.SUBHEADING, ContentType.DEFINITION, ContentType.BULLET],
		[ContentType.SUBHEADING]: [ContentType.DEFINITION, ContentType.BULLET, ContentType.EXAMPLE],
		[ContentType.DEFINITION]: [ContentType.BULLET, ContentType.NUMBERED, ContentType.EXAMPLE],
		[ContentType.BULLET]: [ContentType.BULLET, ContentType.EXAMPLE, ContentType.DEFINITION],
		[ContentType.NUMBERED]: [ContentType.NUMBERED, ContentType.EXAMPLE, ContentType.SUMMARY],
		[ContentType.FORMULA]: [ContentType.DEFINITION, ContentType.EXAMPLE, ContentType.NOTE],
		[ContentType.NOTE]: [ContentType.DEFINITION, ContentType.EXAMPLE],
		[ContentType.EXAMPLE]: [ContentType.BULLET, ContentType.SUMMARY, ContentType.HEADING],
		[ContentType.SUMMARY]: [ContentType.HEADING, ContentType.TITLE]
	}
	
	return flowMap[lastType] || [ContentType.DEFINITION]
}

/**
 * Generate recommendation text
 */
function generateRecommendation(
	primary: DetectionResult,
	alternatives: DetectionResult[],
	context: DetectionContext
): string {
	let recommendation = `Detected as ${primary.contentType} (${Math.round(primary.confidence * 100)}% confidence). ${primary.reasoning}.`
	
	if (alternatives.length > 0) {
		const topAlt = alternatives[0]
		recommendation += ` Alternative: ${topAlt.contentType} if this is ${topAlt.reasoning.toLowerCase()}.`
	}
	
	if (context.recentContent.length > 0) {
		const lastType = context.recentContent[0].contentType
		recommendation += ` Following ${lastType} content.`
	}
	
	return recommendation
} 