# Webhook Implementation Checklist: Vapi → Whiteboard AI Integration

## Overview
Implement a system where Vapi voice agent calls a webhook when starting new subtopics, triggering an AI agent to generate whiteboard prompts and update the board in real-time.

## Architecture Decision
- **Webhook Location**: Client-side (Vite app) - allows direct access to `useTldrawAiExample` hook and state management
- **Context Management**: React state to maintain prompt history and current row tracking
- **Timing**: Immediate execution when webhook receives subtopic data
- **AI Processing**: Client-side OpenAI calls for maximum flexibility and state integration

---

## Step 1: Update Vapi System Prompt & Function Definition

### 1.1 Add Function Definition to Vapi Assistant
Update your Vapi assistant configuration to include a new function:

```json
{
  "name": "update_whiteboard",
  "description": "Call this function when starting a new subtopic to update the whiteboard with relevant content",
  "parameters": {
    "type": "object",
    "properties": {
      "subtopic": {
        "type": "object",
        "properties": {
          "index": {"type": "number", "description": "Subtopic index number"},
          "name": {"type": "string", "description": "Subtopic name/title"},
          "whiteboardItems": {
            "type": "array",
            "description": "Array of whiteboard items for this subtopic",
            "items": {
              "type": "object",
              "properties": {
                "text": {"type": "string", "description": "Content to display"},
                "type": {"type": "string", "enum": ["title", "heading", "subheading", "definition", "bullet", "formula", "example", "note"]}
              },
              "required": ["text", "type"]
            }
          }
        },
        "required": ["index", "name", "whiteboardItems"]
      }
    },
    "required": ["subtopic"]
  },
  "async": true,
  "webhookUrl": "http://localhost:5173/api/whiteboard-update"
}
```

### 1.2 Update vapi-prompt.txt
Add instructions for when to call the function:

```
**WHITEBOARD FUNCTION USAGE:**
- BEFORE starting to teach each subtopic, call update_whiteboard() function
- Pass the complete subtopic object including index, name, and whiteboardItems
- Example: When starting "Second subtopic: Basic Concepts", call:
  update_whiteboard({
    subtopic: {
      index: 2,
      name: "Basic Concepts", 
      whiteboardItems: [...] // from lesson plan
    }
  })
- Continue teaching immediately after the function call (don't wait for response)
```

**Deliverables:**
- [ ] Updated Vapi assistant function definition
- [ ] Updated vapi-prompt.txt with function usage instructions
- [ ] Test webhook URL configured (localhost for development)

---

## Step 2: Create Client-Side Webhook Endpoint

### 2.1 Set Up Vite Dev Server Proxy (Development)
Add to `vite.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Handle webhook routes
        }
      }
    }
  }
})
```

### 2.2 Create Webhook Handler Component
Create `client/hooks/useWhiteboardWebhook.ts`:

```typescript
import { useState, useCallback } from 'react'

interface SubtopicData {
  index: number
  name: string
  whiteboardItems: Array<{
    text: string
    type: 'title' | 'heading' | 'subheading' | 'definition' | 'bullet' | 'formula' | 'example' | 'note'
  }>
}

interface WebhookState {
  isProcessing: boolean
  currentSubtopic: SubtopicData | null
  promptHistory: string[]
  currentRow: number
}

export const useWhiteboardWebhook = () => {
  const [state, setState] = useState<WebhookState>({
    isProcessing: false,
    currentSubtopic: null,
    promptHistory: [],
    currentRow: 1
  })

  const handleWebhookCall = useCallback(async (subtopicData: SubtopicData) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      currentSubtopic: subtopicData 
    }))

    try {
      // Process whiteboard update (Step 3 implementation)
      await processWhiteboardUpdate(subtopicData, state.promptHistory, state.currentRow)
    } catch (error) {
      console.error('Webhook processing failed:', error)
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [state.promptHistory, state.currentRow])

  return {
    state,
    handleWebhookCall,
    setState
  }
}
```

### 2.3 Create Express-like Route Handler
Create `client/api/webhookHandler.ts`:

```typescript
export const createWebhookHandler = (onWebhookCall: (data: any) => Promise<void>) => {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const subtopicData = await request.json()
      console.log('Webhook received:', subtopicData)
      
      // Trigger the whiteboard update
      await onWebhookCall(subtopicData.subtopic)
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Whiteboard update initiated' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Webhook error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Webhook processing failed' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
```

**Deliverables:**
- [ ] Vite proxy configuration for webhook routes
- [ ] `useWhiteboardWebhook` hook with state management
- [ ] Webhook handler function
- [ ] Integration point in main app component

---

## Step 3: Create Whiteboard AI Agent

### 3.1 Create AI Agent with Prompting Knowledge
Create `client/services/whiteboardAI.ts`:

```typescript
import OpenAI from 'openai'

const WHITEBOARD_AI_SYSTEM_PROMPT = `
You are a whiteboard AI agent that converts educational content into precise whiteboard positioning prompts.

## YOUR KNOWLEDGE BASE
${/* Include entire prompting.md content here */}

## YOUR TASK
Convert whiteboardItems into proper positioning prompts using the explicit positioning system.

