# Tutorix Quickstart Guide

Get Tutorix up and running in 10 minutes! This guide covers the essential steps to start developing with the AI tutoring platform.

## Prerequisites

- Node.js 18+
- pnpm package manager
- Git
- OpenAI API key
- Supabase account
- Vapi account
- ngrok installed

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd tutorix

# Install dependencies
pnpm install
```

## Step 2: Environment Configuration

### Create .dev.vars file
Create `.dev.vars` in the project root:

```env
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Create .env.local file
Create `.env.local` in the project root:

```env
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-vapi-assistant-id
```

## Step 3: Set Up Webhook Server

### Start the webhook server
```bash
node webhook-dev-server.js
```
*Keep this terminal running*

### Expose with ngrok (new terminal)
```bash
./setup-ngrok.sh
```

### Copy the forwarded URL
You'll see output like:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:5174
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### Update webhook configuration
```bash
node update-webhook-url.js https://abc123.ngrok-free.app
```

## Step 4: Configure External Services

### Supabase Setup
1. Follow the detailed [Supabase Setup Guide](./supabase_setup.md)
2. Create your database and get API keys
3. Update your `.dev.vars` with the correct values

### Vapi Setup
1. Follow the detailed [Vapi Setup Guide](./vapi_setup.md)
2. Create the `update_whiteboard` tool
3. Set the tool's Server URL to: `https://your-ngrok-url.ngrok-free.app/api/whiteboard-update`
4. Create your AI assistant
5. Update your `.env.local` with the correct values

## Step 5: Start the Application

```bash
pnpm dev
```

Your application will be available at: `http://localhost:5173`

## Quick Test

1. **Open the app** at `http://localhost:5173`
2. **Enter a topic** (e.g., "photosynthesis")
3. **Select duration** (3, 5, or 10 minutes)
4. **Click "Start Course"**
5. **Navigate to lesson page** 
6. **Start voice call** using the Vapi widget
7. **Watch the magic happen!** The AI will teach and update the whiteboard

## Development Workflow

### Terminal Setup
You'll need **3 terminals** running simultaneously:

**Terminal 1: Main Application**
```bash
pnpm dev
```

**Terminal 2: Webhook Server**
```bash
node webhook-dev-server.js
```

**Terminal 3: ngrok Tunnel**
```bash
./setup-ngrok.sh
```

### When ngrok URL Changes
If you restart ngrok, you'll get a new URL. Update it with:

```bash
# Copy the new ngrok URL
node update-webhook-url.js https://new-ngrok-url.ngrok-free.app

# Update your Vapi tool configuration manually in the dashboard
```

## Troubleshooting

### Common Issues

**🚫 "Tool not found" error**
- Check that your Vapi assistant has the `update_whiteboard` tool added
- Verify the tool's Server URL matches your ngrok URL

**🚫 Whiteboard not updating**
- Check webhook server console for incoming requests
- Verify SSE connection in browser console
- Ensure lesson ID is being passed correctly

**🚫 Voice AI not working**
- Check microphone permissions
- Verify Vapi keys in `.env.local`
- Ensure assistant ID is correct

**🚫 Database errors**
- Verify Supabase keys in `.dev.vars`
- Check that the `lessons` table exists
- Ensure database policies allow operations

### Debug Commands

**Check webhook server status:**
```bash
curl http://localhost:5174/health
```

**Test API endpoints:**
```bash
curl -X POST http://localhost:8787/generate-lesson \
  -H "Content-Type: application/json" \
  -d '{"topic":"test","depth":"5","lessonId":"test-123"}'
```

**View logs:**
- Webhook server: Check Terminal 2
- ngrok traffic: Visit `http://localhost:4040`
- Browser console: F12 → Console tab

## File Structure Overview

```
tutorix/
├── client/              # Frontend React app
│   ├── pages/          # Main pages (Home, Lesson, Test)
│   ├── components/     # UI components
│   ├── hooks/          # Custom React hooks
│   └── services/       # API services
├── worker/             # Cloudflare Workers backend
│   └── routes/         # API endpoints
├── docs/               # Documentation
├── .dev.vars           # Backend environment variables
├── .env.local          # Frontend environment variables
└── webhook-dev-server.js # Development webhook server
```

## Next Steps

Once you have the basic setup working:

1. **Explore the code** - Check out the component structure
2. **Customize prompts** - Modify AI behavior in the system prompts
3. **Add features** - Extend the whiteboard functionality
4. **Deploy** - Follow deployment guides for production

## Need Help?

- **Detailed Setup**: Check the comprehensive setup guides in `/docs`
- **Technical Details**: See the technical documentation
- **Issues**: Check the troubleshooting sections in individual guides

---

🚀 **You're ready to start building with Tutorix!**

*This quickstart gets you up and running fast. For detailed configuration and advanced features, check out the individual setup guides.* 