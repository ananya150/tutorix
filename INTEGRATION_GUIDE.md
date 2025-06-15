# Integration Guide - Connecting the Whiteboard AI System

## Quick Start

### 1. The App is Already Set Up ✅

The `WhiteboardProvider` has been added to `client/App.tsx`, so the context is available throughout your app.

### 2. Connect to Your Existing Stream Function

In your `LessonPage` or wherever you use the tldraw AI, update it like this:

```tsx
// client/pages/LessonPage.tsx
import { useWhiteboardWebhook } from '../hooks/useWhiteboardWebhook'
import { useTldrawAiExample } from '../hooks/useTldrawAiExample' // Your existing hook
import { WhiteboardTestPanel } from '../components/WhiteboardTestPanel'

export function LessonPage() {
  // Your existing tldraw setup
  const { streamFunction } = useTldrawAiExample() // Replace with your actual stream function
  
  // New whiteboard webhook integration
  const webhook = useWhiteboardWebhook(streamFunction)
  
  return (
    <div>
      {/* Your existing lesson page content */}
      
      {/* Add the test panel for development */}
      <WhiteboardTestPanel streamFunction={streamFunction} />
      
      {/* Your existing Tldraw component */}
    </div>
  )
}
```

### 3. Update Your Webhook Server

Your existing `webhook-dev-server.js` should now call the new webhook hook. Update the webhook handler:

```javascript
// In webhook-dev-server.js, update the webhook handler
app.post('/api/whiteboard-update', async (req, res) => {
  try {
    const { subtopic } = req.body
    
    // Send SSE event to trigger the new system
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({
        type: 'subtopic_update',
        subtopic: subtopic
      })}\n\n`)
    })
    
    // Return Vapi-compatible response
    res.json({
      results: [{
        toolCallId: "e00c5f96-2ec4-4576-8f04-93498df8d5d8",
        result: `Whiteboard updated for subtopic: ${subtopic.name}`
      }]
    })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({
      results: [{
        toolCallId: "e00c5f96-2ec4-4576-8f04-93498df8d5d8",
        error: error.message
      }]
    })
  }
})
```

### 4. Connect SSE to Webhook Hook

Update your SSE connection to trigger the webhook hook:

```tsx
// In your component that handles SSE
import { useWhiteboardWebhook } from '../hooks/useWhiteboardWebhook'

const webhook = useWhiteboardWebhook(streamFunction)

// In your SSE event handler
useEffect(() => {
  const eventSource = new EventSource('/api/sse')
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'subtopic_update') {
      // Trigger the new webhook system
      webhook.handleWebhookCall(data.subtopic)
    }
  }
  
  return () => eventSource.close()
}, [webhook])
```

## Testing the Integration

### 1. Start Your Development Servers

```bash
# Terminal 1: Start the main app
npm run dev

# Terminal 2: Start the webhook server
node webhook-dev-server.js

# Terminal 3: Start ngrok (if needed)
ngrok http 3001
```

### 2. Use the Test Panel

1. Open your app in the browser
2. Navigate to the lesson page
3. You should see the `WhiteboardTestPanel` in the top-right corner
4. Click "Initialize Session" to set up the session
5. Click "Test Webhook Call" to simulate a Vapi function call

### 3. Monitor the Flow

Watch the browser console for logs:
- `WhiteboardService: Generating prompts for subtopic: ...`
- `WhiteboardService: Generated prompts: ...`
- `WhiteboardService: Executing prompt: ...`

## Environment Setup

### 1. Add OpenAI API Key

Make sure your `.dev.vars` file has:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Deploy Worker (if needed)

```bash
npm run deploy
```

## Troubleshooting

### Common Issues:

1. **"No stream function provided"**
   - Make sure you're passing the stream function to `useWhiteboardWebhook`
   - Check that your `useTldrawAiExample` hook exports the stream function

2. **"Failed to generate prompts"**
   - Check that your OpenAI API key is set in `.dev.vars`
   - Verify the worker is running and accessible

3. **"Context not found"**
   - Ensure `WhiteboardProvider` wraps your app in `App.tsx`

4. **Prompts not executing**
   - Verify the stream function is working correctly
   - Check browser console for execution errors

### Debug Steps:

1. **Check Context State**: Use the test panel to see current state
2. **Verify API Calls**: Check network tab for `/generate-whiteboard-prompts` calls
3. **Monitor Logs**: Watch both browser and server console logs
4. **Test Isolation**: Use the test panel to isolate issues

## Next Development Steps

Once basic integration is working:

1. **Fine-tune Prompts**: Adjust the OpenAI system prompt for better results
2. **Optimize Timing**: Adjust delays between prompt executions
3. **Add Error Recovery**: Implement retry mechanisms for failed prompts
4. **Session Persistence**: Save session state across page reloads
5. **Analytics**: Track prompt success rates and execution times

## Production Considerations

Before going live:

1. **Remove Test Panel**: Don't include `WhiteboardTestPanel` in production
2. **Error Handling**: Ensure graceful degradation if AI fails
3. **Rate Limiting**: Implement rate limits for OpenAI API calls
4. **Monitoring**: Add proper logging and error tracking
5. **Performance**: Optimize for multiple concurrent sessions

The system is now ready for integration and testing! 🚀 