import { ExecutionContext } from '@cloudflare/workers-types'
import { WorkerEntrypoint } from 'cloudflare:workers'
import { AutoRouter, cors, error, IRequest } from 'itty-router'
import { generate } from './routes/generate'
import { generateLesson } from './routes/generate-lesson'
import { generateWhiteboardPrompts } from './routes/generate-whiteboard-prompts'
import { getLesson } from './routes/get-lesson'
import { stream } from './routes/stream'
import { Environment } from './types'

const { preflight, corsify } = cors({ origin: '*' })

// HTML content for SPA fallback
const HTML_CONTENT = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link rel="icon" href="/favicon.ico" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>tldraw ai example</title>
		<script type="module">
			import RefreshRuntime from "/@react-refresh"
			RefreshRuntime.injectIntoGlobalHook(window)
			window.$RefreshReg$ = () => {}
			window.$RefreshSig$ = () => (type) => type
			window.__vite_plugin_react_preamble_installed__ = true
		</script>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/client/main.tsx"></script>
	</body>
</html>`

const router = AutoRouter<IRequest, [env: Environment, ctx: ExecutionContext]>({
	before: [preflight],
	finally: [corsify],
	catch: (e) => {
		console.error(e)
		return error(e)
	},
})
	.post('/generate', generate)
	.post('/generate-lesson', generateLesson)
	.post('/generate-whiteboard-prompts', generateWhiteboardPrompts)
	.get('/api/lesson/:lessonId', getLesson)
	.post('/stream', stream)
	.get('*', (request) => {
		// For all GET requests that don't match API routes, serve the SPA HTML
		const url = new URL(request.url)
		console.log('Serving HTML for path:', url.pathname)
		return new Response(HTML_CONTENT, {
			headers: { 'Content-Type': 'text/html' }
		})
	})

export default class extends WorkerEntrypoint<Environment> {
	override fetch(request: Request): Promise<Response> {
		return router.fetch(request, this.env, this.ctx)
	}
}

// Make the durable object available to the cloudflare worker
export { TldrawAiDurableObject } from './do/TldrawAiDurableObject'
