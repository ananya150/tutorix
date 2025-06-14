import { useEffect, useRef, useState } from 'react'
import { getSSEUrl } from '../config/webhookConfig'
import { CustomEventSource } from '../utils/customEventSource'

interface SSEEvent {
  type: string
  data: any
  timestamp: string
}

interface SSEConnectionState {
  connected: boolean
  error: string | null
  lastEvent: SSEEvent | null
  connectionCount: number
}

export const useSSEConnection = (lessonId: string, onEvent?: (event: SSEEvent) => void) => {
  const [state, setState] = useState<SSEConnectionState>({
    connected: false,
    error: null,
    lastEvent: null,
    connectionCount: 0
  })
  
  const eventSourceRef = useRef<CustomEventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!lessonId) {
      console.error('SSE: Cannot connect without lessonId')
      return
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const sseUrl = getSSEUrl(lessonId)
    console.log(`📡 SSE: Connecting to ${sseUrl}`)

    try {
      const eventSource = new CustomEventSource(sseUrl)
      eventSourceRef.current = eventSource

      // Connection opened
      eventSource.addEventListener('open', () => {
        console.log('📡 SSE: Connection opened for lesson:', lessonId)
        setState(prev => ({
          ...prev,
          connected: true,
          error: null,
          connectionCount: prev.connectionCount + 1
        }))
        reconnectAttempts.current = 0
      })

      // Handle 'connected' event
      eventSource.addEventListener('connected', (event) => {
        const customEvent = event as CustomEvent
        const data = JSON.parse(customEvent.detail.data)
        console.log('📡 SSE: Connected event received:', data)
        
        const sseEvent: SSEEvent = {
          type: 'connected',
          data,
          timestamp: data.timestamp
        }
        
        setState(prev => ({ ...prev, lastEvent: sseEvent }))
        onEvent?.(sseEvent)
      })

      // Handle 'whiteboard-update' event
      eventSource.addEventListener('whiteboard-update', (event) => {
        const customEvent = event as CustomEvent
        const data = JSON.parse(customEvent.detail.data)
        console.log('📡 SSE: Whiteboard update received:', data)
        
        const sseEvent: SSEEvent = {
          type: 'whiteboard-update',
          data,
          timestamp: data.timestamp
        }
        
        setState(prev => ({ ...prev, lastEvent: sseEvent }))
        onEvent?.(sseEvent)
      })

      // Handle 'heartbeat' event
      eventSource.addEventListener('heartbeat', (event) => {
        const customEvent = event as CustomEvent
        const data = JSON.parse(customEvent.detail.data)
        console.log('📡 SSE: Heartbeat received:', data.timestamp)
        
        const sseEvent: SSEEvent = {
          type: 'heartbeat',
          data,
          timestamp: data.timestamp
        }
        
        setState(prev => ({ ...prev, lastEvent: sseEvent }))
      })

      // Handle errors
      eventSource.addEventListener('error', (error) => {
        console.error('📡 SSE: Connection error:', error)
        
        setState(prev => ({
          ...prev,
          connected: false,
          error: 'Connection error'
        }))

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          
          console.log(`📡 SSE: Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          console.error('📡 SSE: Max reconnection attempts reached')
          setState(prev => ({
            ...prev,
            error: 'Max reconnection attempts reached'
          }))
        }
      })

    } catch (error) {
      console.error('📡 SSE: Failed to create EventSource:', error)
      setState(prev => ({
        ...prev,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  const disconnect = () => {
    console.log('📡 SSE: Disconnecting from lesson:', lessonId)
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    setState(prev => ({
      ...prev,
      connected: false,
      error: null
    }))
  }

  // Auto-connect when lessonId changes
  useEffect(() => {
    if (lessonId) {
      connect()
    }

    // Cleanup on unmount or lessonId change
    return () => {
      disconnect()
    }
  }, [lessonId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    state,
    connect,
    disconnect,
    isConnected: state.connected,
    error: state.error,
    lastEvent: state.lastEvent
  }
} 