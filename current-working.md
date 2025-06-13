# AI Integration in Tldraw Demo: Complete Technical Overview

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Client-Side Architecture](#client-side-architecture)
3. [Server-Side Architecture](#server-side-architecture)
4. [Data Flow and Transformations](#data-flow-and-transformations)
5. [Communication Protocol](#communication-protocol)
6. [Complete End-to-End Example](#complete-end-to-end-example)
7. [Technical Implementation Details](#technical-implementation-details)

## High-Level Architecture

This application integrates AI capabilities into tldraw (a collaborative drawing tool) to allow users to create diagrams, drawings, and visual content through natural language prompts. The system consists of two main components:

- **Client**: React-based web application that handles user interaction and canvas rendering
- **Worker**: Cloudflare Workers-based backend that processes AI requests using OpenAI's GPT models

```
┌─────────────────┐    HTTP/SSE     ┌─────────────────┐    OpenAI API    ┌─────────────────┐
│                 │ ──────────────► │                 │ ──────────────► │                 │
│     Client      │                 │     Worker      │                 │     OpenAI      │
│   (React App)   │ ◄────────────── │ (Cloudflare DO) │ ◄────────────── │   (GPT Model)   │
│                 │    JSON/SSE     │                 │    JSON         │                 │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
```

## Client-Side Architecture

### Core Components

#### 1. Main Application (`App.tsx`)
The application consists of two primary components:

```typescript
function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  return (
    <div className="tldraw-ai-container">
      <Tldraw persistenceKey="tldraw-ai-demo-2" onMount={setEditor} />
      {editor && <InputBar editor={editor} />}
    </div>
  )
}
```

- **Tldraw Component**: The main drawing canvas where users can create and manipulate shapes
- **InputBar Component**: Text input field where users enter AI prompts
- **Editor State**: Manages the tldraw editor instance that provides programmatic access to the canvas

#### 2. AI Integration Hook (`useTldrawAiExample.ts`)
This custom hook wraps the `@tldraw/ai` package with application-specific configuration:

```typescript
export function useTldrawAiExample(editor?: Editor) {
  return useTldrawAi({ editor, ...STATIC_TLDRAWAI_OPTIONS })
}
```

The hook provides two main methods:
- `ai.prompt()` - For generating AI responses
- `ai.stream()` - For streaming AI responses in real-time

#### 3. Data Transformation Pipeline
The client uses three transforms to process data before sending to AI and after receiving responses:

##### SimpleIds Transform
- **Purpose**: Converts complex tldraw shape IDs to simple numeric IDs for AI processing
- **Example**: `shape_a1b2c3d4` → `0`, `shape_e5f6g7h8` → `1`
- **Bidirectional**: Maintains mapping to convert back to original IDs

##### SimpleCoordinates Transform  
- **Purpose**: Normalizes coordinates relative to user's viewport
- **Process**: 
  - Stores original viewport bounds
  - Converts absolute canvas coordinates to relative coordinates (0,0 based)
  - When AI responds, converts back to absolute coordinates
- **Example**: If viewport is at (1000, 500), a shape at (1100, 600) becomes (100, 100) for AI

##### ShapeDescriptions Transform
- **Purpose**: Preserves and manages AI-generated descriptions of shapes
- **Function**: Stores descriptions in shape metadata for future reference
- **Benefit**: Helps AI understand context of existing shapes

### User Interaction Flow

#### 1. User Input Processing
```typescript
const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
  async (e) => {
    e.preventDefault()
    
    // Get user prompt from form
    const formData = new FormData(e.currentTarget)
    const value = formData.get('input') as string
    
    // Call AI with streaming enabled
    const { promise, cancel } = ai.prompt({ message: value, stream: true })
    
    // Handle cancellation and loading states
    rCancelFn.current = cancel
    setIsGenerating(true)
    
    await promise
    setIsGenerating(false)
  },
  [ai]
)
```

#### 2. State Management
The client manages several states:
- **isGenerating**: Boolean indicating if AI is currently processing
- **rCancelFn**: Reference to cancellation function for ongoing requests
- **editor**: The tldraw editor instance

#### 3. Real-time Updates
When streaming is enabled, the client receives updates in real-time as the AI generates shapes, allowing users to see the drawing process happen live.

## Server-Side Architecture

### Infrastructure Layer

#### 1. Cloudflare Workers Entry Point (`worker.ts`)
The main worker handles HTTP routing with CORS support:

```typescript
const router = AutoRouter<IRequest, [env: Environment, ctx: ExecutionContext]>({
  before: [preflight],
  finally: [corsify],
})
  .post('/generate', generate)
  .post('/stream', stream)
```

#### 2. Route Handlers (`routes/`)
Both endpoints delegate to a Durable Object for processing:

```typescript
// Both generate.ts and stream.ts follow this pattern
export async function generate(request: IRequest, env: Environment) {
  const id = env.TLDRAW_AI_DURABLE_OBJECT.idFromName('anonymous')
  const DO = env.TLDRAW_AI_DURABLE_OBJECT.get(id)
  const response = await DO.fetch(request.url, {
    method: 'POST',
    body: request.body,
  })
  return response
}
```

#### 3. Durable Object (`TldrawAiDurableObject.ts`)
The Durable Object provides stateful processing and handles the actual AI integration:

```typescript
export class TldrawAiDurableObject extends DurableObject<Environment> {
  service: TldrawAiBaseService

  constructor(ctx: DurableObjectState, env: Environment) {
    super(ctx, env)
    this.service = new OpenAiService(this.env)
  }
}
```

### AI Service Layer

#### 1. Service Abstraction (`TldrawAiBaseService.ts`)
Defines the interface for AI providers:

```typescript
export abstract class TldrawAiBaseService {
  abstract generate(prompt: TLAiSerializedPrompt): Promise<TLAiResult>
  abstract stream(prompt: TLAiSerializedPrompt): AsyncGenerator<TLAiChange>
}
```

#### 2. OpenAI Implementation (`OpenAiService.ts`)
Implements the service interface using OpenAI's API:

```typescript
export class OpenAiService extends TldrawAiBaseService {
  async generate(prompt: TLAiSerializedPrompt): Promise<TLAiResult> {
    const events = await generateEvents(this.openai, prompt)
    const changes = events.map((event) => 
      getTldrawAiChangesFromSimpleEvents(prompt, event)
    ).flat()
    return { changes }
  }
}
```

### Data Processing Pipeline

#### 1. Prompt Construction (`prompt.ts`)
Creates structured prompts for OpenAI with three message types:

**System Message**: Contains comprehensive instructions for the AI about how to work with tldraw
**Developer Message**: Provides context about user's viewport and current canvas state
**User Message**: Contains the actual user request and any uploaded images

```typescript
function buildDeveloperMessage(prompt: TLAiSerializedPrompt) {
  return {
    role: 'developer',
    content: [
      {
        type: 'text',
        text: `The user's current viewport is: { x: ${prompt.promptBounds.x}, y: ${prompt.promptBounds.y}, width: ${prompt.promptBounds.w}, height: ${prompt.promptBounds.h} }`
      },
      {
        type: 'text',
        text: `Here are all of the shapes that are in the user's current viewport:\n\n${JSON.stringify(simplifiedCanvasContent.shapes)}`
      }
    ]
  }
}
```

#### 2. Canvas Content Simplification (`getSimpleContentFromCanvasContent.ts`)
Converts complex tldraw shapes to AI-friendly representations:

```typescript
// Complex tldraw shape
{
  id: "shape_a1b2c3d4e5f6",
  type: "geo",
  x: 1250.5,
  y: 780.3,
  props: {
    geo: "rectangle",
    w: 150,
    h: 100,
    fill: "semi",
    color: "blue",
    richText: { type: "text", text: "Hello World" }
  },
  meta: { description: "A blue rectangle with text" }
}

// Simplified for AI
{
  shapeId: "0",
  type: "rectangle",
  x: 100,
  y: 50,
  width: 150,
  height: 100,
  color: "blue",
  fill: "semi",
  text: "Hello World",
  note: "A blue rectangle with text"
}
```

#### 3. Schema Validation (`schema.ts`)
Uses Zod schemas to ensure AI responses are well-formed:

```typescript
const ModelResponse = z.object({
  long_description_of_strategy: z.string(),
  events: z.array(SimpleEvent),
})

const SimpleEvent = z.union([
  SimpleThinkEvent,
  SimpleCreateEvent,
  SimpleDeleteEvent,
  SimpleMoveEvent,
])
```

#### 4. Response Processing (`getTldrawAiChangesFromSimpleEvents.ts`)
Converts AI events back to tldraw-compatible changes:

```typescript
// AI Event
{
  type: "create",
  shape: {
    type: "rectangle",
    shapeId: "0",
    x: 100,
    y: 50,
    width: 150,
    height: 100,
    color: "blue",
    note: "A blue rectangle"
  },
  intent: "Create a blue rectangle as requested"
}

// Tldraw Change
{
  type: "createShape",
  description: "A blue rectangle",
  shape: {
    id: "shape_generated_id",
    type: "geo",
    x: 1350.5,
    y: 830.3,
    props: {
      geo: "rectangle",
      w: 150,
      h: 100,
      color: "blue",
      fill: "none"
    }
  }
}
```

## Data Flow and Transformations

### Request Flow (Client → Server)

1. **User Input**: User types "Draw a blue rectangle" and submits
2. **Canvas Capture**: Client captures current canvas state and user viewport
3. **Data Transformation**: Client transforms apply:
   - Complex shape IDs → Simple numeric IDs
   - Absolute coordinates → Relative coordinates
   - Full shape data → Simplified shape data
4. **Prompt Construction**: Create structured prompt with context
5. **HTTP Request**: Send to `/generate` or `/stream` endpoint

### AI Processing (Server)

1. **Request Routing**: Worker routes to appropriate Durable Object
2. **Prompt Building**: Construct multi-part prompt for OpenAI:
   - System instructions
   - Canvas context and viewport info
   - User request
3. **AI Communication**: Send to OpenAI API with structured response format
4. **Response Parsing**: Parse JSON response and validate against schema
5. **Event Conversion**: Convert AI events to tldraw changes

### Response Flow (Server → Client)

1. **Change Generation**: Convert AI events to tldraw-compatible changes
2. **HTTP Response**: Send back via JSON (generate) or SSE (stream)
3. **Client Processing**: Receive and apply reverse transformations:
   - Simple IDs → Original complex IDs
   - Relative coordinates → Absolute coordinates
   - Add shape descriptions to metadata
4. **Canvas Updates**: Apply changes to tldraw editor
5. **UI Updates**: Update loading states and user interface

## Communication Protocol

### Generate Endpoint (`/generate`)
- **Method**: POST
- **Content-Type**: application/json
- **Response**: Single JSON object with all changes
- **Use Case**: Simple requests where user can wait for complete response

```typescript
// Request
{
  "message": "Draw a blue rectangle",
  "canvasContent": { /* current shapes */ },
  "promptBounds": { "x": 0, "y": 0, "w": 1200, "h": 800 },
  "contextBounds": { "x": 100, "y": 100, "w": 1200, "h": 800 }
}

// Response
{
  "changes": [
    {
      "type": "createShape",
      "shape": { /* tldraw shape data */ },
      "description": "A blue rectangle as requested"
    }
  ]
}
```

### Stream Endpoint (`/stream`)
- **Method**: POST
- **Content-Type**: application/json
- **Response**: Server-Sent Events (text/event-stream)
- **Use Case**: Complex requests where real-time feedback is valuable

```typescript
// Request (same as generate)

// Response (streamed)
data: {"type": "createShape", "shape": {...}, "description": "..."}

data: {"type": "createShape", "shape": {...}, "description": "..."}

data: {"type": "createShape", "shape": {...}, "description": "..."}
```

## Complete End-to-End Example

Let's trace through a complete example: User asks to "Draw a simple house with a door and two windows"

### 1. Client Processing

```typescript
// User submits form
const userInput = "Draw a simple house with a door and two windows"

// Client captures current state
const canvasContent = {
  shapes: [], // assume empty canvas
  bindings: []
}

const promptBounds = { x: 0, y: 0, w: 1200, h: 800 } // user's viewport
const contextBounds = { x: 0, y: 0, w: 1200, h: 800 } // canvas bounds

// Transforms apply (minimal in this case since canvas is empty)
// Send HTTP request to /stream
```

### 2. Server Processing

```typescript
// Worker receives request and routes to Durable Object
// Durable Object constructs prompt for OpenAI

const systemPrompt = `You are an AI assistant that helps the user use a drawing program...`

const developerMessage = `The user's current viewport is: { x: 0, y: 0, width: 1200, height: 800 }
Here are all of the shapes that are in the user's current viewport: []`

const userMessage = `Using the events provided in the response schema, here's what I want you to do:
Draw a simple house with a door and two windows`

// Send to OpenAI API
const response = await openai.chat.completions.create({
  model: "gpt-4o-2024-08-06",
  messages: [systemPrompt, developerMessage, userMessage],
  response_format: { type: "json_object" }
})
```

### 3. AI Response

```json
{
  "long_description_of_strategy": "I will create a simple house by drawing a rectangle for the main structure, a triangle for the roof, a smaller rectangle for the door, and two small rectangles for windows. I'll position everything within the viewport and ensure proper proportions.",
  "events": [
    {
      "type": "create",
      "shape": {
        "type": "rectangle",
        "shapeId": "house-main",
        "note": "Main structure of the house",
        "x": 400,
        "y": 300,
        "width": 400,
        "height": 300,
        "color": "grey",
        "fill": "solid"
      },
      "intent": "Create the main rectangular structure of the house"
    },
    {
      "type": "create",
      "shape": {
        "type": "rectangle",
        "shapeId": "house-door",
        "note": "Door of the house",
        "x": 550,
        "y": 450,
        "width": 100,
        "height": 150,
        "color": "red",
        "fill": "solid"
      },
      "intent": "Create a door in the center-bottom of the house"
    },
    {
      "type": "create",
      "shape": {
        "type": "rectangle",
        "shapeId": "house-window-1",
        "note": "Left window of the house",
        "x": 450,
        "y": 350,
        "width": 80,
        "height": 80,
        "color": "blue",
        "fill": "solid"
      },
      "intent": "Create the left window"
    },
    {
      "type": "create",
      "shape": {
        "type": "rectangle",
        "shapeId": "house-window-2",
        "note": "Right window of the house",
        "x": 670,
        "y": 350,
        "width": 80,
        "height": 80,
        "color": "blue",
        "fill": "solid"
      },
      "intent": "Create the right window"
    }
  ]
}
```

### 4. Server Response Processing

```typescript
// Convert AI events to tldraw changes
const changes = events.map(event => {
  if (event.type === 'create' && event.shape.type === 'rectangle') {
    return {
      type: 'createShape',
      description: event.shape.note,
      shape: {
        id: generateShapeId(), // Generate real tldraw ID
        type: 'geo',
        x: event.shape.x,
        y: event.shape.y,
        props: {
          geo: 'rectangle',
          w: event.shape.width,
          h: event.shape.height,
          color: event.shape.color,
          fill: event.shape.fill === 'solid' ? 'fill' : 'none'
        },
        meta: {
          description: event.shape.note
        }
      }
    }
  }
})

// Stream each change as Server-Sent Event
for (const change of changes) {
  const data = `data: ${JSON.stringify(change)}\n\n`
  await writer.write(encoder.encode(data))
}
```

### 5. Client Response Processing

```typescript
// Client receives streaming changes via EventSource
const stream = await fetch('/stream', {
  method: 'POST',
  body: JSON.stringify(prompt)
})

const reader = stream.body.getReader()
const decoder = new TextDecoder()

// Process each streamed change
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  
  const text = decoder.decode(value)
  const lines = text.split('\n\n')
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const change = JSON.parse(line.slice(6))
      
      // Apply reverse transforms
      // - IDs already converted back to tldraw format
      // - Coordinates already converted back to absolute
      // - Descriptions stored in meta
      
      // Apply change to tldraw editor
      if (change.type === 'createShape') {
        editor.createShape(change.shape)
      }
    }
  }
}
```

### 6. Visual Result

The user sees four rectangles appear on the canvas in real-time:
1. A grey rectangle for the house structure
2. A red rectangle for the door
3. Two blue rectangles for the windows

Each shape has metadata containing the AI's description of its purpose.

## Technical Implementation Details

### Error Handling

#### Client-Side
- **Network Errors**: Handles failed requests and displays appropriate messages
- **Cancellation**: Users can cancel ongoing requests
- **Validation**: Ensures proper data format before sending requests

#### Server-Side
- **AI API Errors**: Handles OpenAI API failures gracefully
- **JSON Parsing**: Validates AI responses against schemas
- **Streaming Errors**: Properly handles stream interruptions

### Performance Optimizations

#### Client-Side
- **Streaming**: Real-time updates provide immediate feedback
- **Debouncing**: Prevents excessive API calls
- **Caching**: Reuses editor instances and transforms

#### Server-Side
- **Durable Objects**: Stateful processing reduces initialization overhead
- **Connection Pooling**: Reuses OpenAI API connections
- **Streaming Processing**: Processes AI responses as they arrive

### Security Considerations

#### Input Validation
- **Prompt Sanitization**: Ensures safe user inputs
- **Schema Validation**: Validates all AI responses
- **Rate Limiting**: Could be implemented at the worker level

#### Access Control
- **API Keys**: Securely managed in environment variables
- **CORS**: Properly configured for client access
- **Authentication**: Currently uses anonymous sessions (could be extended)

### Extensibility

#### Adding New AI Providers
```typescript
// Implement the base service interface
export class CustomAiService extends TldrawAiBaseService {
  async generate(prompt: TLAiSerializedPrompt): Promise<TLAiResult> {
    // Custom implementation
  }
  
  async *stream(prompt: TLAiSerializedPrompt): AsyncGenerator<TLAiChange> {
    // Custom streaming implementation
  }
}

// Swap in the constructor
this.service = new CustomAiService(this.env)
```

#### Adding New Shape Types
1. Update the schema definitions
2. Add conversion logic in both directions
3. Update the system prompt to include new shape types
4. Add client-side transform support if needed

#### Adding New Features
- **Image Upload**: Already supported in prompt construction
- **Voice Input**: Could be added to client-side processing
- **Collaborative Editing**: Could integrate with tldraw's collaboration features
- **Undo/Redo**: Could track AI changes for reversal

This architecture provides a robust, scalable foundation for AI-powered drawing tools while maintaining clear separation of concerns and extensibility for future enhancements. 