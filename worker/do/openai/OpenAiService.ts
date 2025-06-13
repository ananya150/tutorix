import { TLAiChange, TLAiResult, TLAiSerializedPrompt } from '@tldraw/ai'
import OpenAI from 'openai'
import { TldrawAiBaseService } from '../../TldrawAiBaseService'
import { Environment } from '../../types'
import { generateEvents } from './generate'
import { getTldrawAiChangesFromSimpleEvents } from './getTldrawAiChangesFromSimpleEvents'
import { streamEvents } from './stream'
import { GridManager } from '../grid/GridManager'

export class OpenAiService extends TldrawAiBaseService {
	openai: OpenAI
	gridManager?: GridManager

	constructor(env: Environment, gridManager?: GridManager) {
		super(env)
		this.openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		})
		this.gridManager = gridManager
	}

	async generate(prompt: TLAiSerializedPrompt): Promise<TLAiResult> {
		const events = await generateEvents(this.openai, prompt, this.gridManager)
		if (this.env.LOG_LEVEL === 'debug') console.log(events)
		const changes = events.map((event) => getTldrawAiChangesFromSimpleEvents(prompt, event, this.gridManager)).flat()
		console.log('######################## GENERATE ########################')
		console.log(changes)
		return { changes }
	}

	async *stream(prompt: TLAiSerializedPrompt): AsyncGenerator<TLAiChange> {
		for await (const simpleEvent of streamEvents(this.openai, prompt, this.gridManager)) {
			if (this.env.LOG_LEVEL === 'debug') console.log(simpleEvent)
			for (const change of getTldrawAiChangesFromSimpleEvents(prompt, simpleEvent, this.gridManager)) {
				console.log('######################## STREAM ########################')
				console.log(change)
				yield change
			}
		}
	}
}
