# 🌐 Ngrok Setup for Vapi Webhook Integration

This guide helps you expose your local webhook server to the internet so Vapi can call it.

## Quick Setup Steps

### 1. Install ngrok (if not already installed)
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
# Or install globally via npm
npm install -g ngrok
```

### 2. Start the webhook server
```bash
node webhook-dev-server.js
```
Keep this running in one terminal.

### 3. Start ngrok tunnel
```bash
./setup-ngrok.sh
```
Or manually:
```bash
ngrok http 5174
```

### 4. Copy the ngrok URL
After ngrok starts, you'll see output like:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:5174
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### 5. Update webhook configuration
Edit `client/config/webhookConfig.ts` and uncomment/update this line:
```typescript
// baseUrl = 'https://your-ngrok-url.ngrok-free.app'
```

Replace with your actual ngrok URL:
```typescript
baseUrl = 'https://abc123.ngrok-free.app'
```

### 6. Update Vapi assistant
In your Vapi dashboard, update your assistant's webhook URL to:
```
https://abc123.ngrok-free.app/api/whiteboard-update
```

## Testing the Setup

### Test webhook endpoint
```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/api/whiteboard-update \
  -H "Content-Type: application/json" \
  -d '{
    "subtopic": {
      "index": 1,
      "name": "Test",
      "summary": "Testing ngrok setup",
      "durationSec": 30,
      "whiteboardItems": [
        {"text": "Test Title", "type": "title"}
      ]
    },
    "lessonId": "test-123"
  }'
```

### Test SSE endpoint
Open in browser:
```
https://your-ngrok-url.ngrok-free.app/events/test-123
```

## Important Notes

- **Keep ngrok running**: The tunnel only works while ngrok is running
- **URL changes**: Free ngrok URLs change each time you restart ngrok
- **Update config**: Remember to update `webhookConfig.ts` when the URL changes
- **HTTPS required**: Vapi requires HTTPS webhooks, which ngrok provides automatically

## Troubleshooting

### ngrok not found
```bash
# Install ngrok first
brew install ngrok
# or
npm install -g ngrok
```

### Webhook server not running
```bash
# Start the webhook server first
node webhook-dev-server.js
```

### Connection refused
- Make sure webhook server is running on port 5174
- Check if ngrok tunnel is active
- Verify the ngrok URL is correct in config

### Vapi not calling webhook
- Ensure webhook URL in Vapi dashboard is the ngrok HTTPS URL
- Check Vapi function configuration includes the `update_whiteboard` tool
- Verify the function parameters match the expected schema

## Production Setup

For production, replace ngrok with:
- A proper domain with SSL certificate
- Cloud hosting (Vercel, Netlify, Railway, etc.)
- Update `webhookConfig.ts` with production URL 