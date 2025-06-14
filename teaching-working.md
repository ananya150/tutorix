# AI Teaching System: Streamlined Vapi-Based Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [Component Details](#component-details)
4. [Data Flow & Sequence](#data-flow--sequence)
5. [Implementation Plan](#implementation-plan)
6. [Technical Specifications](#technical-specifications)
7. [Error Handling & Edge Cases](#error-handling--edge-cases)
8. [Future Enhancements](#future-enhancements)

---

## System Overview

### Key Innovation
Instead of complex multi-agent coordination, this system uses a **single intelligent Vapi assistant** with **pre-planned lesson structure** injected upfront. The assistant handles both voice teaching and whiteboard coordination through function calling.

### Core Philosophy
- **One LLM, Multiple Capabilities**: Single Vapi assistant manages teaching flow and whiteboard actions
- **Upfront Planning**: Entire lesson plan injected as dynamic variable before first token streams
- **Async Function Calls**: Whiteboard updates happen without blocking speech flow
- **Native Interruption Handling**: Leverage Vapi's built-in barge-in detection

### Benefits Over Multi-Agent Approach
✅ **Simplicity**: One conversation thread instead of agent coordination  
✅ **Lower Latency**: No inter-agent communication delays  
✅ **Higher Reliability**: Fewer failure points and coordination complexity  
✅ **Cost Efficiency**: Single LLM call instead of multiple agents  
✅ **Natural Flow**: Vapi handles interruptions and conversation state natively  

---

## Core Architecture

### High-Level Flow
```
┌──────────┐     ① POST /plan(topic)    ┌──────────────┐
│  Client  │ ─────────────────────────▶ │  Planner LLM │
└──────────┘     ◀─ sub-topic JSON ────  └──────────────┘
      │                                   ▲
      │ ② POST /start-lesson              │
      ▼ (topic, playlist)                 │
┌──────────────────────┐          stores / logs
│ Session Orchestrator │──────────────────────────┐
└──────────────────────┘                          │
      │ ③ POST /calls                            │
      ▼   assistantId, playlist variable         │
┌──────────────────────────┐    ⑤ webhook        │
│        Vapi Tutor        │─── whiteboard_write │
└──────────────────────────┘    (plain text)     │
      ▲        ▲    ④ barge-in events            │
      │        │                                 │
      │        │ ⑥ summaries / embeddings ───────┘
      │        │
┌─────┴─────┐  │
│   User    │◀─ voice / TTS stream
└───────────┘
```

### System Components
1. **Client Interface** - Topic collection and lesson navigation
2. **Planner LLM** - Generates structured lesson plans
3. **Session Orchestrator** - Manages lesson lifecycle and Vapi integration
4. **Vapi Voice Tutor** - Single intelligent assistant handling teaching + whiteboard
5. **Whiteboard Agent** - Parses natural language and executes positioning commands
6. **Memory Store** - Session continuity and learning analytics

---

## Component Details

### 1. Client Interface

#### Purpose
- Collect learning topic from user
- Navigate to lesson interface
- Provide real-time lesson progress (optional)

#### Implementation
```typescript
// Topic Collection Page
interface TopicInput {
  topic: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: number // minutes
  focus?: string[] // specific areas of interest
}

// Lesson Interface
interface LessonPage {
  courseId: string
  websocketConnection: WebSocket // for live captions/progress
  whiteboardContainer: TldrawEditor
  voiceInterface: VapiClient
}
```

### 2. Planner LLM (Serverless Function)

#### Purpose
Generate structured, time-bounded lesson plans from user topics

#### Input/Output
```typescript
// Input
interface PlanRequest {
  topic: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  focus?: string[]
}

// Output
interface LessonPlan {
  topic: string
  totalDuration: number
  learningObjectives: string[]
  subtopics: SubTopic[]
}

interface SubTopic {
  index: number
  title: string
  duration: number // ~45 seconds each
  bullets: string[] // key points to cover
  whiteboardHints?: {
    type: 'heading' | 'definition' | 'diagram' | 'formula' | 'example'
    elements: string[]
    focus: 'visual' | 'text' | 'mixed'
  }
}
```

#### LLM Prompt Strategy
```typescript
const PLANNER_PROMPT = `
You are an expert curriculum designer. Create a structured lesson plan for: "${topic}"

Requirements:
- Break into ${Math.ceil(duration/45)} subtopics (~45 seconds each)
- Level: ${level}
- Include clear learning progression
- Specify key concepts that need visual representation
- Each subtopic should build on previous ones

Output structured JSON with:
- Clear subtopic titles
- 3-5 bullet points per subtopic
- Logical teaching sequence
- Whiteboard hints for visual elements

Focus on practical understanding and engagement.
`
```

### 3. Session Orchestrator API

#### Purpose
Coordinate lesson lifecycle, manage Vapi calls, handle session state

#### Key Endpoints
```typescript
// Start new lesson
POST /api/lessons/start
{
  topic: string,
  preferences: UserPreferences
}
Response: { courseId, lessonPlan, vapiCallId }

// Resume existing lesson
POST /api/lessons/resume
{
  courseId: string,
  sessionId: string
}

// End lesson and save progress
POST /api/lessons/end
{
  courseId: string,
  summary: string
}
```

#### Vapi Integration
```typescript
async function startVapiLesson(lessonPlan: LessonPlan, courseId: string) {
  const vapiCall = await fetch('https://api.vapi.ai/calls', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assistantId: process.env.VAPI_TEACHER_ASSISTANT_ID,
      customer: { 
        number: userPhoneNumber // or web client
      },
      assistantOverrides: {
        variableValues: { 
          playlist: JSON.stringify(lessonPlan),
          courseId: courseId,
          studentLevel: lessonPlan.level
        }
      },
      sessionId: `course_${courseId}`,
      metadata: {
        courseId,
        topic: lessonPlan.topic,
        startTime: new Date().toISOString()
      }
    })
  })
  
  return vapiCall.json()
}
```

### 4. Vapi Voice Tutor

#### System Prompt Template
```typescript
const VAPI_SYSTEM_PROMPT = `
You are an engaging and knowledgeable tutor. Your lesson plan is:

{{playlist}}

TEACHING PROTOCOL:
1. Greet the student warmly and introduce the topic
2. Ask "Ready to begin?" and wait for consent
3. For each subtopic in the playlist:
   a) Call whiteboard_write function with natural description of what to draw
   b) Teach conversationally for ~45 seconds
   c) Pause briefly for questions or clarification
   d) Move smoothly to next subtopic

WHITEBOARD FUNCTION USAGE:
- Call whiteboard_write(message) before teaching each subtopic
- Describe what should be drawn in natural language
- Example: "Draw the title 'Photosynthesis Overview' and bullet points for the main steps"
- Be specific about diagrams, formulas, or visual elements needed

TEACHING STYLE:
- Conversational and engaging
- Use analogies and real-world examples
- Encourage questions and interaction
- Adapt pace based on student responses
- Keep explanations clear and age-appropriate

INTERRUPTION HANDLING:
- When interrupted, acknowledge the question immediately
- Provide clear, concise answers
- Ask if they want you to continue or elaborate
- Smoothly return to lesson flow

Remember: You have the complete lesson plan upfront. Stay on track but be flexible for student needs.
`
```

#### Function Definition
```json
{
  "name": "whiteboard_write",
  "description": "Tell the whiteboard agent what to draw or write",
  "parameters": {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "description": "Natural language description of what should appear on the whiteboard"
      },
      "priority": {
        "type": "string",
        "enum": ["high", "medium", "low"],
        "description": "Priority level for this whiteboard action"
      }
    },
    "required": ["message"]
  },
  "async": true,
  "webhookUrl": "https://your-domain.com/api/whiteboard/write"
}
```

### 5. Whiteboard Agent

#### Purpose
Parse natural language instructions and convert to explicit positioning commands

#### Webhook Implementation
```typescript
// POST /api/whiteboard/write
interface WhiteboardRequest {
  message: string
  priority?: 'high' | 'medium' | 'low'
  metadata?: {
    courseId: string
    subtopicIndex: number
    timestamp: string
  }
}

async function handleWhiteboardWrite(req: WhiteboardRequest) {
  const { message, priority = 'medium' } = req
  
  // Parse intent with LLM
  const instructions = await parseWhiteboardIntent(message)
  
  // Generate explicit positioning prompts
  const prompts = await generatePositioningPrompts(instructions)
  
  // Execute on whiteboard
  const results = await executeWhiteboardActions(prompts)
  
  return { success: true, actionsExecuted: results.length }
}
```

#### Intent Parsing LLM
```typescript
async function parseWhiteboardIntent(message: string) {
  const prompt = `
  Parse this teaching instruction into specific whiteboard actions:
  "${message}"
  
  Current whiteboard state: Row ${currentRow}
  
  Determine:
  1. Content type: title, heading, definition, bullet, formula, diagram, example
  2. Specific text to write
  3. Visual elements needed (if any)
  4. Positioning strategy using explicit positioning system
  
  Use the prompting.md guidelines for exact syntax.
  
  Output structured commands that can be executed directly.
  `
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: WHITEBOARD_PARSING_PROMPT },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

### 6. Memory Store & Session Continuity

#### Session State Management
```typescript
interface SessionState {
  courseId: string
  sessionId: string
  currentSubtopic: number
  completedSubtopics: number[]
  whiteboardState: {
    currentRow: number
    contentHistory: WhiteboardElement[]
  }
  studentInteractions: {
    questions: string[]
    clarifications: string[]
    feedback: string[]
  }
  timing: {
    startTime: Date
    subtopicTimings: { index: number, duration: number }[]
  }
}
```

#### Cross-Session Memory
```typescript
// Store after each session
interface SessionSummary {
  sessionId: string
  courseId: string
  topicsCovered: string[]
  studentQuestions: string[]
  comprehensionLevel: 'high' | 'medium' | 'low'
  areasNeedingReview: string[]
  nextSessionRecommendations: string[]
  embedding: number[] // vector representation for similarity search
}

// Retrieve for next session
async function getSessionContext(courseId: string): Promise<string> {
  const previousSessions = await vectorDB.query({
    filter: { courseId },
    topK: 3
  })
  
  return `
  Previous learning context:
  ${previousSessions.map(s => s.summary).join('\n')}
  
  Areas needing review: ${previousSessions[0]?.areasNeedingReview}
  Student's typical questions: ${previousSessions[0]?.studentQuestions}
  `
}
```

---

## Data Flow & Sequence

### Per-Subtopic Teaching Sequence

| Step | Actor | Action | Details |
|------|-------|--------|---------|
| A | Vapi Tutor | Emits `whiteboard_write({message: "Next: Stomata regulation..."})` | Function call with natural language |
| B | Vapi Platform | Forwards call to webhook, continues TTS immediately | Async execution, no speech blocking |
| C | Whiteboard Agent | Parses message, generates positioning prompts, executes | LLM parsing + explicit positioning |
| D | Whiteboard Agent | Returns 200 OK to Vapi | Confirms action completion |
| E | Vapi Tutor | Teaches conversationally for ~45 seconds | Natural teaching flow |
| F | Vapi Tutor | Handles any student interruptions/questions | Built-in interruption detection |
| G | Vapi Tutor | Transitions to next subtopic | Repeats sequence |

### Example Teaching Flow
```typescript
// Subtopic 1: Introduction
whiteboard_write({
  message: "Write the main title 'Photosynthesis' centered at the top, then add a definition: 'The process by which plants convert light energy into chemical energy'"
})
// → Vapi continues speaking while whiteboard updates

// Subtopic 2: Light-Dependent Reactions  
whiteboard_write({
  message: "Add a heading 'Light-Dependent Reactions' and draw a simple chloroplast diagram showing thylakoids and stroma"
})
// → Teaching continues seamlessly

// Student interruption: "What are thylakoids?"
// → Vapi handles naturally, may call whiteboard_write for clarification diagram
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. **Planner LLM Setup**
   - Create serverless function for lesson planning
   - Design lesson plan schema
   - Test with various topics and complexity levels

2. **Session Orchestrator**
   - Build API endpoints for lesson management
   - Implement Vapi integration
   - Set up basic session state management

3. **Vapi Assistant Configuration**
   - Create and configure Vapi assistant
   - Design system prompt with playlist injection
   - Set up whiteboard_write function definition

### Phase 2: Whiteboard Integration (Week 2)
1. **Whiteboard Agent**
   - Build webhook endpoint for function calls
   - Implement LLM-based intent parsing
   - Connect to existing explicit positioning system

2. **Testing & Refinement**
   - Test end-to-end flow with simple topics
   - Refine whiteboard parsing accuracy
   - Optimize positioning strategies

### Phase 3: Advanced Features (Week 3)
1. **Session Continuity**
   - Implement memory storage and retrieval
   - Add cross-session context injection
   - Build progress tracking

2. **Error Handling & Recovery**
   - Handle webhook failures gracefully
   - Implement retry mechanisms
   - Add fallback strategies

### Phase 4: Polish & Optimization (Week 4)
1. **User Experience**
   - Improve client interface
   - Add real-time progress indicators
   - Optimize voice/whiteboard synchronization

2. **Analytics & Insights**
   - Add learning analytics
   - Implement session quality metrics
   - Build teacher dashboard (optional)

---

## Technical Specifications

### Environment Variables
```bash
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key
VAPI_TEACHER_ASSISTANT_ID=your_assistant_id
VAPI_WEBHOOK_SECRET=your_webhook_secret

# OpenAI for Planner & Whiteboard Agent
OPENAI_API_KEY=your_openai_key

# Database
DATABASE_URL=your_database_connection
VECTOR_DB_URL=your_vector_db_connection

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
WEBHOOK_BASE_URL=https://your-domain.com/api
```

### API Endpoints
```typescript
// Lesson Management
POST   /api/lessons/plan          // Generate lesson plan
POST   /api/lessons/start         // Start new lesson
POST   /api/lessons/resume        // Resume existing lesson
POST   /api/lessons/end           // End and save lesson
GET    /api/lessons/:id           // Get lesson details

// Vapi Webhooks
POST   /api/vapi/whiteboard/write // Whiteboard function calls
POST   /api/vapi/events           // Vapi event webhooks

// Session Management
GET    /api/sessions/:id          // Get session state
PUT    /api/sessions/:id          // Update session state
POST   /api/sessions/:id/summary  // Save session summary
```

### Database Schema
```sql
-- Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  level VARCHAR(50) NOT NULL,
  duration INTEGER NOT NULL,
  plan JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  vapi_call_id VARCHAR(255),
  state JSONB NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  summary TEXT
);

-- Session Summaries (for vector search)
CREATE TABLE session_summaries (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  summary TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  topics_covered TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Error Handling & Edge Cases

### Webhook Failures
```typescript
// Retry mechanism for whiteboard actions
async function executeWithRetry(action: WhiteboardAction, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await executeWhiteboardAction(action)
      return { success: true }
    } catch (error) {
      if (attempt === maxRetries) {
        // Log failure, continue lesson without whiteboard
        console.error('Whiteboard action failed after retries:', error)
        return { success: false, error }
      }
      await delay(attempt * 1000) // Exponential backoff
    }
  }
}
```

### Student Interaction Edge Cases
```typescript
// Handle common student requests
const STUDENT_INTERACTION_PATTERNS = {
  "go back": "Navigate to previous subtopic",
  "repeat": "Repeat current explanation",
  "slower": "Reduce speaking pace",
  "example": "Provide additional example",
  "skip": "Move to next subtopic",
  "explain": "Provide deeper explanation"
}
```

### Vapi Call Interruptions
```typescript
// Handle call drops and reconnections
interface CallRecovery {
  sessionId: string
  lastSubtopic: number
  resumePoint: string
  whiteboardState: WhiteboardState
}

