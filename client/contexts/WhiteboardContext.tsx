import React, { createContext, useContext, useReducer, ReactNode } from 'react'

export interface WhiteboardItem {
  text: string
  type: 'title' | 'heading' | 'subheading' | 'definition' | 'bullet' | 'formula' | 'example' | 'note'
}

export interface SubtopicData {
  index: number
  name: string
  summary: string
  durationSec: number
  whiteboardItems: WhiteboardItem[]
}

export interface WhiteboardPrompt {
  id: string
  prompt: string
  subtopicIndex: number
  subtopicName: string
  timestamp: Date
  executed: boolean
  rowsUsed: number[]
}

export interface WhiteboardState {
  // Current state
  isProcessing: boolean
  currentSubtopic: SubtopicData | null
  currentRow: number
  lastProcessedIndex: number
  
  // Prompt management
  promptHistory: WhiteboardPrompt[]
  pendingPrompts: string[]
  
  // Session tracking
  sessionId: string | null
  lessonId: string | null
  totalSubtopics: number
  
  // Error handling
  lastError: string | null
  retryCount: number
}

type WhiteboardAction =
  | { type: 'START_PROCESSING'; payload: SubtopicData }
  | { type: 'FINISH_PROCESSING'; payload: { prompts: WhiteboardPrompt[]; nextRow: number } }
  | { type: 'ADD_PROMPTS'; payload: string[] }
  | { type: 'EXECUTE_PROMPT'; payload: { promptId: string; rowsUsed: number[] } }
  | { type: 'SET_CURRENT_ROW'; payload: number }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_SESSION' }
  | { type: 'INITIALIZE_SESSION'; payload: { sessionId: string; lessonId: string; totalSubtopics: number } }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' }

const initialState: WhiteboardState = {
  isProcessing: false,
  currentSubtopic: null,
  currentRow: 1,
  lastProcessedIndex: 0,
  promptHistory: [],
  pendingPrompts: [],
  sessionId: null,
  lessonId: null,
  totalSubtopics: 0,
  lastError: null,
  retryCount: 0
}

function whiteboardReducer(state: WhiteboardState, action: WhiteboardAction): WhiteboardState {
  switch (action.type) {
    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        currentSubtopic: action.payload,
        lastError: null
      }
    
    case 'FINISH_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        promptHistory: [...state.promptHistory, ...action.payload.prompts],
        currentRow: action.payload.nextRow,
        lastProcessedIndex: state.currentSubtopic?.index || state.lastProcessedIndex,
        retryCount: 0
      }
    
    case 'ADD_PROMPTS':
      return {
        ...state,
        pendingPrompts: [...state.pendingPrompts, ...action.payload]
      }
    
    case 'EXECUTE_PROMPT':
      return {
        ...state,
        promptHistory: state.promptHistory.map(prompt =>
          prompt.id === action.payload.promptId
            ? { ...prompt, executed: true, rowsUsed: action.payload.rowsUsed }
            : prompt
        ),
        pendingPrompts: state.pendingPrompts.filter((_, index) => index !== 0) // Remove first pending
      }
    
    case 'SET_CURRENT_ROW':
      return {
        ...state,
        currentRow: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        lastError: action.payload,
        isProcessing: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        lastError: null,
        retryCount: 0
      }
    
    case 'INITIALIZE_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        lessonId: action.payload.lessonId,
        totalSubtopics: action.payload.totalSubtopics
      }
    
    case 'RESET_SESSION':
      return {
        ...initialState
      }
    
    case 'INCREMENT_RETRY':
      return {
        ...state,
        retryCount: state.retryCount + 1
      }
    
    case 'RESET_RETRY':
      return {
        ...state,
        retryCount: 0
      }
    
    default:
      return state
  }
}

export interface WhiteboardContextType {
  state: WhiteboardState
  dispatch: React.Dispatch<WhiteboardAction>
  
  // Helper functions
  startProcessing: (subtopic: SubtopicData) => void
  finishProcessing: (prompts: WhiteboardPrompt[], nextRow: number) => void
  addPrompts: (prompts: string[]) => void
  executePrompt: (promptId: string, rowsUsed: number[]) => void
  setCurrentRow: (row: number) => void
  setError: (error: string) => void
  clearError: () => void
  initializeSession: (sessionId: string, lessonId: string, totalSubtopics: number) => void
  resetSession: () => void
  
  // Computed values
  getPromptHistoryForAPI: () => string[]
  getCurrentProgress: () => { completed: number; total: number; percentage: number }
  getLastNPrompts: (n: number) => WhiteboardPrompt[]
}

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined)

export function WhiteboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(whiteboardReducer, initialState)
  
  // Helper functions
  const startProcessing = (subtopic: SubtopicData) => {
    dispatch({ type: 'START_PROCESSING', payload: subtopic })
  }
  
  const finishProcessing = (prompts: WhiteboardPrompt[], nextRow: number) => {
    dispatch({ type: 'FINISH_PROCESSING', payload: { prompts, nextRow } })
  }
  
  const addPrompts = (prompts: string[]) => {
    dispatch({ type: 'ADD_PROMPTS', payload: prompts })
  }
  
  const executePrompt = (promptId: string, rowsUsed: number[]) => {
    dispatch({ type: 'EXECUTE_PROMPT', payload: { promptId, rowsUsed } })
  }
  
  const setCurrentRow = (row: number) => {
    dispatch({ type: 'SET_CURRENT_ROW', payload: row })
  }
  
  const setError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }
  
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }
  
  const initializeSession = (sessionId: string, lessonId: string, totalSubtopics: number) => {
    dispatch({ type: 'INITIALIZE_SESSION', payload: { sessionId, lessonId, totalSubtopics } })
  }
  
  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' })
  }
  
  // Computed values
  const getPromptHistoryForAPI = (): string[] => {
    return state.promptHistory
      .filter(p => p.executed)
      .map(p => p.prompt)
  }
  
  const getCurrentProgress = () => {
    const completed = state.lastProcessedIndex
    const total = state.totalSubtopics
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completed, total, percentage }
  }
  
  const getLastNPrompts = (n: number): WhiteboardPrompt[] => {
    return state.promptHistory
      .filter(p => p.executed)
      .slice(-n)
  }
  
  const contextValue: WhiteboardContextType = {
    state,
    dispatch,
    startProcessing,
    finishProcessing,
    addPrompts,
    executePrompt,
    setCurrentRow,
    setError,
    clearError,
    initializeSession,
    resetSession,
    getPromptHistoryForAPI,
    getCurrentProgress,
    getLastNPrompts
  }
  
  return (
    <WhiteboardContext.Provider value={contextValue}>
      {children}
    </WhiteboardContext.Provider>
  )
}

export function useWhiteboardContext() {
  const context = useContext(WhiteboardContext)
  if (context === undefined) {
    throw new Error('useWhiteboardContext must be used within a WhiteboardProvider')
  }
  return context
}

// Utility function to generate unique IDs for prompts
export function generatePromptId(): string {
  return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
} 