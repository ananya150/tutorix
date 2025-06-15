import { useCallback } from 'react'
import { 
  useWhiteboardContext, 
  type WhiteboardState, 
  type WhiteboardPrompt,
  type WhiteboardItem,
  type SubtopicData,
  type WhiteboardContextType
} from '../contexts/WhiteboardContext'
import { WhiteboardService } from '../services/whiteboardService'

export const useWhiteboardWebhook = (
  streamFunction?: (prompt: string) => Promise<void>,
  repositionCamera: boolean = true
) => {
  const whiteboardContext = useWhiteboardContext()
  const whiteboardService = new WhiteboardService()

  const handleWebhookCall = useCallback(async (subtopicData: SubtopicData) => {
    console.log('Webhook call received for subtopic:', subtopicData.name)
    console.log('Camera repositioning:', repositionCamera ? 'enabled' : 'disabled')
    
    if (!streamFunction) {
      console.error('No stream function provided to useWhiteboardWebhook')
      whiteboardContext.setError('No stream function available for whiteboard execution')
      return
    }
    
    // Start processing in context
    whiteboardContext.startProcessing(subtopicData)

    try {
      // Get current state for API call
      const previousPrompts = whiteboardContext.getPromptHistoryForAPI()
      const currentRow = whiteboardContext.state.currentRow
      
      console.log('Processing whiteboard update for:', subtopicData.name)
      console.log('Current row:', currentRow)
      console.log('Previous prompts count:', previousPrompts.length)
      console.log('Whiteboard items:', subtopicData.whiteboardItems)
      
      // Process the subtopic using the service
      const result = await whiteboardService.processSubtopic(
        subtopicData,
        previousPrompts,
        currentRow,
        streamFunction,
        (promptId, rowsUsed) => {
          // Callback when each prompt is executed
          whiteboardContext.executePrompt(promptId, rowsUsed)
        },
        whiteboardContext.state.sessionId || undefined,
        whiteboardContext.state.lessonId || undefined,
        repositionCamera
      )
      
      // Update context with results
      whiteboardContext.finishProcessing(result.prompts, result.nextRow)
      
      console.log('Webhook processing completed for:', subtopicData.name, {
        promptsGenerated: result.prompts.length,
        nextRow: result.nextRow,
        cameraRepositioning: repositionCamera ? 'enabled' : 'disabled'
      })
      
    } catch (error) {
      console.error('Webhook processing failed:', error)
      whiteboardContext.setError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }, [whiteboardContext, whiteboardService, streamFunction, repositionCamera])

  const handleWebhookCallWithFirstPromptCameraOnly = useCallback(async (
    subtopicData: SubtopicData,
    streamFunctionWithCamera: (prompt: string) => Promise<void>,
    streamFunctionWithoutCamera: (prompt: string) => Promise<void>
  ) => {
    console.log('Webhook call received for subtopic (first-prompt camera only):', subtopicData.name)
    console.log('Camera repositioning: enabled for first prompt only')
    
    if (!streamFunctionWithCamera || !streamFunctionWithoutCamera) {
      console.error('Both stream functions required for first-prompt camera mode')
      whiteboardContext.setError('Stream functions not available for selective camera execution')
      return
    }
    
    // Start processing in context
    whiteboardContext.startProcessing(subtopicData)

    try {
      // Get current state for API call
      const previousPrompts = whiteboardContext.getPromptHistoryForAPI()
      const currentRow = whiteboardContext.state.currentRow
      
      console.log('Processing whiteboard update with selective camera for:', subtopicData.name)
      console.log('Current row:', currentRow)
      console.log('Previous prompts count:', previousPrompts.length)
      console.log('Whiteboard items:', subtopicData.whiteboardItems)
      
      // Process the subtopic using the selective camera method
      const result = await whiteboardService.processSubtopicWithFirstPromptCameraOnly(
        subtopicData,
        previousPrompts,
        currentRow,
        streamFunctionWithCamera,
        streamFunctionWithoutCamera,
        (promptId, rowsUsed) => {
          // Callback when each prompt is executed
          whiteboardContext.executePrompt(promptId, rowsUsed)
        },
        whiteboardContext.state.sessionId || undefined,
        whiteboardContext.state.lessonId || undefined
      )
      
      // Update context with results
      whiteboardContext.finishProcessing(result.prompts, result.nextRow)
      
      console.log('Webhook processing completed (selective camera) for:', subtopicData.name, {
        promptsGenerated: result.prompts.length,
        nextRow: result.nextRow,
        cameraRepositioning: 'first prompt only'
      })
      
    } catch (error) {
      console.error('Webhook processing failed (selective camera):', error)
      whiteboardContext.setError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }, [whiteboardContext, whiteboardService])

  const handleWebhookCallWithConcatenatedStreaming = useCallback(async (
    subtopicData: SubtopicData,
    streamFunction: (concatenatedPrompt: string, repositionCamera: boolean) => Promise<void>
  ) => {
    console.log('Webhook call received for subtopic (concatenated streaming):', subtopicData.name)
    console.log('Camera repositioning: enabled for first prompt only via concatenated streaming')
    
    if (!streamFunction) {
      console.error('Stream function required for concatenated streaming mode')
      whiteboardContext.setError('Stream function not available for concatenated streaming execution')
      return
    }
    
    // Start processing in context
    whiteboardContext.startProcessing(subtopicData)

    try {
      // Get current state for API call
      const previousPrompts = whiteboardContext.getPromptHistoryForAPI()
      const currentRow = whiteboardContext.state.currentRow
      
      console.log('Processing whiteboard update with concatenated streaming for:', subtopicData.name)
      console.log('Current row:', currentRow)
      console.log('Previous prompts count:', previousPrompts.length)
      console.log('Whiteboard items:', subtopicData.whiteboardItems)
      
      // Process the subtopic using the concatenated streaming method
      const result = await whiteboardService.processSubtopicWithConcatenatedStreaming(
        subtopicData,
        previousPrompts,
        currentRow,
        streamFunction,
        (promptId, rowsUsed) => {
          // Callback when each prompt is executed
          whiteboardContext.executePrompt(promptId, rowsUsed)
        },
        whiteboardContext.state.sessionId || undefined,
        whiteboardContext.state.lessonId || undefined
      )
      
      // Update context with results
      whiteboardContext.finishProcessing(result.prompts, result.nextRow)
      
      console.log('Webhook processing completed (concatenated streaming) for:', subtopicData.name, {
        promptsGenerated: result.prompts.length,
        nextRow: result.nextRow,
        cameraRepositioning: 'first prompt only via streaming'
      })
      
    } catch (error) {
      console.error('Webhook processing failed (concatenated streaming):', error)
      whiteboardContext.setError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }, [whiteboardContext, whiteboardService])

  // Legacy compatibility methods
  const updatePromptHistory = useCallback((newPrompts: string[]) => {
    whiteboardContext.addPrompts(newPrompts)
  }, [whiteboardContext])

  const updateCurrentRow = useCallback((newRow: number) => {
    whiteboardContext.setCurrentRow(newRow)
  }, [whiteboardContext])

  const resetState = useCallback(() => {
    whiteboardContext.resetSession()
  }, [whiteboardContext])

  return {
    // New context-based state
    state: whiteboardContext.state,
    context: whiteboardContext,
    
    // Main webhook handlers
    handleWebhookCall,
    handleWebhookCallWithFirstPromptCameraOnly,
    handleWebhookCallWithConcatenatedStreaming,
    
    // Legacy compatibility
    updatePromptHistory,
    updateCurrentRow,
    resetState,
    setState: whiteboardContext.dispatch,
    
    // Additional utilities
    initializeSession: whiteboardContext.initializeSession,
    getProgress: whiteboardContext.getCurrentProgress,
    getPromptHistory: whiteboardContext.getPromptHistoryForAPI,
    clearError: whiteboardContext.clearError
  }
} 