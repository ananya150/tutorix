import { TLAiSerializedPrompt, asMessage } from '@tldraw/ai'
import {
	ChatCompletionContentPart,
	ChatCompletionDeveloperMessageParam,
	ChatCompletionUserMessageParam,
} from 'openai/resources'
import { getSimpleContentFromCanvasContent } from './getSimpleContentFromCanvasContent'
import { OPENAI_SYSTEM_PROMPT } from './system-prompt'
import { GridManager } from '../grid/GridManager'
import { getAllContentTypes } from '../grid/ContentTypes'

/**
 * Build the messages for the prompt.
 */
export function buildPromptMessages(prompt: TLAiSerializedPrompt, gridManager?: GridManager) {
	const systemPrompt = buildSystemPrompt(prompt)
	const developerMessage = buildDeveloperMessage(prompt, gridManager)
	const userMessage = buildUserMessages(prompt)

	return [systemPrompt, developerMessage, userMessage]
}

/**
 * Build the system prompt.
 */
function buildSystemPrompt(_prompt: TLAiSerializedPrompt) {
	return {
		role: 'system',
		content: OPENAI_SYSTEM_PROMPT,
	} as const
}

function buildDeveloperMessage(prompt: TLAiSerializedPrompt, gridManager?: GridManager) {
	const developerMessage: ChatCompletionDeveloperMessageParam & {
		content: Array<ChatCompletionContentPart>
	} = {
		role: 'developer',
		content: [],
	}

	if (gridManager) {
		// Use simplified grid context instead of full canvas
		const gridState = gridManager.getCurrentGridState()
		
		developerMessage.content.push({
			type: 'text',
			text: `Grid Context:
- Current row: ${gridState.currentRow}
- Total columns: ${gridState.availableSpace.totalColumns}
- Row height: ${gridState.availableSpace.rowHeight}px

Recent content (last 3 items):
${gridState.recentContent.length > 0 
	? gridState.recentContent.map(item => 
		`- Row ${item.row}, Cols ${item.columnStart}-${item.columnEnd}: "${item.text}" (${item.contentType})`
	).join('\n')
	: '- No recent content (empty canvas)'
}

Available content types and their layouts:
${getAllContentTypes().map(ct => 
	`- ${ct.type}: ${ct.description} (columns ${ct.layout.columnStart}-${ct.layout.columnEnd})`
).join('\n')}`
		})
	} else {
		// Fallback to old system for compatibility
		developerMessage.content.push({
			type: 'text',
			text: `The user\'s current viewport is: { x: ${prompt.promptBounds.x}, y: ${prompt.promptBounds.y}, width: ${prompt.promptBounds.w}, height: ${prompt.promptBounds.h} }`,
		})

		if (prompt.canvasContent) {
			const simplifiedCanvasContent = getSimpleContentFromCanvasContent(prompt.canvasContent)

			developerMessage.content.push({
				type: 'text',
				text: `Here are all of the shapes that are in the user's current viewport:\n\n${JSON.stringify(simplifiedCanvasContent.shapes).replaceAll('\n', ' ')}`,
			})
		}
	}

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

	if (prompt.image) {
		userMessage.content.push(
			{
				type: 'image_url',
				image_url: {
					detail: 'auto',
					url: prompt.image,
				},
			},
			{
				type: 'text',
				text: 'Here is a screenshot of the my current viewport.',
			}
		)
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
