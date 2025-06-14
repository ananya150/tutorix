#!/bin/bash

# Setup script for exposing webhook server via ngrok
# This allows Vapi to call the webhook from the internet

echo "🚀 Setting up ngrok for webhook server..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first:"
    echo "   - Visit: https://ngrok.com/download"
    echo "   - Or use: brew install ngrok (on macOS)"
    echo "   - Or use: npm install -g ngrok"
    exit 1
fi

# Check if webhook server is running
echo "🔍 Checking if webhook server is running on port 5174..."
if ! curl -s http://localhost:5174/health > /dev/null; then
    echo "❌ Webhook server is not running on port 5174"
    echo "   Please start it first with: node webhook-dev-server.js"
    exit 1
fi

echo "✅ Webhook server is running"

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel on port 5174..."
echo "   This will expose your local webhook server to the internet"
echo "   Keep this terminal open while testing with Vapi"
echo ""
echo "📋 After ngrok starts:"
echo "   1. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)"
echo "   2. Update client/config/webhookConfig.ts with the ngrok URL"
echo "   3. Update your Vapi assistant's webhook URL"
echo ""
echo "🔗 Starting ngrok..."

# Start ngrok with HTTP tunnel on port 5174
ngrok http 5174 