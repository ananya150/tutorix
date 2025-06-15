import { generatePromptId } from '../contexts/WhiteboardContext'

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

interface GeneratedPrompt {
  id: string
  prompt: string
  estimatedRows: number
  contentType: string
}

interface GeneratePromptsResponse {
  success: boolean
  prompts: GeneratedPrompt[]
  nextRow: number
  subtopicIndex: number
  subtopicName: string
  totalPrompts: number
  error?: string
}

interface WhiteboardPrompt {
  id: string
  prompt: string
  subtopicIndex: number
  subtopicName: string
  timestamp: Date
  executed: boolean
  rowsUsed: number[]
}

export class WhiteboardService {
  private baseUrl: string
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }
  
  /**
   * Generate whiteboard prompts for a subtopic using the OpenAI API
   */
  async generatePrompts(
    subtopicData: SubtopicData,
    previousPrompts: string[],
    currentRow: number,
    sessionId?: string,
    lessonId?: string,
    repositionCamera: boolean = true
  ): Promise<WhiteboardPrompt[]> {
    try {
      console.log('WhiteboardService: Generating prompts for subtopic:', subtopicData.name)
      
      const response = await fetch(`${this.baseUrl}/generate-whiteboard-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtopicData,
          previousPrompts,
          currentRow,
          sessionId,
          lessonId,
          repositionCamera
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: GeneratePromptsResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate prompts')
      }
      
      console.log('WhiteboardService: Generated prompts:', {
        count: result.prompts.length,
        nextRow: result.nextRow,
        subtopic: result.subtopicName
      })
      
      // Convert API response to WhiteboardPrompt format
      const whiteboardPrompts: WhiteboardPrompt[] = result.prompts.map(prompt => ({
        id: prompt.id,
        prompt: prompt.prompt,
        subtopicIndex: result.subtopicIndex,
        subtopicName: result.subtopicName,
        timestamp: new Date(),
        executed: false,
        rowsUsed: []
      }))
      
      return whiteboardPrompts
      
    } catch (error) {
      console.error('WhiteboardService: Error generating prompts:', error)
      throw error
    }
  }
  
  /**
   * Execute a single prompt on the whiteboard
   */
  async executePrompt(
    prompt: string,
    streamFunction: (prompt: string) => Promise<void>
  ): Promise<number[]> {
    try {
      console.log('WhiteboardService: Executing prompt:', prompt)
      
      // Execute the prompt using the provided stream function
      await streamFunction(prompt)
      
      // For now, we'll estimate rows used based on the prompt content
      // In a more sophisticated implementation, this could be returned by the stream function
      const estimatedRows = this.estimateRowsUsed(prompt)
      
      console.log('WhiteboardService: Prompt executed successfully, estimated rows:', estimatedRows)
      
      return estimatedRows
      
    } catch (error) {
      console.error('WhiteboardService: Error executing prompt:', error)
      throw error
    }
  }
  
  /**
   * Execute multiple prompts in sequence with delays
   */
  async executePrompts(
    prompts: WhiteboardPrompt[],
    streamFunction: (prompt: string) => Promise<void>,
    onPromptExecuted?: (promptId: string, rowsUsed: number[]) => void,
    delayMs: number = 500
  ): Promise<void> {
    console.log('WhiteboardService: Executing', prompts.length, 'prompts')
    
    for (const promptObj of prompts) {
      try {
        const rowsUsed = await this.executePrompt(promptObj.prompt, streamFunction)
        
        // Notify that this prompt was executed
        if (onPromptExecuted) {
          onPromptExecuted(promptObj.id, rowsUsed)
        }
        
        // Add delay between prompts to avoid overwhelming the system
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
        
      } catch (error) {
        console.error('WhiteboardService: Failed to execute prompt:', promptObj.id, error)
        // Continue with next prompt even if one fails
      }
    }
    
    console.log('WhiteboardService: Finished executing all prompts')
  }
  
  /**
   * Process a complete subtopic: generate prompts and execute them
   */
  async processSubtopic(
    subtopicData: SubtopicData,
    previousPrompts: string[],
    currentRow: number,
    streamFunction: (prompt: string) => Promise<void>,
    onPromptExecuted?: (promptId: string, rowsUsed: number[]) => void,
    sessionId?: string,
    lessonId?: string,
    repositionCamera: boolean = true
  ): Promise<{ prompts: WhiteboardPrompt[], nextRow: number }> {
    try {
      console.log('WhiteboardService: Processing subtopic:', subtopicData.name)
      
      // Step 1: Generate prompts
      const generatedPrompts = await this.generatePrompts(
        subtopicData,
        previousPrompts,
        currentRow,
        sessionId,
        lessonId,
        repositionCamera
      )
      
      // Step 2: Execute prompts
      await this.executePrompts(
        generatedPrompts,
        streamFunction,
        onPromptExecuted
      )
      
      // Step 3: Calculate next row
      const totalRowsUsed = generatedPrompts.reduce((sum, prompt) => {
        return sum + this.estimateRowsUsed(prompt.prompt).length
      }, 0)
      const nextRow = currentRow + totalRowsUsed + 2 // Add buffer
      
      console.log('WhiteboardService: Subtopic processing complete:', {
        subtopic: subtopicData.name,
        promptsGenerated: generatedPrompts.length,
        nextRow
      })
      
      return {
        prompts: generatedPrompts,
        nextRow
      }
      
    } catch (error) {
      console.error('WhiteboardService: Error processing subtopic:', error)
      throw error
    }
  }
  
  /**
   * Process a complete subtopic: generate prompts and execute them
   * Camera repositioning only for the first prompt
   */
  async processSubtopicWithFirstPromptCameraOnly(
    subtopicData: SubtopicData,
    previousPrompts: string[],
    currentRow: number,
    streamFunctionWithCamera: (prompt: string) => Promise<void>,
    streamFunctionWithoutCamera: (prompt: string) => Promise<void>,
    onPromptExecuted?: (promptId: string, rowsUsed: number[]) => void,
    sessionId?: string,
    lessonId?: string
  ): Promise<{ prompts: WhiteboardPrompt[], nextRow: number }> {
    try {
      console.log('WhiteboardService: Processing subtopic with first-prompt-only camera:', subtopicData.name)
      
      // Step 1: Generate prompts with camera repositioning enabled
      // (The AI will include camera events, but we'll selectively use them)
      const generatedPrompts = await this.generatePrompts(
        subtopicData,
        previousPrompts,
        currentRow,
        sessionId,
        lessonId,
        true // Always generate with camera for the first prompt
      )
      
      console.log('WhiteboardService: Generated prompts for selective camera execution:', {
        count: generatedPrompts.length,
        subtopic: subtopicData.name
      })
      
      // Step 2: Execute prompts with selective camera repositioning
      await this.executePromptsWithSelectiveCamera(
        generatedPrompts,
        streamFunctionWithCamera,
        streamFunctionWithoutCamera,
        onPromptExecuted
      )
      
      // Step 3: Calculate next row
      const totalRowsUsed = generatedPrompts.reduce((sum, prompt) => {
        return sum + this.estimateRowsUsed(prompt.prompt).length
      }, 0)
      const nextRow = currentRow + totalRowsUsed + 2 // Add buffer
      
      console.log('WhiteboardService: Subtopic processing complete (first-prompt camera):', {
        subtopic: subtopicData.name,
        promptsGenerated: generatedPrompts.length,
        nextRow
      })
      
      return {
        prompts: generatedPrompts,
        nextRow
      }
      
    } catch (error) {
      console.error('WhiteboardService: Error processing subtopic with selective camera:', error)
      throw error
    }
  }

  /**
   * Execute multiple prompts with camera repositioning only for the first prompt
   */
  async executePromptsWithSelectiveCamera(
    prompts: WhiteboardPrompt[],
    streamFunctionWithCamera: (prompt: string) => Promise<void>,
    streamFunctionWithoutCamera: (prompt: string) => Promise<void>,
    onPromptExecuted?: (promptId: string, rowsUsed: number[]) => void,
    delayMs: number = 500
  ): Promise<void> {
    console.log('WhiteboardService: Executing', prompts.length, 'prompts with selective camera')
    
    for (let i = 0; i < prompts.length; i++) {
      const promptObj = prompts[i]
      const isFirstPrompt = i === 0
      
      try {
        console.log(`WhiteboardService: Executing prompt ${i + 1}/${prompts.length}`, {
          id: promptObj.id,
          isFirstPrompt,
          cameraEnabled: isFirstPrompt
        })
        
        // Use camera-enabled stream function for first prompt, camera-disabled for others
        const streamFunction = isFirstPrompt ? streamFunctionWithCamera : streamFunctionWithoutCamera
        const rowsUsed = await this.executePrompt(promptObj.prompt, streamFunction)
        
        // Notify that this prompt was executed
        if (onPromptExecuted) {
          onPromptExecuted(promptObj.id, rowsUsed)
        }
        
        // Add delay between prompts to avoid overwhelming the system
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
        
      } catch (error) {
        console.error('WhiteboardService: Failed to execute prompt:', promptObj.id, error)
        // Continue with next prompt even if one fails
      }
    }
    
    console.log('WhiteboardService: Finished executing all prompts with selective camera')
  }
  
  /**
   * Estimate how many rows a prompt will use
   * This is a simple heuristic - could be improved with more sophisticated analysis
   */
  private estimateRowsUsed(prompt: string): number[] {
    // Extract row number from prompt
    const rowMatch = prompt.match(/row (\d+)/)
    if (rowMatch) {
      const startRow = parseInt(rowMatch[1], 10)
      
      // Estimate additional rows based on content length and type
      let additionalRows = 0
      
      // Check for long text content
      const textMatch = prompt.match(/"([^"]+)"/)
      if (textMatch) {
        const textLength = textMatch[1].length
        // Rough estimate: every 80 characters might wrap to next row
        additionalRows = Math.floor(textLength / 80)
      }
      
      // Check for bullet points (might need extra spacing)
      if (prompt.includes('bullet true')) {
        additionalRows += 1
      }
      
      // Return array of rows used
      const rowsUsed = []
      for (let i = 0; i <= additionalRows; i++) {
        rowsUsed.push(startRow + i)
      }
      
      return rowsUsed
    }
    
    // Fallback: assume 1 row
    return [1]
  }
  
  /**
   * Validate that a prompt follows the correct format
   */
  validatePrompt(prompt: string): { valid: boolean, errors: string[] } {
    const errors: string[] = []
    
    // Check for required components
    if (!prompt.includes('Create textbox with')) {
      errors.push('Missing "Create textbox with" command')
    }
    
    if (!prompt.match(/row \d+/)) {
      errors.push('Missing row specification')
    }
    
    if (!prompt.match(/width \d+\/\d+|width 1\/1/)) {
      errors.push('Missing or invalid width specification (must use fractions like width 1/2)')
    }
    
    // Check for common mistakes
    if (prompt.includes('width 1') && !prompt.includes('width 1/')) {
      errors.push('Invalid width: "width 1" becomes 1px, use "width 1/1" instead')
    }
    
    if (prompt.match(/width 0\.\d+/)) {
      errors.push('Invalid width: decimal widths not allowed, use fractions like "width 1/2"')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Get a summary of prompt history for debugging
   */
  getPromptHistorySummary(prompts: WhiteboardPrompt[]): string {
    const executed = prompts.filter(p => p.executed)
    const pending = prompts.filter(p => !p.executed)
    
    return `Prompt History Summary:
- Total prompts: ${prompts.length}
- Executed: ${executed.length}
- Pending: ${pending.length}
- Last executed: ${executed[executed.length - 1]?.prompt.substring(0, 50) || 'None'}...
- Subtopics covered: ${new Set(prompts.map(p => p.subtopicName)).size}`
  }

  /**
   * Process a complete subtopic: generate prompts and execute them via concatenated streaming
   * Camera repositioning only for the first prompt, all prompts sent as one stream request
   */
  async processSubtopicWithConcatenatedStreaming(
    subtopicData: SubtopicData,
    previousPrompts: string[],
    currentRow: number,
    streamFunction: (concatenatedPrompt: string, repositionCamera: boolean) => Promise<void>,
    onPromptExecuted?: (promptId: string, rowsUsed: number[]) => void,
    sessionId?: string,
    lessonId?: string
  ): Promise<{ prompts: WhiteboardPrompt[], nextRow: number }> {
    try {
      console.log('WhiteboardService: Processing subtopic with concatenated streaming:', subtopicData.name)
      
      // Step 1: Generate prompts with camera repositioning enabled for the first prompt
      const generatedPrompts = await this.generatePrompts(
        subtopicData,
        previousPrompts,
        currentRow,
        sessionId,
        lessonId,
        true // Generate with camera positioning for proper prompt structure
      )
      
      console.log('WhiteboardService: Generated prompts for concatenated streaming:', {
        count: generatedPrompts.length,
        subtopic: subtopicData.name
      })
      
      // Step 2: Concatenate all prompts with instructions for selective camera
      const concatenatedPrompt = this.createConcatenatedPrompt(generatedPrompts)
      
      console.log('WhiteboardService: Created concatenated prompt:', {
        originalPrompts: generatedPrompts.length,
        concatenatedLength: concatenatedPrompt.length,
        preview: concatenatedPrompt.substring(0, 200) + '...'
      })
      
      // Step 3: Execute the concatenated prompt via streaming (camera only for first)
      await streamFunction(concatenatedPrompt, false) // Camera enabled for first prompt in the sequence
      
      // Step 4: Mark all prompts as executed and notify
      for (const promptObj of generatedPrompts) {
        const rowsUsed = this.estimateRowsUsed(promptObj.prompt)
        
        if (onPromptExecuted) {
          onPromptExecuted(promptObj.id, rowsUsed)
        }
      }
      
      // Step 5: Calculate next row
      const totalRowsUsed = generatedPrompts.reduce((sum, prompt) => {
        return sum + this.estimateRowsUsed(prompt.prompt).length
      }, 0)
      const nextRow = currentRow + totalRowsUsed + 2 // Add buffer
      
      console.log('WhiteboardService: Subtopic processing complete (concatenated streaming):', {
        subtopic: subtopicData.name,
        promptsGenerated: generatedPrompts.length,
        nextRow
      })
      
      return {
        prompts: generatedPrompts,
        nextRow
      }
      
    } catch (error) {
      console.error('WhiteboardService: Error processing subtopic with concatenated streaming:', error)
      throw error
    }
  }

  /**
   * Create a concatenated prompt that instructs the AI to handle camera positioning
   * only for the first item, then create subsequent items without camera repositioning
   */
  private createConcatenatedPrompt(prompts: WhiteboardPrompt[]): string {
    if (prompts.length === 0) {
      return ''
    }
    
    const instructions = `You will receive multiple whiteboard creation requests. Please process them in sequence.
      Here are the ${prompts.length} requests to process:
      `
    
    const numberedPrompts = prompts.map((prompt, index) => {
      return `${prompt.prompt}`
    }).join('')
    
    const footer = `
Please process all ${prompts.length} requests in sequence.`
    
    return instructions + numberedPrompts + footer
  }
} 