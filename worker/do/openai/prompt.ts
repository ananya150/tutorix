import { TLAiSerializedPrompt, asMessage } from '@tldraw/ai'
import {
	ChatCompletionContentPart,
	ChatCompletionDeveloperMessageParam,
	ChatCompletionUserMessageParam,
} from 'openai/resources'
import { getSimpleContentFromCanvasContent } from './getSimpleContentFromCanvasContent'
import { getOpenAiSystemPrompt } from './system-prompt'
import { calculateCanvasDimensions } from '../positioning/CanvasCalculator'

/**
 * Build the messages for the prompt.
 */
export function buildPromptMessages(prompt: TLAiSerializedPrompt) {
	const systemPrompt = buildSystemPrompt(prompt)
	console.log("System message done");
	console.log(systemPrompt);
	const developerMessage = buildDeveloperMessage(prompt)
	console.log("Developer message done");
	console.log(developerMessage);
	const userMessage = buildUserMessages(prompt)
	console.log("User message done");
	console.log(userMessage);

	return [systemPrompt, developerMessage, userMessage]
}

/**
 * Build the system prompt.
 */
function buildSystemPrompt(prompt: TLAiSerializedPrompt) {
	// CAMERA REPOSITIONING DISABLED - Always set to false for simplicity
	const repositionCamera = false
	
	// Extract repositionCamera parameter (default to true for backward compatibility)
	// const repositionCamera = (prompt as any).repositionCamera ?? true
	
	return {
		role: 'system',
		content: getOpenAiSystemPrompt(repositionCamera),
	} as const
}

function buildDeveloperMessage(prompt: TLAiSerializedPrompt) {
	const developerMessage: ChatCompletionDeveloperMessageParam & {
		content: Array<ChatCompletionContentPart>
	} = {
		role: 'developer',
		content: [],
	}

	// Get canvas dimensions from the prompt (sent by client)
	const canvasDimensions = (prompt as any).canvasDimensions
	if (canvasDimensions) {
		// Calculate responsive canvas dimensions
		const responsiveCanvas = calculateCanvasDimensions(
			canvasDimensions.width,
			canvasDimensions.height
		)

		developerMessage.content.push({
			type: 'text',
			text: `Canvas Layout Information:
- Window size: ${responsiveCanvas.windowWidth}px × ${responsiveCanvas.windowHeight}px
- Canvas area: ${responsiveCanvas.canvasWidth}px × ${responsiveCanvas.canvasHeight}px
- Horizontal padding: ${responsiveCanvas.horizontalPadding}px on each side
- Top margin: ${responsiveCanvas.topMargin}px
- Row height: ${responsiveCanvas.rowHeight}px

Positioning System:
- Use explicit row numbers (1, 2, 3, etc.)
- Horizontal positions: "left", "center", "right", or custom fractions (0.0-1.0)
- Width specifications: fractions like "1/4", "1/2", percentages like "25%", or pixels like "200px"
- Text alignment within boxes: "left", "center", "right"

Current viewport bounds: x: ${prompt.promptBounds.x}, y: ${prompt.promptBounds.y}, width: ${prompt.promptBounds.w}, height: ${prompt.promptBounds.h}`
		})
	} else {
		// Fallback for compatibility
		developerMessage.content.push({
			type: 'text',
			text: `The user's current viewport is: { x: ${prompt.promptBounds.x}, y: ${prompt.promptBounds.y}, width: ${prompt.promptBounds.w}, height: ${prompt.promptBounds.h} }`,
		})
	}

	// TEMPORARILY DISABLED: Remove existing shapes context to test clean slate approach
	// This will make the AI work without knowledge of existing content
	console.log('🧪 TESTING: Sending EMPTY shapes context to AI (existing content hidden)')
	
	developerMessage.content.push({
		type: 'text',
		text: `Existing shapes in viewport:\n\n[]`,
	})
	
	// Log what we would have sent for comparison
	if (prompt.canvasContent) {
		const simplifiedCanvasContent = getSimpleContentFromCanvasContent(prompt.canvasContent)
		console.log('🔍 HIDDEN from AI - Existing shapes that would normally be sent:', {
			shapeCount: simplifiedCanvasContent.shapes.length,
			shapes: simplifiedCanvasContent.shapes.map((s: any) => ({ 
				id: s.shapeId, 
				type: s.type, 
				text: s.text?.substring(0, 30) + '...' 
			}))
		})
	}
	
	// OLD CODE (COMMENTED OUT FOR TESTING):
	// Add existing shapes context
	// if (prompt.canvasContent) {
	//   const simplifiedCanvasContent = getSimpleContentFromCanvasContent(prompt.canvasContent)
	//   
	//   developerMessage.content.push({
	//     type: 'text',
	//     text: `Existing shapes in viewport:\n\n${JSON.stringify(simplifiedCanvasContent.shapes).replaceAll('\n', ' ')}`,
	//   })
	// }

	return developerMessage
}

/**
 * Build the user messages.
 */
function buildUserMessages(prompt: TLAiSerializedPrompt) {
	const userMessage: ChatCompletionUserMessageParam & {
		content: Array<ChatCompletionContentPart>
	} = {
		role: 'user',
		content: [],
	}

	// If it's an array, push each message as a separate message
	userMessage.content.push({
		type: 'text',
		text: `Using the events provided in the response schema, here's what I want you to do:`,
	})

	for (const message of asMessage(prompt.message)) {
		if (message.type === 'image') {
			userMessage.content.push({
				type: 'image_url',
				image_url: {
					url: message.src!,
				},
			})
		} else {
			userMessage.content.push({
				type: 'text',
				text: message.text,
			})
		}
	}

	return userMessage
}
