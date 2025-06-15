// Test webhook functionality during development
import { getWebhookUrl, getHealthUrl } from '../config/webhookConfig'

interface TestSubtopicData {
  index: number
  name: string
  summary: string
  durationSec: number
  whiteboardItems: Array<{
    text: string
    type: 'title' | 'heading' | 'subheading' | 'definition' | 'bullet' | 'formula' | 'example' | 'note'
  }>
}

// Test webhook with sample data
export const testWebhookCall = async (
  webhookUrl: string = getWebhookUrl(),
  lessonId: string = 'test-lesson-123'
) => {
  const testSubtopic: TestSubtopicData = {
    index: 1,
    name: "Test Introduction",
    summary: "This is a test subtopic to verify webhook functionality. It includes sample whiteboard items to test the complete flow from Vapi to whiteboard updates.",
    durationSec: 45,
    whiteboardItems: [
      { 
        text: "Test Lesson: Webhook Integration", 
        type: "title" 
      },
      { 
        text: "Webhook: A mechanism that allows one application to send real-time data to another application when a specific event occurs.", 
        type: "definition" 
      },
      { 
        text: "Key Benefits: Real-time updates, automated responses, seamless integration", 
        type: "bullet" 
      },
      { 
        text: "Example: When Vapi starts a subtopic, it triggers a webhook to update the whiteboard", 
        type: "example" 
      }
    ]
  }

  console.log('Testing webhook with data:', testSubtopic)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        subtopic: testSubtopic,
        lessonId: lessonId
      })
    })
    
    const result = await response.json()
    
    console.log('Webhook test response status:', response.status)
    console.log('Webhook test result:', result)
    
    if (response.ok) {
      console.log('✅ Webhook test successful!')
      return { success: true, data: result }
    } else {
      console.error('❌ Webhook test failed:', result)
      return { success: false, error: result }
    }
    
  } catch (error) {
    console.error('❌ Webhook test error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Test with Vapi format
export const testVapiWebhookCall = async (
  webhookUrl: string = getWebhookUrl(),
  lessonId: string = 'test-lesson-123'
) => {
  const testSubtopic: TestSubtopicData = {
    index: 1,
    name: "Vapi Test Introduction",
    summary: "This is a test subtopic using Vapi format to verify webhook functionality with proper toolCallId handling.",
    durationSec: 45,
    whiteboardItems: [
      { 
        text: "Vapi Integration Test", 
        type: "title" 
      },
      { 
        text: "Testing Vapi webhook format with toolCallId response structure", 
        type: "definition" 
      }
    ]
  }

  // Simulate Vapi payload format
  const vapiPayload = {
    message: {
      toolCalls: [{
        id: "test-tool-call-" + Date.now(),
        function: {
          name: "update_whiteboard",
          arguments: {
            subtopic: testSubtopic,
            lessonId: lessonId
          }
        }
      }]
    }
  }

  console.log('Testing Vapi webhook with payload:', vapiPayload)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(vapiPayload)
    })
    
    const result: any = await response.json()
    
    console.log('Vapi webhook test response status:', response.status)
    console.log('Vapi webhook test result:', result)
    
    // Validate Vapi response format
    if (response.ok && result.results && Array.isArray(result.results)) {
      const firstResult = result.results[0]
      if (firstResult.toolCallId && firstResult.result) {
        console.log('✅ Vapi webhook test successful!')
        console.log('📋 Tool Call ID:', firstResult.toolCallId)
        console.log('📝 Result:', firstResult.result)
        return { success: true, data: result }
      } else {
        console.error('❌ Invalid Vapi response format:', result)
        return { success: false, error: 'Invalid response format' }
      }
    } else {
      console.error('❌ Vapi webhook test failed:', result)
      return { success: false, error: result }
    }
    
  } catch (error) {
    console.error('❌ Vapi webhook test error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Test with multiple subtopics
export const testMultipleWebhookCalls = async (webhookUrl: string = getWebhookUrl()) => {
  const testSubtopics: TestSubtopicData[] = [
    {
      index: 1,
      name: "Introduction",
      summary: "Introduction to the topic with overview and objectives",
      durationSec: 45,
      whiteboardItems: [
        { text: "Course Introduction", type: "title" },
        { text: "Learning Objectives: Understand key concepts and applications", type: "bullet" }
      ]
    },
    {
      index: 2,
      name: "Basic Concepts",
      summary: "Fundamental concepts and definitions",
      durationSec: 60,
      whiteboardItems: [
        { text: "Basic Concepts", type: "heading" },
        { text: "Definition: Core principle of the subject matter", type: "definition" },
        { text: "Key Point 1: First important concept", type: "bullet" },
        { text: "Key Point 2: Second important concept", type: "bullet" }
      ]
    },
    {
      index: 3,
      name: "Advanced Topics",
      summary: "Advanced applications and complex scenarios",
      durationSec: 90,
      whiteboardItems: [
        { text: "Advanced Applications", type: "heading" },
        { text: "Formula: E = mc²", type: "formula" },
        { text: "Real-world Example: Application in modern technology", type: "example" }
      ]
    }
  ]

  console.log('Testing multiple webhook calls...')
  const results = []

  for (const subtopic of testSubtopics) {
    console.log(`Testing subtopic ${subtopic.index}: ${subtopic.name}`)
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ subtopic })
      })
      
      const result = await response.json()
      results.push({ subtopic: subtopic.name, success: response.ok, result })
      
      // Wait between calls to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      results.push({ 
        subtopic: subtopic.name, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  console.log('Multiple webhook test results:', results)
  return results
}

// Validate webhook response structure
export const validateWebhookResponse = (response: any): boolean => {
  const requiredFields = ['success', 'message']
  const hasRequiredFields = requiredFields.every(field => field in response)
  
  if (!hasRequiredFields) {
    console.error('Invalid webhook response: missing required fields', { response, requiredFields })
    return false
  }

  if (response.success) {
    const successFields = ['subtopicIndex', 'subtopicName', 'itemsProcessed']
    const hasSuccessFields = successFields.every(field => field in response)
    
    if (!hasSuccessFields) {
      console.error('Invalid success response: missing success fields', { response, successFields })
      return false
    }
  }

  return true
}

// Create test button component for easy testing
export const createWebhookTestButton = (
  onTest: () => Promise<void>,
  isLoading: boolean = false,
  className: string = "bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
) => {
  return {
    onClick: onTest,
    disabled: isLoading,
    className,
    children: isLoading ? 'Testing...' : 'Test Webhook'
  }
}

// Helper to check if webhook server is running
export const checkWebhookServerHealth = async (healthUrl: string = getHealthUrl()) => {
  try {
    const response = await fetch(healthUrl)
    const result = await response.json()
    
    console.log('Webhook server health check:', result)
    return { healthy: response.ok, data: result }
    
  } catch (error) {
    console.error('Webhook server health check failed:', error)
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 