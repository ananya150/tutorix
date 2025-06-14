// Simple development webhook server for Vapi integration
// Run this with: node webhook-dev-server.js

import http from 'http';
import url from 'url';

const PORT = 5174;

// Simple CORS headers (including ngrok bypass and all necessary headers)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning, Cache-Control, Accept',
  'Access-Control-Max-Age': '86400',
  'ngrok-skip-browser-warning': 'true'
};

// Store SSE connections by lessonId
const sseConnections = new Map(); // lessonId -> Set of response objects

// Add SSE connection for a specific lesson
function addSSEConnection(lessonId, res) {
  if (!sseConnections.has(lessonId)) {
    sseConnections.set(lessonId, new Set());
  }
  sseConnections.get(lessonId).add(res);
  console.log(`📡 SSE client connected for lesson: ${lessonId} (total: ${sseConnections.get(lessonId).size})`);
}

// Remove SSE connection
function removeSSEConnection(lessonId, res) {
  if (sseConnections.has(lessonId)) {
    sseConnections.get(lessonId).delete(res);
    if (sseConnections.get(lessonId).size === 0) {
      sseConnections.delete(lessonId);
    }
    console.log(`📡 SSE client disconnected from lesson: ${lessonId}`);
  }
}

// Send SSE event to all clients of a specific lesson
function sendSSEEvent(lessonId, eventType, data) {
  if (!sseConnections.has(lessonId)) {
    console.log(`📡 No SSE clients for lesson: ${lessonId}`);
    return;
  }

  const connections = sseConnections.get(lessonId);
  const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  
  console.log(`📡 Sending SSE event to ${connections.size} clients for lesson: ${lessonId}`);
  console.log(`📡 Event type: ${eventType}`);
  
  // Send to all connected clients for this lesson
  connections.forEach(res => {
    try {
      res.write(eventData);
    } catch (error) {
      console.error('📡 Error sending SSE event:', error);
      connections.delete(res);
    }
  });
}

// Simple JSON response helper
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...corsHeaders
  });
  res.end(JSON.stringify(data));
}

