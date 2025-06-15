# Vapi Setup Guide for Tutorix

This guide will walk you through setting up Vapi (Voice AI Platform) for the Tutorix project, including creating custom tools, configuring the AI assistant, and setting up environment variables.

## Prerequisites

- A Vapi account (sign up at [vapi.ai](https://vapi.ai))
- Your ngrok tunnel URL (see the quickstart guide for webhook setup)
- Access to your Tutorix project directory

## Step 1: Create a Vapi Account and Project

1. **Sign up/Login to Vapi**
   - Go to [https://vapi.ai](https://vapi.ai)
   - Sign up for an account or login if you already have one

2. **Access the Dashboard**
   - Once logged in, you'll see your Vapi dashboard
   - This is where you'll create tools and assistants

## Step 2: Create the Custom Tool

1. **Navigate to Tools**
   - In your Vapi dashboard, click on "Tools" in the left sidebar
   - Click the "Create Tool" or "+" button

2. **Configure the Tool Settings**
   Fill in the following details:

   **Basic Information:**
   - **Tool Name**: `update_whiteboard`
   - **Description**: `Updates the whiteboard with educational content when starting a new subtopic. Call this function before teaching each subtopic to display relevant whiteboardItems (titles, definitions, formulas, and bullet points) on the whiteboard.`
   - **Async**: Toggle this **ON** ✅

3. **Add Tool Parameters**
   In the Parameters section, select "JSON" and paste the following schema:

```json
{
  "type": "object",
  "properties": {
    "lessonId": {
      "description": "Lesson ID to identify which lesson page should receive the whiteboard updates",
      "type": "string"
    },
    "subtopic": {
      "description": "Complete subtopic object from the lesson plan",
      "type": "object",
      "required": [
        "index",
        "name",
        "summary",
        "durationSec",
        "whiteboardItems"
      ],
      "properties": {
        "name": {
          "description": "Subtopic name/title",
          "type": "string"
        },
        "index": {
          "description": "Subtopic index number (1, 2, 3, etc.)",
          "type": "number"
        },
        "summary": {
          "description": "Detailed explanation of what to teach in this subtopic",
          "type": "string"
        },
        "durationSec": {
          "description": "Duration in seconds for teaching this subtopic",
          "type": "number"
        },
        "whiteboardItems": {
          "description": "Array of whiteboard content items for this subtopic",
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "text": {
                "description": "Content text to display on whiteboard",
                "type": "string"
              },
              "type": {
                "description": "Type of content for proper styling and positioning",
                "type": "string",
                "enum": [
                  "title",
                  "heading",
                  "subheading",
                  "definition",
                  "bullet",
                  "formula",
                  "example",
                  "note"
                ]
              }
            },
            "required": [
              "text",
              "type"
            ]
          }
        }
      }
    }
  },
  "required": [
    "subtopic",
    "lessonId"
  ]
}
```

4. **Configure Server Settings**
   - **Server URL**: Enter your ngrok URL + `/api/whiteboard-update`
     - Example: `https://your-ngrok-url.ngrok-free.app/api/whiteboard-update`
     - Replace `your-ngrok-url` with your actual ngrok subdomain
   
   - **HTTP Headers**: Add the following header:
     - **Key**: `Content-Type`
     - **Value**: `application/json`

5. **Save the Tool**
   - Click "Save" or "Create Tool"
   - Make note of the tool ID for later use

## Step 3: Create the AI Assistant

1. **Navigate to Assistants**
   - In your Vapi dashboard, click on "Assistants" in the left sidebar
   - Click the "Create Assistant" or "+" button

2. **Configure Basic Settings**
   - **Assistant Name**: `Tutorix AI Tutor` (or any name you prefer)
   - **Model**: Select **OpenAI GPT-4.1**
   - **Voice**: Choose your preferred voice (recommended: a clear, professional voice)

3. **Add the System Prompt**
   In the System Prompt section, paste the following:

```
You are an AI tutor teaching lessons with whiteboard integration. You have access to an update_whiteboard tool that updates the visual whiteboard for students.

## YOUR LESSON DATA
Here is your lesson data:
- A lesson plan with subtopics in JSON format
{{playlist}}
- A lessonId for this specific lesson
{{lessonId}}

## CORE INSTRUCTION: USE THE TOOL FOR EVERY SUBTOPIC
CRITICAL: You MUST call the update_whiteboard tool before teaching EACH AND EVERY subtopic. This includes subtopic 1, subtopic 2, subtopic 3, and ALL subsequent subtopics.

### NEVER FORGET TO CALL update_whiteboard tool before starting any subtopic

When you need to update the whiteboard, CALL the update_whiteboard tool directly. Do NOT describe or narrate what you're calling - just call it silently and continue teaching.

## TEACHING FLOW
For EACH subtopic in your lesson plan (repeat this for ALL subtopics):

1. **Call the Tool First** (silently) - REQUIRED FOR EVERY SUBTOPIC
   - Use update_whiteboard tool with the complete subtopic data
   - Include the lessonId parameter
   - Do this BEFORE you start teaching the subtopic content

2. **Announce the Subtopic**
   - Say: "Let's start with [subtopic name]" or "Moving on to [subtopic name]"
   - Keep it natural and conversational

3. **Teach the Content**
   - Teach based on the subtopic's summary field
   - Reference what's now shown on the whiteboard
   - Use engaging, conversational language
   - Spend roughly the specified duration

4. **Check Understanding**
   - Ask: "Any questions about this topic?"
   - Wait for response before moving to next subtopic

## EXAMPLE FOR MULTIPLE SUBTOPICS
**Subtopic 1:**
- CALL: update_whiteboard (with subtopic 1 data + lessonId)
- SAY: "Let's start with the introduction..."
- TEACH: Content from subtopic 1 summary
- ASK: "Any questions about this introduction?"

**Subtopic 2:**
- CALL: update_whiteboard (with subtopic 2 data + lessonId)
- SAY: "Moving on to the second topic..."
- TEACH: Content from subtopic 2 summary
- ASK: "Any questions about this topic?"

**Subtopic 3:**
- CALL: update_whiteboard (with subtopic 3 data + lessonId)
- SAY: "Now let's explore the third topic..."
- TEACH: Content from subtopic 3 summary
- ASK: "Any questions about this topic?"

Continue this pattern for ALL subtopics in your lesson plan.

## TEACHING STYLE
- Warm and engaging
- Use examples and analogies
- Reference the whiteboard content naturally
- Keep students engaged with questions
- Follow the lesson sequence (subtopic 1, 2, 3, etc.)

## IMPORTANT REMINDERS
- ALWAYS call update_whiteboard before teaching EACH subtopic (not just the first one!)
- NEVER narrate or describe the function call
- Include ALL subtopic fields (index, name, summary, durationSec, whiteboardItems)
- ALWAYS include the lessonId parameter
- Teach content from the summary field only
- Keep the flow natural and student-focused

## LESSON COMPLETION
After you have completed ALL subtopics in the lesson plan:
- Provide a brief summary of what was covered
- Give an encouraging closing message
- Thank the student for their participation
- Example: "Great job! We've covered all the key concepts about [topic]. You now understand [brief recap of main points]. Thank you for being such an engaged student, and keep up the excellent learning!"

## ENDING THE SESSION
After lesson completion and if the student has no more questions or doubts:
- Ask the student: "Do you have any final questions or would you like me to end our session here?"
- If the student indicates they are done or agrees to end the session, call the end_call_tool to conclude the call
- If they have more questions, continue helping them before asking again

Start by welcoming the student and begin with the first subtopic.
```

4. **Configure Tools**
   In the Tools section, add the following tools:
   - ✅ **update_whiteboard** (the custom tool you created)
   - ✅ **end_call_tool** (built-in Vapi tool)

   **To add tools:**
   - Click "Add Tool"
   - Search for and select `update_whiteboard`
   - Click "Add Tool" again
   - Search for and select `end_call_tool`

5. **Configure Additional Settings** (Optional)
   - **Max Duration**: Set to 600 seconds (10 minutes) or your preferred lesson length
   - **Temperature**: 0.7 (good balance for educational content)
   - **Interruption Threshold**: Medium (allows natural conversation flow)

6. **Save the Assistant**
   - Click "Save" or "Create Assistant"
   - **Important**: Copy the Assistant ID from the URL or assistant details page

## Step 4: Get Your API Keys

1. **Navigate to API Keys**
   - In your Vapi dashboard, go to "Settings" or "API Keys"
   - You'll see your Public Key and Private Key

2. **Copy Your Keys**
   - **Public Key**: This will be used in your frontend application
   - **Assistant ID**: From the assistant you just created

## Step 5: Configure Environment Variables

1. **Create/Edit .env.local File**
   - In your Tutorix project root directory, create or edit `.env.local`
   - Add the following environment variables:

```env
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key-here
VITE_VAPI_ASSISTANT_ID=your-assistant-id-here
```

2. **Replace the Placeholder Values**
   - Replace `your-vapi-public-key-here` with your actual Vapi Public Key
   - Replace `your-assistant-id-here` with your actual Assistant ID

**Example .env.local file:**
```env
VITE_VAPI_PUBLIC_KEY=pk_1234567890abcdef...
VITE_VAPI_ASSISTANT_ID=asst_abcdef123456...
```

## Step 6: Update Your Webhook URL

⚠️ **Important**: Your ngrok URL changes every time you restart ngrok. You'll need to update your tool's Server URL whenever this happens.

1. **Get Your Current ngrok URL**
   - Run `./setup-ngrok.sh` or start ngrok manually
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

2. **Update the Tool**
   - Go to your Vapi dashboard → Tools → `update_whiteboard`
   - Update the Server URL to: `https://your-new-ngrok-url.ngrok-free.app/api/whiteboard-update`
   - Save the changes

## Step 7: Test Your Setup

1. **Start Your Development Environment**
   ```bash
   # Terminal 1: Start the main app
   pnpm dev
   
   # Terminal 2: Start the webhook server
   node webhook-dev-server.js
   
   # Terminal 3: Start ngrok
   ./setup-ngrok.sh
   ```

2. **Test the Integration**
   - Go to your Tutorix application
   - Create a lesson with any topic
   - Navigate to the lesson page
   - Click the Vapi widget to start a call
   - The AI should begin teaching and update the whiteboard for each subtopic

3. **Verify the Flow**
   - ✅ AI welcomes you and starts teaching
   - ✅ Whiteboard updates automatically for each subtopic
   - ✅ AI teaches content from the lesson plan
   - ✅ AI asks questions and waits for responses
   - ✅ AI can end the call when requested

## Troubleshooting

### Common Issues

1. **Tool Not Working**
   - Check that your ngrok URL is correct and active
   - Verify the webhook server is running on port 5174
   - Make sure the tool has the correct Server URL

2. **Assistant Not Found**
   - Double-check your Assistant ID in `.env.local`
   - Make sure there are no extra spaces or characters

3. **No Whiteboard Updates**
   - Check the webhook server console for incoming requests
   - Verify your SSE connection is working in the browser console
   - Check that the lesson ID is being passed correctly

4. **Voice Quality Issues**
   - Try different voice options in the assistant settings
   - Check your microphone permissions
   - Ensure stable internet connection

### Debug Tips

- **Webhook Logs**: Check the webhook server console for incoming requests
- **Browser Console**: Look for SSE connection messages and errors
- **Vapi Dashboard**: Check the assistant logs for tool call attempts
- **Network Tab**: Monitor API requests in browser developer tools

## Production Considerations

### For Production Deployment

1. **Use Stable URLs**
   - Replace ngrok with a permanent webhook URL
   - Update your tool configuration with the production URL

2. **Environment Variables**
   - Use production Vapi keys
   - Store sensitive keys securely
   - Consider using different assistants for dev/prod

3. **Rate Limiting**
   - Monitor your Vapi usage
   - Set appropriate limits for production traffic

## Additional Configuration Options

### Advanced Assistant Settings

- **Fallback Messages**: Configure what the AI says if tools fail
- **Background Sounds**: Add background audio for better experience
- **Custom Voice**: Upload custom voice samples if needed
- **Conversation Starters**: Set predefined conversation openers

### Tool Enhancements

- **Error Handling**: Add retry logic for failed webhook calls
- **Logging**: Enhanced logging for debugging
- **Validation**: Additional parameter validation

---

🎉 **Congratulations!** Your Vapi AI assistant is now configured and ready to teach with intelligent whiteboard integration!

## Quick Reference

**Key URLs to Remember:**
- Vapi Dashboard: [https://dashboard.vapi.ai](https://dashboard.vapi.ai)
- Your webhook endpoint: `https://your-ngrok-url.ngrok-free.app/api/whiteboard-update`

**Environment Variables:**
```env
VITE_VAPI_PUBLIC_KEY=pk_...
VITE_VAPI_ASSISTANT_ID=asst_...
```

**Tools Required:**
- `update_whiteboard` (custom tool)
- `end_call_tool` (built-in tool) 