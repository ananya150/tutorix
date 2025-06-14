// Test utility for CustomEventSource
import { CustomEventSource } from './customEventSource'
import { getSSEUrl } from '../config/webhookConfig'

export const testCustomEventSource = (lessonId: string = 'test-123') => {
  console.log('🧪 Testing CustomEventSource...')
  
  const sseUrl = getSSEUrl(lessonId)
  console.log('🔗 Connecting to:', sseUrl)
  
  const eventSource = new CustomEventSource(sseUrl)
  
  // Test connection
  eventSource.addEventListener('open', () => {
    console.log('✅ CustomEventSource: Connection opened!')
  })
  
  eventSource.addEventListener('error', (error) => {
    console.error('❌ CustomEventSource: Connection error:', error)
  })
  
  // Test events
  eventSource.addEventListener('connected', (event) => {
    const customEvent = event as CustomEvent
    const data = JSON.parse(customEvent.detail.data)
    console.log('📡 CustomEventSource: Connected event:', data)
  })
  
  eventSource.addEventListener('heartbeat', (event) => {
    const customEvent = event as CustomEvent
    const data = JSON.parse(customEvent.detail.data)
    console.log('💓 CustomEventSource: Heartbeat:', data.timestamp)
  })
  
  eventSource.addEventListener('whiteboard-update', (event) => {
    const customEvent = event as CustomEvent
    const data = JSON.parse(customEvent.detail.data)
    console.log('📝 CustomEventSource: Whiteboard update:', data)
  })
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up CustomEventSource test')
    eventSource.close()
  }
}

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testCustomEventSource = testCustomEventSource
} 