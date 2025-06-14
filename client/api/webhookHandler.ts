interface SubtopicData {
  index: number
  name: string
  summary: string
  durationSec: number
  whiteboardItems: Array<{
    text: string
    type: string
  }>
}

interface WebhookPayload {
  subtopic: SubtopicData
}

export const createWebhookHandler = (onWebhookCall: (data: SubtopicData) => Promise<void>) => {
  return async (request: Request): Promise<Response> => {
    console.log('Webhook handler called with method:', request.method)
    
    if (request.method !== 'POST') {
      console.log('Method not allowed:', request.method)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const payload: WebhookPayload = await request.json()
      console.log('Webhook received payload:', payload)
      
      // Validate payload structure
      if (!payload.subtopic) {
        console.error('Invalid payload: missing subtopic')
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid payload: missing subtopic' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const { subtopic } = payload
      
      // Validate subtopic structure
      if (!subtopic.index || !subtopic.name || !subtopic.whiteboardItems) {
        console.error('Invalid subtopic structure:', subtopic)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid subtopic structure' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      console.log(`Processing subtopic ${subtopic.index}: ${subtopic.name}`)
      console.log(`Whiteboard items count: ${subtopic.whiteboardItems.length}`)
      
      // Trigger the whiteboard update
      await onWebhookCall(subtopic)
      
      console.log('Webhook processing completed successfully')
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Whiteboard update initiated',
        subtopicIndex: subtopic.index,
        subtopicName: subtopic.name,
        itemsProcessed: subtopic.whiteboardItems.length
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
      
    } catch (error) {
      console.error('Webhook processing error:', error)
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
}

// Handle CORS preflight requests
export const handleCorsOptions = (): Response => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
} 