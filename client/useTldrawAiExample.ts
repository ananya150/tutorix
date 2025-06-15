import { TLAiChange, TLAiResult, TldrawAiOptions, useTldrawAi } from '@tldraw/ai'
import { Editor } from 'tldraw'
import { ShapeDescriptions } from './transforms/ShapeDescriptions'
import { SimpleCoordinates } from './transforms/SimpleCoordinates'
import { SimpleIds } from './transforms/SimpleIds'

/**
 * A hook that calls `useTldrawAi` with static options.
 *
 * @param editor - (optional) The editor instance to use. If not provided, the hook will try to use the editor from React context.
 */
export function useTldrawAiExample(editor?: Editor) {
	return useTldrawAi({ editor, ...STATIC_TLDRAWAI_OPTIONS })
}

/**
 * A hook that calls `useTldrawAi` with configurable camera positioning.
 *
 * @param editor - (optional) The editor instance to use. If not provided, the hook will try to use the editor from React context.
 * @param repositionCamera - Whether to include camera positioning in AI responses (default: true)
 */
export function useTldrawAiExampleWithCameraControl(editor?: Editor, repositionCamera: boolean = false) {
	const options = getTldrawAiOptionsWithCameraControl(repositionCamera)
	return useTldrawAi({ editor, ...options })
}

/**
 * Get TldrawAi options with configurable camera positioning
 */
export function getTldrawAiOptionsWithCameraControl(repositionCamera: boolean = false): TldrawAiOptions {
	return {
		// Transforms that will be applied to the prompt before it's
		// sent and to changes as they're received.
		transforms: [SimpleIds, ShapeDescriptions, SimpleCoordinates],
		// A function that calls the backend and return generated changes.
		// See worker/do/OpenAiService.ts#generate for the backend part.
		generate: async ({ editor, prompt, signal }) => {
			// Add repositionCamera parameter to the prompt
			const enhancedPrompt = {
				...prompt,
				repositionCamera
			}

			const res = await fetch('/generate', {
				method: 'POST',
				body: JSON.stringify(enhancedPrompt),
				headers: {
					'Content-Type': 'application/json',
				},
				signal,
			})

			const result: TLAiResult = await res.json()

			return result.changes
		},
		// A function similar to `generate` but that will stream changes from
		// the AI as they are ready. See worker/do/OpenAiService.ts#stream for
		// the backend part.
		stream: async function* ({ editor, prompt, signal }) {
			// Add repositionCamera parameter to the prompt
			const enhancedPrompt = {
				...prompt,
				repositionCamera
			}

			const res = await fetch('/stream', {
				method: 'POST',
				body: JSON.stringify(enhancedPrompt),
				headers: {
					'Content-Type': 'application/json',
				},
				signal,
			})

			if (!res.body) {
				throw Error('No body in response')
			}

			const reader = res.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''

			try {
				while (true) {
					const { value, done } = await reader.read()
					if (done) break

					buffer += decoder.decode(value, { stream: true })
					const events = buffer.split('\n\n')
					buffer = events.pop() || ''

					for (const event of events) {
						const match = event.match(/^data: (.+)$/m)
						if (match) {
							try {
								const change = JSON.parse(match[1])
								
								// CAMERA REPOSITIONING DISABLED - Skip all camera events
								if (change.type === 'camera') {
									console.log('📹 Client received camera change (DISABLED):', change)
									console.log('📹 Camera positioning disabled, ignoring camera event')
									
									// Don't yield camera events to the transform pipeline
									continue
								}
								
								// OLD CAMERA HANDLING CODE (COMMENTED OUT FOR SIMPLICITY)
								// if (change.type === 'camera') {
								//   console.log('📹 Client received camera change:', change)
								//   
								//   if (repositionCamera && editor) {
								//     // Get current camera position for comparison
								//     const currentCamera = editor.getCamera()
								//     console.log('📹 Current camera position:', currentCamera)
								//     
								//     // Get viewport bounds for context
								//     const viewportBounds = editor.getViewportPageBounds()
								//     console.log('📹 Current viewport bounds:', viewportBounds)
								//     
								//     // Move the camera to the specified position
								//     const newCameraPosition = {
								//       x: change.camera.x,
								//       y: change.camera.y,
								//       z: change.camera.z
								//     }
								//     
								//     console.log('📹 Setting camera to:', newCameraPosition)
								//     console.log('📹 Expected viewport after move:', {
								//       x: newCameraPosition.x,
								//       y: newCameraPosition.y,
								//       width: viewportBounds.width,
								//       height: viewportBounds.height,
								//       bottom: newCameraPosition.y + viewportBounds.height
								//     })
								//     
								//     editor.setCamera(newCameraPosition, { animation: { duration: 500 } }) // Smooth animation
								//     
								//     // Verify the camera moved
								//     setTimeout(() => {
								//       const verifyCamera = editor.getCamera()
								//       const newViewportBounds = editor.getViewportPageBounds()
								//       console.log('📹 Camera position after setCamera:', verifyCamera)
								//       console.log('📹 New viewport bounds:', newViewportBounds)
								//       console.log('📹 Camera movement delta:', {
								//         deltaX: verifyCamera.x - currentCamera.x,
								//         deltaY: verifyCamera.y - currentCamera.y,
								//         deltaZ: verifyCamera.z - currentCamera.z
								//       })
								//       console.log('📹 Camera movement success:', {
								//         expectedY: newCameraPosition.y,
								//         actualY: verifyCamera.y,
								//         yDifference: Math.abs(verifyCamera.y - newCameraPosition.y),
								//         success: Math.abs(verifyCamera.y - newCameraPosition.y) < 1
								//       })
								//     }, 600) // Wait for animation to complete
								//     
								//     console.log('📹 Camera move command sent')
								//   } else if (!repositionCamera) {
								//     console.log('📹 Camera positioning disabled, ignoring camera event')
								//   } else {
								//     console.warn('📹 No editor available for camera movement')
								//   }
								//   
								//   // Don't yield camera events to the transform pipeline
								//   continue
								// }
								
								// For all other changes, yield them normally
								yield change as TLAiChange
							} catch (err) {
								console.error(err)
								throw Error(`JSON parsing error: ${match[1]}`)
							}
						}
					}
				}
			} catch (err) {
				throw err
			} finally {
				reader.releaseLock()
			}
		},
	}
}

