import { useCallback } from 'react'
import { promptStorage, type StoredPrompt } from '../utils/promptStorage'
import { type SubtopicData } from '../contexts/WhiteboardContext'

export interface WhiteboardState {
  isProcessing: boolean
  currentSubtopic: SubtopicData | null
  error: string | null
}

// Simple global state for processing status (only what we need for UI)
let processingState: WhiteboardState = {
  isProcessing: false,
  currentSubtopic: null,
  error: null
}

export const useSimpleWhiteboard = () => {
  
  // Process a subtopic by generating and executing prompts
  const processSubtopic = useCallback(async (
    subtopicData: SubtopicData,
    streamFunction: (concatenatedPrompt: string, repositionCamera: boolean) => Promise<void>
  ) => {
    console.log('🎯 SimpleWhiteboard: Processing subtopic:', subtopicData.name)
    
    // Update processing state
    processingState.isProcessing = true
    processingState.currentSubtopic = subtopicData
    processingState.error = null
    
    try {
      // Get current state from synchronous storage (always fresh!)
      const previousPrompts = promptStorage.getExecutedPromptStrings()
      const currentRow = promptStorage.getCurrentRow()
      
      console.log('📊 SimpleWhiteboard: Current state:', {
        subtopic: subtopicData.name,
        previousPromptsCount: previousPrompts.length,
        currentRow,
        whiteboardItemsCount: subtopicData.whiteboardItems.length
      })
      
      // Use the existing working service with our synchronous storage
      const whiteboardService = new (await import('../services/whiteboardService')).WhiteboardService()
      
      console.log('🌊 SimpleWhiteboard: Using CONCATENATED STREAMING (all prompts in one request)...')
      
      // Use concatenated streaming - all prompts sent together in one request
      const result = await whiteboardService.processSubtopicWithConcatenatedStreaming(
        subtopicData,
        previousPrompts,
        currentRow,
        // Concatenated stream function - receives all prompts combined
        async (concatenatedPrompt: string, repositionCamera: boolean) => {
          console.log('🎯 SimpleWhiteboard: Executing CONCATENATED prompt (camera disabled):', {
            length: concatenatedPrompt.length,
            preview: concatenatedPrompt.substring(0, 200) + '...',
            repositionCamera: false // We force disable camera
          })
          return streamFunction(concatenatedPrompt, false) // Always disable camera repositioning
        },
        (promptId, rowsUsed) => {
          // Store each prompt as it gets executed
          promptStorage.addPrompt({
            prompt: `prompt-${promptId}`, // We'll store a reference
            subtopicIndex: subtopicData.index,
            subtopicName: subtopicData.name,
            executed: true // Mark as executed immediately since the callback means it completed
          })
        },
        promptStorage.getSession().sessionId || undefined,
        promptStorage.getSession().lessonId || undefined
      )
      
      console.log('✅ SimpleWhiteboard: CONCATENATED STREAMING completed - all prompts processed in one request')
      
      // Update current row from the service result
      promptStorage.setCurrentRow(result.nextRow)
      
      console.log('✅ SimpleWhiteboard: Processing completed for:', subtopicData.name)
      
    } catch (error) {
      console.error('❌ SimpleWhiteboard: Processing failed:', error)
      processingState.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      // Reset processing state
      processingState.isProcessing = false
      processingState.currentSubtopic = null
    }
  }, [])

  // Initialize session
  const initializeSession = useCallback((sessionId: string, lessonId: string) => {
    promptStorage.initializeSession(sessionId, lessonId)
  }, [])

  // Reset storage
  const resetSession = useCallback(() => {
    promptStorage.reset()
    processingState.isProcessing = false
    processingState.currentSubtopic = null
    processingState.error = null
  }, [])

  // Get current state
  const getState = useCallback(() => {
    const counts = promptStorage.getCounts()
    const session = promptStorage.getSession()
    
    return {
      ...processingState,
      currentRow: promptStorage.getCurrentRow(),
      promptCounts: counts,
      session
    }
  }, [])

  return {
    processSubtopic,
    initializeSession,
    resetSession,
    getState,
    // Expose storage directly for debugging
    storage: promptStorage
  }
}

// Helper function to generate prompts by calling API
async function generateWhiteboardPrompts(
  subtopicData: SubtopicData,
  previousPrompts: string[],
  currentRow: number
): Promise<{
  prompts: Array<{ id: string, prompt: string, estimatedRows: number }>
  nextRow: number
}> {
  console.log('🔗 Calling generate-whiteboard-prompts API...')
  
  const response = await fetch('/generate-whiteboard-prompts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subtopicData,
      previousPrompts,
      currentRow,
      repositionCamera: true
    })
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  const result = await response.json() as {
    success: boolean
    prompts: Array<{ id: string, prompt: string, estimatedRows: number }>
    nextRow: number
    error?: string
  }
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate prompts')
  }
  
  return {
    prompts: result.prompts,
    nextRow: result.nextRow
  }
}

// Helper function to create concatenated prompt with context from old prompts
function createConcatenatedPromptWithContext(
  newPrompts: Array<{ prompt: string }>,
  previousPrompts: string[]
): string {
  if (newPrompts.length === 0) {
    return ''
  }
  
  // Include context from previous prompts so the model knows what was already created
  let contextSection = ''
  if (previousPrompts.length > 0) {
    const recentPrevious = previousPrompts.slice(-5) // Last 5 for context
    contextSection = `\n\nCONTEXT - Previous content already created on whiteboard:\n${recentPrevious.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nPlease consider this existing content when positioning the new items.\n\n`
  }
  
  const instructions = `You will receive multiple whiteboard creation requests. Please process them in sequence with the following camera behavior:

1. For the FIRST request only: Position the camera optimally to view the content area
2. For ALL subsequent requests: Do NOT reposition the camera, just create the content${contextSection}

Here are the ${newPrompts.length} requests to process:

`
  
  const numberedPrompts = newPrompts.map((prompt, index) => {
    const isFirst = index === 0
    const cameraInstruction = isFirst 
      ? '(REPOSITION CAMERA for optimal viewing)' 
      : '(NO camera repositioning - content only)'
    
    return `${index + 1}. ${cameraInstruction}
${prompt.prompt}

`
  }).join('')
  
  const footer = `
Please process all ${newPrompts.length} requests in sequence. Remember: camera positioning only for the first request, then content-only for the rest.`
  
  return instructions + numberedPrompts + footer
} 