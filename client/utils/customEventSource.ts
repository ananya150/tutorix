// Custom EventSource implementation that supports headers
// This is needed to bypass ngrok's browser warning page

interface CustomEventSourceOptions {
  headers?: Record<string, string>
  withCredentials?: boolean
}

interface SSEEvent {
  type: string
  data: string
  id?: string
  retry?: number
}

export class CustomEventSource extends EventTarget {
  private url: string
  private options: CustomEventSourceOptions
  private abortController: AbortController | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  
  public readyState: number = 0 // 0: CONNECTING, 1: OPEN, 2: CLOSED
  public url_: string
  
  // EventSource constants
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2
  
  constructor(url: string, options: CustomEventSourceOptions = {}) {
    super()
    this.url = url
    this.url_ = url
    this.options = options
    this.connect()
  }
  
  private async connect() {
    if (this.abortController) {
      this.abortController.abort()
    }
    
    this.abortController = new AbortController()
    this.readyState = CustomEventSource.CONNECTING
    
    try {
      console.log('🔗 CustomEventSource: Connecting to', this.url)
      
      const headers: Record<string, string> = {
        ...this.options.headers
      }
      
      // Add ngrok bypass header if URL contains ngrok
      if (this.url.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'any'
      }
      
      const response = await fetch(this.url, {
        method: 'GET',
        headers,
        signal: this.abortController.signal,
        credentials: this.options.withCredentials ? 'include' : 'same-origin'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      if (!response.body) {
        throw new Error('Response body is null')
      }
      
      this.readyState = CustomEventSource.OPEN
      this.reconnectAttempts = 0
      
      // Dispatch open event
      this.dispatchEvent(new Event('open'))
      
      // Process the stream
      await this.processStream(response.body)
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🔗 CustomEventSource: Connection aborted')
        return
      }
      
      console.error('🔗 CustomEventSource: Connection error:', error)
      this.readyState = CustomEventSource.CLOSED
      
      // Dispatch error event
      this.dispatchEvent(new Event('error'))
      
      // Attempt reconnection
      this.scheduleReconnect()
    }
  }
  
  private async processStream(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('🔗 CustomEventSource: Stream ended')
          break
        }
        
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer
        
        let eventData: Partial<SSEEvent> = {}
        
        for (const line of lines) {
          if (line.trim() === '') {
            // Empty line indicates end of event
            if (eventData.type && eventData.data !== undefined) {
              this.dispatchSSEEvent(eventData as SSEEvent)
            }
            eventData = {}
          } else if (line.startsWith('event:')) {
            eventData.type = line.substring(6).trim()
          } else if (line.startsWith('data:')) {
            const data = line.substring(5).trim()
            eventData.data = eventData.data ? eventData.data + '\n' + data : data
          } else if (line.startsWith('id:')) {
            eventData.id = line.substring(3).trim()
          } else if (line.startsWith('retry:')) {
            eventData.retry = parseInt(line.substring(6).trim(), 10)
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('🔗 CustomEventSource: Stream processing error:', error)
      throw error
    } finally {
      reader.releaseLock()
    }
  }
  
  private dispatchSSEEvent(event: SSEEvent) {
    console.log('🔗 CustomEventSource: Received event:', event.type, event.data)
    
    // Create custom event
    const customEvent = new CustomEvent(event.type || 'message', {
      detail: { data: event.data, id: event.id }
    })
    
    // Also create a MessageEvent-like object for compatibility
    const messageEvent = new MessageEvent('message', {
      data: event.data,
      lastEventId: event.id || '',
      origin: new URL(this.url).origin
    })
    
    // Dispatch both the named event and generic message event
    this.dispatchEvent(customEvent)
    if (event.type !== 'message') {
      this.dispatchEvent(messageEvent)
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔗 CustomEventSource: Max reconnection attempts reached')
      this.readyState = CustomEventSource.CLOSED
      return
    }
    
    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)
    
    console.log(`🔗 CustomEventSource: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }
  
  public close() {
    console.log('🔗 CustomEventSource: Closing connection')
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    
    this.readyState = CustomEventSource.CLOSED
  }
  
  // EventSource-compatible methods
  public override addEventListener(type: string, listener: EventListener) {
    super.addEventListener(type, listener)
  }
  
  public override removeEventListener(type: string, listener: EventListener) {
    super.removeEventListener(type, listener)
  }
} 