const STATIC_TLDRAWAI_OPTIONS: TldrawAiOptions = {
	// Transforms that will be applied to the prompt before it's
	// sent and to changes as they're received.
	transforms: [SimpleIds, ShapeDescriptions, SimpleCoordinates],
	// A function that calls the backend and return generated changes.
	// See worker/do/OpenAiService.ts#generate for the backend part.
	generate: async ({ editor, prompt, signal }) => {
		const res = await fetch('/generate', {
			method: 'POST',
			body: JSON.stringify(prompt),
			headers: {
				'Content-Type': 'application/json',
			},
			signal,
		})

		const result: TLAiResult = await res.json()

		return result.changes
	},
	// A function similar to `generate` but that will stream changes from
	// the AI as they are ready. See worker/do/OpenAiService.ts#stream for
	// the backend part.
	stream: async function* ({ editor, prompt, signal }) {
		const res = await fetch('/stream', {
			method: 'POST',
			body: JSON.stringify(prompt),
			headers: {
				'Content-Type': 'application/json',
			},
			signal,
		})

		if (!res.body) {
			throw Error('No body in response')
		}

		const reader = res.body.getReader()
		const decoder = new TextDecoder()
		let buffer = ''

		try {
			while (true) {
				const { value, done } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })
				const events = buffer.split('\n\n')
				buffer = events.pop() || ''

				for (const event of events) {
					const match = event.match(/^data: (.+)$/m)
					if (match) {
						try {
							const change = JSON.parse(match[1])
							
							// Handle camera events directly
							if (change.type === 'camera') {
								console.log('📹 Client received camera change:', change)
								
								if (editor) {
									// Get current camera position for comparison
									const currentCamera = editor.getCamera()
									console.log('📹 Current camera position:', currentCamera)
									
									// Get viewport bounds for context
									const viewportBounds = editor.getViewportPageBounds()
									console.log('📹 Current viewport bounds:', viewportBounds)
									
									// Move the camera to the specified position
									const newCameraPosition = {
										x: change.camera.x,
										y: change.camera.y,
										z: change.camera.z
									}
									
									console.log('📹 Setting camera to:', newCameraPosition)
									console.log('📹 Expected viewport after move:', {
										x: newCameraPosition.x,
										y: newCameraPosition.y,
										width: viewportBounds.width,
										height: viewportBounds.height,
										bottom: newCameraPosition.y + viewportBounds.height
									})
									
									editor.setCamera(newCameraPosition, { animation: { duration: 500 } }) // Smooth animation
									
									// Verify the camera moved
									setTimeout(() => {
										const verifyCamera = editor.getCamera()
										const newViewportBounds = editor.getViewportPageBounds()
										console.log('📹 Camera position after setCamera:', verifyCamera)
										console.log('📹 New viewport bounds:', newViewportBounds)
										console.log('📹 Camera movement delta:', {
											deltaX: verifyCamera.x - currentCamera.x,
											deltaY: verifyCamera.y - currentCamera.y,
											deltaZ: verifyCamera.z - currentCamera.z
										})
										console.log('📹 Camera movement success:', {
											expectedY: newCameraPosition.y,
											actualY: verifyCamera.y,
											yDifference: Math.abs(verifyCamera.y - newCameraPosition.y),
											success: Math.abs(verifyCamera.y - newCameraPosition.y) < 1
										})
									}, 600) // Wait for animation to complete
									
									console.log('📹 Camera move command sent')
								} else {
									console.warn('📹 No editor available for camera movement')
								}
								
								// Don't yield camera events to the transform pipeline
								continue
							}
							
							// For all other changes, yield them normally
							yield change as TLAiChange
						} catch (err) {
							console.error(err)
							throw Error(`JSON parsing error: ${match[1]}`)
						}
					}
				}
			}
		} catch (err) {
			throw err
		} finally {
			reader.releaseLock()
		}
	},
}
