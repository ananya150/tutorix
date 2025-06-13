import { useTldrawAi } from '@tldraw/ai'
import { Editor } from 'tldraw'

const STATIC_TLDRAWAI_OPTIONS = {
	apiUrl: '/api',
	maxResponseLength: 4000,
}

export function useTldrawAiExample(editor?: Editor) {
	return useTldrawAi({ editor, ...STATIC_TLDRAWAI_OPTIONS })
} 