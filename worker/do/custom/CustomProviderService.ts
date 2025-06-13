import { TLAiChange, TLAiResult, TLAiSerializedPrompt } from '@tldraw/ai'
import { TldrawAiBaseService } from '../../TldrawAiBaseService'
import { Environment } from '../../types'

export class CustomProviderService extends TldrawAiBaseService {
	constructor(env: Environment) {
		super(env)
	}

	async generate(prompt: TLAiSerializedPrompt): Promise<TLAiResult> {
		// todo: generate changes based on the prompt and return them all at once
		console.log('######################## GENERATE ########################')
		console.log(prompt)
		return { changes: [] }
	}

	async *stream(prompt: TLAiSerializedPrompt): AsyncGenerator<TLAiChange> {
		// todo: generate changes one-by-one based on the prompt and stream them back
		console.log('######################## STREAM ########################')
		console.log(prompt.canvasContent.shapes)
		const changes: TLAiChange[] = []
		for (const change of changes) {
			yield change
		}
	}
}