// Handle webhook requests
function handleWebhookRequest(req, res, body) {
  console.log('\n🔔 Webhook received:');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  // Use constant toolCallId as requested
  const toolCallId = 'e00c5f96-2ec4-4576-8f04-93498df8d5d8';
  
  if (body) {
    console.log('Body:', body);
    
    try {
      const payload = JSON.parse(body);
      console.log('Parsed payload:', JSON.stringify(payload, null, 2));
      
      console.log('🔧 Using constant Tool Call ID:', toolCallId);
      
      // Extract function arguments (Vapi format)
      const functionArgs = payload.message?.toolCalls?.[0]?.function?.arguments;
      let subtopic, lessonId;
      
      if (functionArgs) {
        // Parse function arguments if they're a string
        const args = typeof functionArgs === 'string' ? JSON.parse(functionArgs) : functionArgs;
        subtopic = args.subtopic;
        lessonId = args.lessonId;
        console.log('📋 Function arguments:', args);
        
        // Normalize field names from Vapi's snake_case to camelCase
        if (subtopic) {
          // Convert duration_sec to durationSec
          if (subtopic.duration_sec !== undefined) {
            subtopic.durationSec = subtopic.duration_sec;
            delete subtopic.duration_sec;
          }
          
          // Convert whiteboard_items to whiteboardItems
          if (subtopic.whiteboard_items !== undefined) {
            subtopic.whiteboardItems = subtopic.whiteboard_items;
            delete subtopic.whiteboard_items;
          }
          
          console.log('📋 Normalized subtopic:', subtopic);
        }
      } else {
        // Fallback to direct payload format (for testing)
        subtopic = payload.subtopic;
        lessonId = payload.lessonId;
      }
      
      // Validate required data
      if (!subtopic) {
        console.error('❌ Invalid payload: missing subtopic');
        return sendJSON(res, 400, {
          results: [{
            toolCallId: toolCallId,
            error: 'Invalid payload: missing subtopic data'
          }]
        });
      }
      
      console.log(`📝 Processing subtopic ${subtopic.index}: ${subtopic.name}`);
      console.log(`📋 Whiteboard items: ${subtopic.whiteboardItems?.length || 0}`);
      console.log(`📚 Lesson ID: ${lessonId || 'not provided'}`);
      
      // Send SSE event to clients if lessonId is provided
      if (lessonId) {
        sendSSEEvent(lessonId, 'whiteboard-update', {
          subtopic,
          lessonId,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('⚠️ No lessonId provided, skipping SSE broadcast');
      }
      
      // Simulate processing
      setTimeout(() => {
        console.log('✅ Webhook processing completed');
      }, 500);
      
      // Create success message
      const resultMessage = `Whiteboard update initiated for "${subtopic.name}" with ${subtopic.whiteboardItems?.length || 0} items. ${lessonId ? `Lesson ${lessonId} updated via SSE.` : 'No SSE update sent.'}`;
      
      // Send Vapi-formatted success response
      sendJSON(res, 200, {
        results: [{
          toolCallId: toolCallId,
          result: resultMessage
        }]
      });
      
    } catch (error) {
      console.error('❌ JSON parse error:', error.message);
      
      sendJSON(res, 400, {
        results: [{
          toolCallId: toolCallId,
          error: `Invalid JSON payload: ${error.message}`
        }]
      });
    }
  } else {
    console.error('❌ No body received');
    sendJSON(res, 400, {
      results: [{
        toolCallId: toolCallId,
        error: 'No request body received'
      }]
    });
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  console.log(`\n📡 ${req.method} ${path}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (path === '/health') {
    sendJSON(res, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      activeConnections: Array.from(sseConnections.keys()).map(lessonId => ({
        lessonId,
        connections: sseConnections.get(lessonId).size
      }))
    });
    return;
  }

  // SSE endpoint for specific lesson
  if (path.startsWith('/events/')) {
    const lessonId = path.split('/events/')[1];
    
    if (!lessonId) {
      sendJSON(res, 400, {
        error: 'Lesson ID required',
        usage: '/events/{lessonId}'
      });
      return;
    }

    console.log(`📡 Setting up SSE connection for lesson: ${lessonId}`);

    // Set SSE headers (including ngrok bypass)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'ngrok-skip-browser-warning': 'true',
      ...corsHeaders
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({
      lessonId,
      message: 'SSE connection established',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Add this connection to the lesson's connection set
    addSSEConnection(lessonId, res);

    // Handle client disconnect
    req.on('close', () => {
      removeSSEConnection(lessonId, res);
    });

    req.on('error', (error) => {
      console.error('📡 SSE connection error:', error);
      removeSSEConnection(lessonId, res);
    });

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
      try {
        res.write(`event: heartbeat\ndata: ${JSON.stringify({
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        console.error('📡 Heartbeat error:', error);
        clearInterval(heartbeat);
        removeSSEConnection(lessonId, res);
      }
    }, 30000); // Every 30 seconds

    // Clean up heartbeat on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
    });

    return;
  }
  
  // Webhook endpoint
  if (path === '/api/whiteboard-update') {
    if (req.method !== 'POST') {
      sendJSON(res, 405, {
        results: [{
          toolCallId: 'e00c5f96-2ec4-4576-8f04-93498df8d5d8',
          error: 'Method not allowed - use POST'
        }]
      });
      return;
    }
    
    // Collect request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      handleWebhookRequest(req, res, body);
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      sendJSON(res, 500, {
        results: [{
          toolCallId: 'e00c5f96-2ec4-4576-8f04-93498df8d5d8',
          error: `Request processing error: ${error.message}`
        }]
      });
    });
    
    return;
  }
  
  // 404 for other paths
  sendJSON(res, 404, {
    error: 'Not found',
    path,
    availableEndpoints: ['/health', '/api/whiteboard-update']
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Webhook development server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/whiteboard-update`);
  console.log(`   GET  http://localhost:${PORT}/events/{lessonId} (SSE)`);
  console.log(`\n🔧 For Vapi configuration, use:`);
  console.log(`   Webhook URL: http://localhost:${PORT}/api/whiteboard-update`);
  console.log(`\n📡 For client SSE connection, use:`);
  console.log(`   SSE URL: http://localhost:${PORT}/events/{lessonId}`);
  console.log(`\n📝 Waiting for webhook calls and SSE connections...`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop other services or change the port.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down webhook server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 