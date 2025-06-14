import { useState, useCallback } from 'react'

interface WhiteboardItem {
  text: string
  type: 'title' | 'heading' | 'subheading' | 'definition' | 'bullet' | 'formula' | 'example' | 'note'
}

interface SubtopicData {
  index: number
  name: string
  summary: string
  durationSec: number
  whiteboardItems: WhiteboardItem[]
}

interface WebhookState {
  isProcessing: boolean
  currentSubtopic: SubtopicData | null
  promptHistory: string[]
  currentRow: number
  lastProcessedIndex: number
}

export const useWhiteboardWebhook = () => {
  const [state, setState] = useState<WebhookState>({
    isProcessing: false,
    currentSubtopic: null,
    promptHistory: [],
    currentRow: 1,
    lastProcessedIndex: 0
  })

  const handleWebhookCall = useCallback(async (subtopicData: SubtopicData) => {
    console.log('Webhook call received for subtopic:', subtopicData.name)
    
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      currentSubtopic: subtopicData 
    }))

    try {
      // This will be implemented in Step 3 - for now just log
      console.log('Processing whiteboard update for:', subtopicData)
      console.log('Current row:', state.currentRow)
      console.log('Whiteboard items:', subtopicData.whiteboardItems)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update state after processing
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastProcessedIndex: subtopicData.index,
        currentRow: prev.currentRow + subtopicData.whiteboardItems.length + 2 // Add spacing
      }))
      
      console.log('Webhook processing completed for:', subtopicData.name)
      
    } catch (error) {
      console.error('Webhook processing failed:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [state.currentRow])

  const updatePromptHistory = useCallback((newPrompts: string[]) => {
    setState(prev => ({
      ...prev,
      promptHistory: [...prev.promptHistory, ...newPrompts]
    }))
  }, [])

  const updateCurrentRow = useCallback((newRow: number) => {
    setState(prev => ({
      ...prev,
      currentRow: newRow
    }))
  }, [])

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      currentSubtopic: null,
      promptHistory: [],
      currentRow: 1,
      lastProcessedIndex: 0
    })
  }, [])

  return {
    state,
    handleWebhookCall,
    updatePromptHistory,
    updateCurrentRow,
    resetState,
    setState
  }
} 