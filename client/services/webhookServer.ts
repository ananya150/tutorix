// Development webhook server for handling Vapi function calls
// This runs separately from the Vite dev server to handle webhook endpoints

interface WebhookHandler {
  path: string
  handler: (request: Request) => Promise<Response>
}

class WebhookServer {
  private handlers: Map<string, WebhookHandler> = new Map()
  private server: any = null
  private port: number

  constructor(port: number = 5174) {
    this.port = port
  }

  registerHandler(path: string, handler: (request: Request) => Promise<Response>) {
    console.log(`Registering webhook handler for: ${path}`)
    this.handlers.set(path, { path, handler })
  }

  unregisterHandler(path: string) {
    console.log(`Unregistering webhook handler for: ${path}`)
    this.handlers.delete(path)
  }

  async start() {
    // For browser environment, we'll use a different approach
    if (typeof window !== 'undefined') {
      console.log('Webhook server: Browser environment detected')
      this.setupBrowserWebhookHandler()
      return
    }

    // For Node.js environment (if needed for testing)
    try {
      const express = await import('express')
      const cors = await import('cors')
      
      const app = express.default()
      app.use(cors.default())
      app.use(express.json())

      // Health check endpoint
      app.get('/health', (req: any, res: any) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() })
      })

      // Dynamic webhook handler
      app.all('*', async (req: any, res: any) => {
        const path = req.path
        const handler = this.handlers.get(path)

        if (!handler) {
          return res.status(404).json({ 
            error: 'Webhook handler not found',
            path,
            availableHandlers: Array.from(this.handlers.keys())
          })
        }

        try {
          // Convert Express request to Fetch API Request
          const request = new Request(`http://localhost:${this.port}${path}`, {
            method: req.method,
            headers: req.headers as any,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
          })

          const response = await handler.handler(request)
          const result = await response.json()
          
          res.status(response.status).json(result)
        } catch (error) {
          console.error('Webhook handler error:', error)
          res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      this.server = app.listen(this.port, () => {
        console.log(`🚀 Webhook server running on http://localhost:${this.port}`)
        console.log(`📋 Registered handlers:`, Array.from(this.handlers.keys()))
      })

    } catch (error) {
      console.error('Failed to start webhook server:', error)
      console.log('Note: Install express and cors for Node.js webhook server')
    }
  }

  private setupBrowserWebhookHandler() {
    // In browser environment, we'll use a different approach
    // This could be integrated with your existing Vite dev server
    console.log('Setting up browser-based webhook handling')
    
    // Store handlers globally for access from other parts of the app
    if (typeof window !== 'undefined') {
      (window as any).__webhookHandlers = this.handlers
    }
  }

  stop() {
    if (this.server) {
      this.server.close()
      console.log('Webhook server stopped')
    }
  }
}

// Global webhook server instance
let webhookServerInstance: WebhookServer | null = null

export const getWebhookServer = (port?: number): WebhookServer => {
  if (!webhookServerInstance) {
    webhookServerInstance = new WebhookServer(port)
  }
  return webhookServerInstance
}

export const registerWebhookHandler = (path: string, handler: (request: Request) => Promise<Response>) => {
  const server = getWebhookServer()
  server.registerHandler(path, handler)
}

export const unregisterWebhookHandler = (path: string) => {
  const server = getWebhookServer()
  server.unregisterHandler(path)
}

export const startWebhookServer = async (port?: number) => {
  const server = getWebhookServer(port)
  await server.start()
  return server
}

// Browser-based webhook handler for development
export const handleWebhookInBrowser = async (path: string, request: Request): Promise<Response> => {
  if (typeof window === 'undefined') {
    throw new Error('Browser webhook handler can only be used in browser environment')
  }

  const handlers = (window as any).__webhookHandlers as Map<string, WebhookHandler>
  
  if (!handlers) {
    throw new Error('No webhook handlers registered')
  }

  const handler = handlers.get(path)
  
  if (!handler) {
    throw new Error(`No handler found for path: ${path}`)
  }

  return await handler.handler(request)
} 