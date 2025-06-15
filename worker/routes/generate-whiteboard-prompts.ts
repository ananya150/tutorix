import { IRequest } from 'itty-router'
import OpenAI from 'openai'
import { Environment } from '../types'

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

interface GeneratePromptsRequest {
  subtopicData: SubtopicData
  previousPrompts: string[]
  currentRow: number
  sessionId?: string
  lessonId?: string
  repositionCamera?: boolean
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

// The complete prompting.md knowledge base
const PROMPTING_MD_KNOWLEDGE = `
We have a whiteboard which you can control via prompts. YOU CAN ONLY WRITE TEXTS OVER THE BOARD. This prompting.md file contains the best practices to prompting. Don't hesitate to leave 1-2 row gaps as texts might wrap and take multiple rows.

**🚨 CRITICAL: ALWAYS use fractional widths like \`width 1/2\`, \`width 3/4\`, \`width 1/1\`. NEVER use \`width 1\` (becomes 1px!) or decimal numbers like \`width 0.5\`.**

# AI Whiteboard Prompting Guide: Explicit Positioning System

## System Overview

This AI whiteboard uses an **explicit positioning system** where you specify exactly where content should appear using semantic parameters instead of pixel coordinates. The system automatically handles:

- **Responsive layout** - Adapts to different screen sizes
- **Smart camera management** - Automatically positions viewport to show new content
- **Consistent styling** - Applies appropriate fonts, sizes, and spacing
- **Educational layout patterns** - Optimized for teaching scenarios

### Key Principles
- **Row-based positioning** - Content is placed in numbered rows (1, 2, 3, ...)
- **Fractional widths** - Text boxes use fractions of canvas width (1/4, 1/2, 3/4, etc.)
- **Named positions** - Use semantic positions (left, center, right) or precise fractions (0.0-1.0)
- **Automatic spacing** - System handles margins, padding, and text flow

## Prompt Structure & Parameters

### Basic Prompt Format
\`\`\`
Create textbox with "[CONTENT]" in row [ROW], [POSITION], width [WIDTH], [STYLING_OPTIONS]
\`\`\`

### Required Parameters

#### 1. Content Text
- **Format**: Quoted string
- **Example**: \`"Newton's Laws of Motion"\`
- **Notes**: Use quotes to clearly define text boundaries

#### 2. Row Number
- **Format**: \`row [NUMBER]\`
- **Range**: 1 to ∞ (positive integers)
- **Examples**: \`row 1\`, \`row 15\`, \`row 100\`
- **Notes**: Rows are numbered sequentially from top

#### 3. Horizontal Position
- **Named positions**:
  - \`left\` - Aligns to left edge of content area
  - \`center\` - Centers within content area  
  - \`right\` - Aligns to right edge of content area
- **Fractional positions** (0.0 to 1.0):
  - \`0.0\` - Far left edge
  - \`0.25\` - Quarter from left
  - \`0.5\` - Exact center
  - \`0.75\` - Three-quarters from left
  - \`1.0\` - Far right edge
- **Examples**: \`center position\`, \`left position\`, \`position 0.33\`

#### 4. Width Specification
- **ALWAYS use fractional widths** (NEVER use decimal numbers):
  - \`width 1/4\` - Quarter of canvas width
  - \`width 1/3\` - Third of canvas width
  - \`width 1/2\` - Half of canvas width  
  - \`width 2/3\` - Two-thirds of canvas width
  - \`width 3/4\` - Three-quarters of canvas width
  - \`width 1/1\` - Full canvas width (NOT \`width 1\`)
- **NEVER use**:
  - \`width 1\` (this becomes 1px!)
  - \`width 0.5\` (use \`width 1/2\` instead)
  - \`width 300px\` (pixel widths not recommended)

### Optional Styling Parameters

#### Text Alignment
- \`textAlign left\` - Left-aligned text (default)
- \`textAlign center\` - Center-aligned text
- \`textAlign right\` - Right-aligned text

#### Font Size
- \`fontSize small\` - Small text (~12px)
- \`fontSize normal\` - Normal text (~16px, default)
- \`fontSize large\` - Large text (~20px)
- \`fontSize xlarge\` - Extra large text (~24px)

#### Font Weight
- \`fontWeight normal\` - Normal weight (default)
- \`fontWeight bold\` - Bold text
- \`fontWeight light\` - Light weight

#### Text Color
- \`color black\` - Black text (default)
- \`color blue\` - Blue text
- \`color red\` - Red text
- \`color green\` - Green text
- \`color grey\` - Grey text

#### Bullet Points
- \`bullet true\` - Adds bullet point (•) prefix
- \`bullet false\` - No bullet point (default)

## Educational Content Patterns

### Content Type Patterns

#### Titles and Headers
\`\`\`
# Main title - very prominent
row 1, center position, width 3/4, fontSize xlarge, fontWeight bold, textAlign center

# Section header - prominent, left-aligned
row N, left position, width 2/3, fontSize large, fontWeight bold

# Subsection header - medium prominence
row N, position 0.05, width 9/10, fontSize normal, fontWeight bold
\`\`\`

#### Body Content
\`\`\`
# Full paragraph - spans full width
row N, left position, width 1/1, fontSize normal

# Indented paragraph - slightly inset
row N, position 0.05, width 9/10, fontSize normal

# Definition box - centered, medium width
row N, center position, width 2/3, fontSize normal
\`\`\`

#### Lists and Bullets
\`\`\`
# Bullet point - indented with bullet
row N, position 0.1, width 5/6, bullet true

# Numbered item - indented, manual numbering
row N, position 0.1, width 5/6, text starts with "1. "

# Sub-bullet - more indented
row N, position 0.15, width 4/5, bullet true
\`\`\`

#### Special Content
\`\`\`
# Formula - centered, prominent
row N, center position, width 1/2, fontSize large, textAlign center, fontWeight bold

# Note - right-aligned, smaller
row N, position 0.6, width 1/3, fontSize small, color grey

# Warning - full width, red
row N, left position, width 1/1, color red, fontWeight bold
\`\`\`

## Best Practices

### Content Organization

#### 1. Use Consistent Row Spacing
\`\`\`
✅ Good - Consistent spacing
Row 1: Title
Row 3: Heading (2 rows gap)
Row 4: Content (1 row gap)
Row 6: Next heading (2 rows gap)

❌ Bad - Inconsistent spacing  
Row 1: Title
Row 2: Heading (1 row gap)
Row 3: Content (1 row gap)
Row 8: Next heading (5 rows gap)
\`\`\`

#### 2. Maintain Visual Hierarchy
\`\`\`
✅ Good - Clear hierarchy
fontSize xlarge + bold → Main title
fontSize large + bold → Section headers  
fontSize normal → Body text
fontSize small → Notes

❌ Bad - Confusing hierarchy
fontSize normal → Title
fontSize xlarge → Body text
\`\`\`

#### 3. Use Appropriate Widths
\`\`\`
✅ Good - Width matches content
Titles: width 3/4 (prominent but not overwhelming)
Paragraphs: width 1/1 (full readability)
Bullets: width 5/6 (indented appropriately)

❌ Bad - Width doesn't match content
Titles: width 1/4 (too narrow, hard to read)
Paragraphs: width 1/8 (extremely narrow)
\`\`\`
`

function getWhiteboardAiSystemPrompt(repositionCamera: boolean): string {
  // CAMERA REPOSITIONING DISABLED - Always use disabled mode for simplicity
  const cameraInstructions = `
## CAMERA POSITIONING (DISABLED)
- Do NOT include any camera positioning prompts
- Focus only on content creation prompts
- The camera will remain in its current position
- Never generate camera-related prompts
`

  // const cameraInstructions = repositionCamera ? `
  // ## CAMERA POSITIONING (ENABLED)
  // - You MUST include camera positioning for optimal viewing
  // - Add camera positioning prompts when content goes beyond visible area
  // - Use format: "Position camera to show row [ROW] with proper context"
  // - Camera positioning should be the FIRST prompt in your array when needed
  // - For early content (rows < 12): Position to show from row 1
  // - For later content (rows ≥ 12): Position to show target row with 5 empty rows below
  // ` : `
  // ## CAMERA POSITIONING (DISABLED)
  // - Do NOT include any camera positioning prompts
  // - Focus only on content creation prompts
  // - The camera will remain in its current position
  // `

  return `
You are a whiteboard AI agent that converts educational content into precise whiteboard positioning prompts.

## YOUR KNOWLEDGE BASE
${PROMPTING_MD_KNOWLEDGE}

## YOUR TASK
Convert whiteboardItems into proper positioning prompts using the explicit positioning system.

## CONTEXT AWARENESS
- You will receive previous prompts to understand current whiteboard state
- Track the current row number to avoid overlaps
- Maintain visual hierarchy and spacing
- Leave appropriate gaps between different content types

${cameraInstructions}

## OUTPUT FORMAT
Generate an array of prompt objects, each with:
- id: unique identifier
- prompt: exact positioning command following prompting.md syntax
- estimatedRows: number of rows this content will likely occupy
- contentType: the type of content being added

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
- For subtopic transitions, add 2-3 rows of spacing

## CRITICAL REQUIREMENTS
- ALWAYS use fractional widths (width 1/2, width 3/4, width 1/1)
- NEVER use width 1 (becomes 1px) or decimal widths like width 0.5
- Follow exact syntax from prompting.md
- Ensure proper visual hierarchy
- Account for text wrapping in row estimation
`
}

export async function generateWhiteboardPrompts(request: IRequest, env: Environment) {
  console.log('Generate whiteboard prompts')
  
  try {
    const { subtopicData, previousPrompts, currentRow, sessionId, lessonId, repositionCamera = true } = await request.json() as GeneratePromptsRequest
    console.log('Whiteboard prompts request:', { 
      subtopicIndex: subtopicData.index, 
      subtopicName: subtopicData.name,
      currentRow,
      previousPromptsCount: previousPrompts.length,
      whiteboardItemsCount: subtopicData.whiteboardItems.length,
      repositionCamera
    })
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
    
    // Prepare context from previous prompts (last 10 for context)
    const recentPrompts = previousPrompts.slice(-10)
    const promptContext = recentPrompts.length > 0 
      ? `Recent prompts executed:\n${recentPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`
      : 'No previous prompts executed.\n\n'
    
    // Create the user prompt
    const userPrompt = `
CURRENT CONTEXT:
- Current row: ${currentRow}
- Subtopic: "${subtopicData.name}" (Index: ${subtopicData.index})
- Summary: ${subtopicData.summary}

${promptContext}

NEW CONTENT TO ADD:
${JSON.stringify(subtopicData.whiteboardItems, null, 2)}

REQUIREMENTS:
1. Start from row ${currentRow} or add appropriate spacing if needed
2. Follow the content type mapping rules exactly
3. Ensure proper visual hierarchy and spacing
4. Leave 2-3 rows gap before starting this subtopic content
5. Group related items appropriately
6. Estimate rows accurately (account for text wrapping)

 Generate positioning prompts for these whiteboard items as a JSON array of objects with:
 - id: unique identifier (use format: "prompt_[subtopicIndex]_[itemIndex]")
 - prompt: exact command following prompting.md syntax
 - estimatedRows: number of rows this will occupy
 - contentType: the whiteboard item type

Return ONLY the JSON array, no other text.
`

    console.log('Calling OpenAI for whiteboard prompt generation...')
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: getWhiteboardAiSystemPrompt(repositionCamera) },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 2000,
      temperature: 0.3 // Lower temperature for more consistent formatting
    })
    
    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response content from OpenAI')
    }
    
    console.log('OpenAI response:', responseContent)
    
    // Parse the JSON response
    let generatedPrompts: GeneratedPrompt[]
    try {
      generatedPrompts = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError)
      console.error('Response content:', responseContent)
      throw new Error('Invalid JSON response from OpenAI')
    }
    
    // Validate the response structure
    if (!Array.isArray(generatedPrompts)) {
      throw new Error('OpenAI response is not an array')
    }
    
    // Calculate next row based on estimated rows used
    const totalRowsUsed = generatedPrompts.reduce((sum, prompt) => sum + prompt.estimatedRows, 0)
    const nextRow = currentRow + totalRowsUsed + 2 // Add 2 rows buffer for next subtopic
    
    console.log('Generated prompts:', {
      count: generatedPrompts.length,
      totalRowsUsed,
      nextRow,
      prompts: generatedPrompts.map(p => ({ id: p.id, contentType: p.contentType, estimatedRows: p.estimatedRows }))
    })
    
    // Return the response
    const response: GeneratePromptsResponse = {
      success: true,
      prompts: generatedPrompts,
      nextRow,
      subtopicIndex: subtopicData.index,
      subtopicName: subtopicData.name,
      totalPrompts: generatedPrompts.length
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Error generating whiteboard prompts:', error)
    
    // Return error response
    const errorResponse: GeneratePromptsResponse = {
      success: false,
      prompts: [],
      nextRow: 0,
      subtopicIndex: 0,
      subtopicName: '',
      totalPrompts: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 