## CONTEXT AWARENESS
- You will receive previous prompts to understand current whiteboard state
- Track the current row number to avoid overlaps
- Maintain visual hierarchy and spacing

## OUTPUT FORMAT
Generate an array of prompt strings, each following the exact format:
"Create textbox with \"[CONTENT]\" in row [ROW], [POSITION], width [WIDTH], [STYLING_OPTIONS]"

## CONTENT TYPE MAPPING
- title → fontSize xlarge, fontWeight bold, center position, width 3/4, textAlign center
- heading → fontSize large, fontWeight bold, left position, width 2/3
- subheading → fontSize normal, fontWeight bold, position 0.05, width 9/10
- definition → fontSize normal, left position, width 1/1
- bullet → fontSize normal, position 0.1, width 5/6, bullet true
- formula → fontSize large, fontWeight bold, center position, width 1/2, textAlign center
- example → fontSize normal, position 0.05, width 9/10
- note → fontSize small, color grey, position 0.1, width 4/5

## SPACING RULES
- Leave 1-2 rows between different content types
- Group related items (like multiple bullets) in consecutive rows
- Start each new subtopic with appropriate spacing from previous content
`

interface WhiteboardItem {
  text: string
  type: 'title' | 'heading' | 'subheading' | 'definition' | 'bullet' | 'formula' | 'example' | 'note'
}

export class WhiteboardAI {
  private openai: OpenAI
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // For client-side usage
    })
  }

  async generatePrompts(
    whiteboardItems: WhiteboardItem[],
    previousPrompts: string[],
    currentRow: number
  ): Promise<{ prompts: string[], nextRow: number }> {
    
    const userPrompt = `
    CURRENT CONTEXT:
    - Current row: ${currentRow}
    - Previous prompts: ${previousPrompts.slice(-5).join('\n')} // Last 5 for context
    
    NEW CONTENT TO ADD:
    ${JSON.stringify(whiteboardItems, null, 2)}
    
    Generate positioning prompts for these whiteboard items:
    1. Start from row ${currentRow} or appropriate spacing
    2. Follow the content type mapping rules
    3. Ensure proper visual hierarchy and spacing
    4. Return as JSON: { "prompts": ["prompt1", "prompt2", ...], "nextRow": number }
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: WHITEBOARD_AI_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return {
      prompts: result.prompts || [],
      nextRow: result.nextRow || currentRow + whiteboardItems.length + 2
    }
  }
}
```

### 3.2 Create Processing Function
Create `client/services/whiteboardProcessor.ts`:

```typescript
import { WhiteboardAI } from './whiteboardAI'

interface SubtopicData {
  index: number
  name: string
  whiteboardItems: Array<{
    text: string
    type: string
  }>
}

export const processWhiteboardUpdate = async (
  subtopicData: SubtopicData,
  previousPrompts: string[],
  currentRow: number,
  streamFunction: (prompt: string) => Promise<void>
) => {
  console.log('Processing whiteboard update for:', subtopicData.name)
  
  // Initialize AI agent
  const whiteboardAI = new WhiteboardAI(import.meta.env.VITE_OPENAI_API_KEY)
  
  try {
    // Generate prompts
    const { prompts, nextRow } = await whiteboardAI.generatePrompts(
      subtopicData.whiteboardItems,
      previousPrompts,
      currentRow
    )
    
    console.log('Generated prompts:', prompts)
    
    // Execute prompts using the stream function
    for (const prompt of prompts) {
      console.log('Executing prompt:', prompt)
      await streamFunction(prompt)
      
      // Small delay between prompts to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return {
      success: true,
      promptsExecuted: prompts.length,
      nextRow,
      prompts
    }
    
  } catch (error) {
    console.error('Whiteboard processing error:', error)
    throw error
  }
}
```

**Deliverables:**
- [ ] WhiteboardAI class with prompting.md knowledge
- [ ] Content type to styling mapping system
- [ ] Row tracking and spacing logic
- [ ] Integration with OpenAI API
- [ ] Prompt execution system

---

## Step 4: Integrate with useTldrawAiExample Hook

### 4.1 Modify LessonPage Component
Update `client/pages/LessonPage.tsx`:

```typescript
import { useWhiteboardWebhook } from '../hooks/useWhiteboardWebhook'
import { useTldrawAiExample } from '../hooks/useTldrawAiExample'
import { processWhiteboardUpdate } from '../services/whiteboardProcessor'
import { createWebhookHandler } from '../api/webhookHandler'