async function recoverSession(callRecovery: CallRecovery) {
  // Restore session state
  // Resume from last known position
  // Sync whiteboard state
}
```

---

## Future Enhancements

### Advanced Features
1. **Multi-Modal Learning**
   - Image upload and analysis
   - Document parsing and teaching
   - Video content integration

2. **Adaptive Learning**
   - Difficulty adjustment based on comprehension
   - Personalized learning paths
   - Spaced repetition integration

3. **Collaborative Learning**
   - Multiple students in same session
   - Peer interaction features
   - Group whiteboard collaboration

4. **Assessment Integration**
   - Real-time comprehension checking
   - Quiz generation and delivery
   - Progress tracking and analytics

### Technical Improvements
1. **Performance Optimization**
   - Caching strategies for lesson plans
   - Optimized whiteboard rendering
   - Reduced latency for function calls

2. **Scalability**
   - Multi-region deployment
   - Load balancing for high traffic
   - Database optimization

3. **Monitoring & Analytics**
   - Real-time system monitoring
   - Learning effectiveness metrics
   - User engagement analytics

---

## Conclusion

This streamlined architecture leverages Vapi's strengths while maintaining simplicity and reliability. By using a single intelligent assistant with pre-planned lessons and async function calling, we achieve:

- **Natural teaching flow** with minimal technical complexity
- **Reliable whiteboard integration** without blocking speech
- **Scalable architecture** that can grow with additional features
- **Cost-effective operation** with optimized LLM usage

The system is designed to feel natural and engaging for students while being maintainable and extensible for developers. 