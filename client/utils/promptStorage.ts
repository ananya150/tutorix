// Simple synchronous storage for prompt history
// This replaces the complex WhiteboardContext to avoid state synchronization issues

export interface StoredPrompt {
  id: string
  prompt: string
  subtopicIndex: number
  subtopicName: string
  timestamp: number
  executed: boolean
}

export interface PromptStorage {
  prompts: StoredPrompt[]
  currentRow: number
  sessionId: string | null
  lessonId: string | null
}

// Global storage instance
let storage: PromptStorage = {
  prompts: [],
  currentRow: 1,
  sessionId: null,
  lessonId: null
}

export const promptStorage = {
  // Get all prompts
  getAll(): StoredPrompt[] {
    return [...storage.prompts]
  },

  // Get only executed prompts
  getExecuted(): StoredPrompt[] {
    return storage.prompts.filter(p => p.executed)
  },

  // Get executed prompts as simple string array (for API calls)
  getExecutedPromptStrings(): string[] {
    return storage.prompts
      .filter(p => p.executed)
      .map(p => p.prompt)
  },

  // Get last N executed prompts
  getLastNExecuted(n: number): StoredPrompt[] {
    return storage.prompts
      .filter(p => p.executed)
      .slice(-n)
  },

  // Add a new prompt
  addPrompt(prompt: Omit<StoredPrompt, 'id' | 'timestamp'>): string {
    const id = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newPrompt: StoredPrompt = {
      ...prompt,
      id,
      timestamp: Date.now()
    }
    
    storage.prompts.push(newPrompt)
    console.log('💾 Stored prompt:', { id, subtopic: prompt.subtopicName, executed: prompt.executed })
    return id
  },

  // Mark prompt as executed
  markExecuted(promptId: string): void {
    const prompt = storage.prompts.find(p => p.id === promptId)
    if (prompt) {
      prompt.executed = true
      console.log('✅ Marked prompt as executed:', promptId)
    }
  },

  // Get current row
  getCurrentRow(): number {
    return storage.currentRow
  },

  // Set current row
  setCurrentRow(row: number): void {
    storage.currentRow = row
    console.log('📍 Set current row:', row)
  },

  // Initialize session
  initializeSession(sessionId: string, lessonId: string): void {
    storage.sessionId = sessionId
    storage.lessonId = lessonId
    console.log('🔧 Initialized session:', { sessionId, lessonId })
  },

  // Reset all storage
  reset(): void {
    storage = {
      prompts: [],
      currentRow: 1,
      sessionId: null,
      lessonId: null
    }
    console.log('🧹 Reset prompt storage')
  },

  // Get session info
  getSession(): { sessionId: string | null, lessonId: string | null } {
    return {
      sessionId: storage.sessionId,
      lessonId: storage.lessonId
    }
  },

  // Get prompt history summary for context
  getPromptHistoryContext(): string {
    const executed = storage.prompts.filter(p => p.executed)
    const recent = executed.slice(-10) // Last 10 executed prompts
    
    if (recent.length === 0) {
      return 'No previous prompts executed.'
    }

    return `Recent prompts executed:\n${recent.map((p, i) => `${i + 1}. ${p.prompt}`).join('\n')}`
  },

  // Get total counts
  getCounts(): { total: number, executed: number, pending: number } {
    const executed = storage.prompts.filter(p => p.executed).length
    const total = storage.prompts.length
    const pending = total - executed
    
    return { total, executed, pending }
  }
} 