export function LessonPage() {
  const { editor } = useTldrawAiExample() // Your existing hook
  const { state: webhookState, handleWebhookCall, setState: setWebhookState } = useWhiteboardWebhook()
  
  // Create webhook handler with access to stream function
  const webhookHandler = useMemo(() => 
    createWebhookHandler(async (subtopicData) => {
      await processWhiteboardUpdate(
        subtopicData,
        webhookState.promptHistory,
        webhookState.currentRow,
        async (prompt) => {
          // Use your existing stream function from useTldrawAiExample
          await streamFunction(prompt) // Replace with actual function name
          
          // Update state with new prompt and row tracking
          setWebhookState(prev => ({
            ...prev,
            promptHistory: [...prev.promptHistory, prompt],
            currentRow: prev.currentRow + 1 // Simplified increment
          }))
        }
      )
    }), 
    [webhookState, setWebhookState, streamFunction]
  )
  
  // Set up webhook endpoint
  useEffect(() => {
    // Register webhook handler (implementation depends on your routing setup)
    registerWebhookHandler('/api/whiteboard-update', webhookHandler)
    
    return () => {
      unregisterWebhookHandler('/api/whiteboard-update')
    }
  }, [webhookHandler])

  return (
    <div>
      {/* Your existing lesson page content */}
      
      {/* Webhook status indicator */}
      {webhookState.isProcessing && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white p-2 rounded">
          Updating whiteboard for: {webhookState.currentSubtopic?.name}
        </div>
      )}
      
      {/* Your existing Tldraw component */}
    </div>
  )
}
```

### 4.2 Set Up Development Webhook Server
Create `client/dev-webhook-server.ts` (for development):

```typescript
// Simple development server to handle webhooks
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

let webhookHandler: ((req: any, res: any) => Promise<void>) | null = null

export const registerWebhookHandler = (path: string, handler: any) => {
  app.post(path, async (req, res) => {
    try {
      const response = await handler(new Request('http://localhost' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }))
      
      const result = await response.json()
      res.status(response.status).json(result)
    } catch (error) {
      res.status(500).json({ error: 'Webhook processing failed' })
    }
  })
}

// Start server on port 5174 (different from Vite dev server)
app.listen(5174, () => {
  console.log('Webhook server running on http://localhost:5174')
})
```

**Deliverables:**
- [ ] Integration with existing useTldrawAiExample hook
- [ ] Webhook handler registration system
- [ ] State management for prompt history and row tracking
- [ ] Development webhook server setup
- [ ] UI indicators for webhook processing status

---

## Step 5: Testing & Production Setup

### 5.1 Development Testing
Create test utilities in `client/utils/webhookTesting.ts`:

```typescript
// Test webhook functionality
export const testWebhookCall = async () => {
  const testSubtopic = {
    index: 1,
    name: "Test Introduction",
    whiteboardItems: [
      { text: "Test Title", type: "title" },
      { text: "Test definition here", type: "definition" },
      { text: "Test bullet point", type: "bullet" }
    ]
  }

  try {
    const response = await fetch('http://localhost:5174/api/whiteboard-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtopic: testSubtopic })
    })
    
    const result = await response.json()
    console.log('Test webhook result:', result)
    return result
  } catch (error) {
    console.error('Test webhook failed:', error)
    throw error
  }
}

// Add test button to your UI for development
export const WebhookTestButton = () => (
  <button 
    onClick={testWebhookCall}
    className="bg-green-500 text-white px-4 py-2 rounded"
  >
    Test Webhook
  </button>
)
```

### 5.2 Production Webhook Setup
For production, you'll need to:

1. **Deploy webhook endpoint** - Use your existing hosting solution
2. **Update Vapi webhook URL** - Point to production domain
3. **Environment variables** - Set up OPENAI_API_KEY and other configs
4. **CORS configuration** - Allow Vapi domain to call your webhook

### 5.3 Error Handling & Monitoring
Add comprehensive error handling:

```typescript
// Add to whiteboardProcessor.ts
export const processWhiteboardUpdateWithRetry = async (
  subtopicData: SubtopicData,
  previousPrompts: string[],
  currentRow: number,
  streamFunction: (prompt: string) => Promise<void>,
  maxRetries = 3
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await processWhiteboardUpdate(subtopicData, previousPrompts, currentRow, streamFunction)
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        // Log to monitoring service
        console.error('All webhook attempts failed:', error)
        throw error
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }
}
```

**Deliverables:**
- [ ] Webhook testing utilities and test button
- [ ] Production deployment configuration
- [ ] Error handling and retry logic
- [ ] Monitoring and logging setup
- [ ] Documentation for production setup

---

## Final Checklist Summary

### Development Phase:
- [ ] Step 1: Vapi function definition and prompt updates
- [ ] Step 2: Client webhook endpoint and state management
- [ ] Step 3: Whiteboard AI agent with prompting.md knowledge
- [ ] Step 4: Integration with useTldrawAiExample hook
- [ ] Step 5: Testing utilities and error handling

### Production Phase:
- [ ] Deploy webhook endpoint to production
- [ ] Update Vapi webhook URL to production domain
- [ ] Configure environment variables
- [ ] Set up monitoring and error tracking
- [ ] Test end-to-end flow with real Vapi calls

### Success Criteria:
- [ ] Vapi voice agent successfully calls webhook when starting subtopics
- [ ] Webhook receives subtopic data and triggers AI agent
- [ ] AI agent generates proper whiteboard prompts using prompting.md rules
- [ ] Whiteboard updates in real-time with educational content
- [ ] State management tracks prompt history and row positioning
- [ ] Error handling gracefully manages failures

This implementation will create a seamless integration between your Vapi voice teaching and the AI whiteboard system! 