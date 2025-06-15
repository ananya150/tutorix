import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DefaultSpinner, Editor, Tldraw } from 'tldraw'
import { useTldrawAiExample, useTldrawAiExampleWithCameraControl } from '../useTldrawAiExample'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Vapi from '@vapi-ai/web'
import { VapiWidget } from '../components/vapi-widget'
import { useSSEConnection } from '../hooks/useSSEConnection'
import { useWhiteboardWebhook } from '../hooks/useWhiteboardWebhook'
import { type SubtopicData } from '../contexts/WhiteboardContext'
import React from 'react'

interface LessonData {
  id: string
  lessonId: string
  topic: string
  depth: string
  lessonPlan: any
  createdAt: string
  updatedAt: string
}

interface GetLessonResponse {
  success: boolean
  lesson?: LessonData
  error?: string
}

// Inner component that has access to the editor context
function LessonPageContent({ 
  editor, 
  lessonId, 
  lessonData 
}: { 
  editor: Editor | null
  lessonId: string
  lessonData: LessonData
}) {
  const navigate = useNavigate()
  const [sessionInitialized, setSessionInitialized] = useState(false)
  
  // Create both camera-enabled and camera-disabled AI instances
  const tldrawAiWithCamera = editor ? useTldrawAiExampleWithCameraControl(editor, true) : null
  const tldrawAiWithoutCamera = editor ? useTldrawAiExampleWithCameraControl(editor, false) : null
  
  // Create concatenated streaming function that uses the actual /stream endpoint
  const concatenatedStreamFunction = React.useCallback(async (concatenatedPrompt: string, repositionCamera: boolean) => {
    console.log('🎯 LessonPage ConcatenatedStreamFunction: Executing concatenated prompt with REAL STREAMING:', {
      length: concatenatedPrompt.length,
      repositionCamera,
      preview: concatenatedPrompt.substring(0, 200) + '...'
    })
    
    if (!editor) {
      console.error('❌ LessonPage ConcatenatedStreamFunction: No editor available')
      throw new Error('No editor available for prompt execution')
    }
    
    if (!tldrawAiWithCamera) {
      console.error('❌ LessonPage ConcatenatedStreamFunction: No tldraw AI available')
      throw new Error('No tldraw AI available for prompt execution')
    }
    
    try {
      console.log('📝 LessonPage ConcatenatedStreamFunction: Calling tldraw AI with STREAMING enabled...')
      console.log('🌊 Using /stream endpoint for real-time response processing')
      
      // Use the stream: true parameter to enable actual streaming via /stream endpoint
      const { promise, cancel } = tldrawAiWithCamera.prompt({ 
        message: concatenatedPrompt,
        stream: true  // 🔥 This enables actual streaming!
      })
      
      // Store cancel function for potential future use
      console.log('📡 LessonPage: Streaming started, waiting for real-time responses...')
      
      // Wait for the streaming to complete
      await promise
      
      console.log('✅ LessonPage ConcatenatedStreamFunction: STREAMING completed successfully', {
        repositionCamera,
        endpoint: '/stream'
      })
    } catch (error) {
      console.error('❌ LessonPage ConcatenatedStreamFunction: Error during streaming:', error)
      throw error
    }
  }, [editor, tldrawAiWithCamera])
  
  // Get the whiteboard webhook functionality with concatenated streaming
  const webhook = useWhiteboardWebhook()
  
  // Initialize session when component mounts
  React.useEffect(() => {
    if (!sessionInitialized && lessonId) {
      console.log('🔧 LessonPage: Initializing whiteboard session...')
      webhook.initializeSession(
        `lesson-session-${lessonId}`,
        lessonId,
        10 // Default max subtopics, will be updated as needed
      )
      console.log('✅ LessonPage: Whiteboard session initialized for lesson:', lessonId)
      setSessionInitialized(true)
    }
  }, [webhook, sessionInitialized, lessonId])

  // Set up SSE connection for this specific lesson with AI integration
  const { state: sseState, isConnected, error: sseError } = useSSEConnection(
    lessonId, 
    async (event) => {
      console.log('📡 LessonPage SSE Event received:', event)
      
      try {
        // Handle whiteboard-update events with AI prompt generation
        if (event.type === 'whiteboard-update') {
          console.log('🎯 LessonPage: Processing whiteboard update with CONCATENATED STREAMING:', event.data)
          
          // Extract subtopic data and trigger AI-powered webhook processing
          const { subtopic } = event.data
          if (subtopic) {
            // Validate subtopic data before processing
            if (subtopic.index && subtopic.name) {
              // Ensure whiteboardItems exists and is an array
              if (!subtopic.whiteboardItems || !Array.isArray(subtopic.whiteboardItems)) {
                console.warn('⚠️ LessonPage: Missing or invalid whiteboardItems, using empty array')
                subtopic.whiteboardItems = []
              }
              
              // Ensure durationSec exists
              if (!subtopic.durationSec) {
                console.warn('⚠️ LessonPage: Missing durationSec, using default value')
                subtopic.durationSec = 30
              }
              
              // Ensure summary exists
              if (!subtopic.summary) {
                console.warn('⚠️ LessonPage: Missing summary, using default')
                subtopic.summary = `Teaching about ${subtopic.name}`
              }
              
              console.log('✅ LessonPage: Validated subtopic data:', {
                index: subtopic.index,
                name: subtopic.name,
                whiteboardItemsCount: subtopic.whiteboardItems.length,
                summary: subtopic.summary.substring(0, 100) + '...'
              })
              
              // Convert to SubtopicData format and trigger AI processing
              const subtopicData: SubtopicData = {
                index: subtopic.index,
                name: subtopic.name,
                summary: subtopic.summary,
                durationSec: subtopic.durationSec,
                whiteboardItems: subtopic.whiteboardItems.map((item: any) => ({
                  text: item.text,
                  type: item.type
                }))
              }
              
              console.log('🚀 LessonPage: Triggering CONCATENATED STREAMING whiteboard processing...')
              console.log('🎯 Strategy: All prompts concatenated and sent as one streaming request')
              
              // Use the new concatenated streaming method - all prompts in one request
              await webhook.handleWebhookCallWithConcatenatedStreaming(
                subtopicData,
                concatenatedStreamFunction  // Single function that handles the concatenated prompt
              )
              
              console.log('✅ LessonPage: CONCATENATED STREAMING processing completed for:', subtopic.name)
              
            } else {
              console.error('❌ LessonPage: Invalid subtopic data structure:', subtopic)
            }
          } else {
            console.error('❌ LessonPage: No subtopic data in whiteboard-update event')
          }
        }
      } catch (error) {
        console.error('❌ LessonPage: Error processing SSE event:', error)
        console.error('Event data:', event)
      }
    }
  )

  return (
    <>
      {/* Header with lesson info */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="p-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-semibold text-sm">{lessonData.topic}</h2>
            <p className="text-xs text-gray-600">{lessonData.depth} minute lesson</p>
          </div>
        </div>
      </div>

      {/* Enhanced SSE Connection Status with AI info */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {sseError && <div className="text-red-600">SSE Error: {sseError}</div>}
          {webhook.state.isProcessing && (
            <div className="text-blue-600">
              AI Processing: {webhook.state.currentSubtopic?.name}
            </div>
          )}
          {sseState.lastEvent && (
            <div className="text-gray-600">
              Last: {sseState.lastEvent.type} at {new Date(sseState.lastEvent.timestamp).toLocaleTimeString()}
            </div>
          )}
          <div className="text-gray-500">
            Session: {sessionInitialized ? 'Ready' : 'Initializing...'}
          </div>
          <div className="text-gray-500">
            AI: {tldrawAiWithCamera ? 'Ready' : 'Loading...'}
          </div>
        </div>
      </div>

      <VapiWidget lessonId={lessonId} lessonData={lessonData} />
    </>
  )
}

export function LessonPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [editor, setEditor] = useState<Editor | null>(null)
  const [lessonData, setLessonData] = useState<LessonData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get lesson ID from query parameters
  const searchParams = new URLSearchParams(location.search)
  const lessonId = searchParams.get('id')

  console.log('LessonPage rendered with lessonId:', lessonId)

  // Fetch lesson data from API
  useEffect(() => {
    console.log('useEffect triggered with lessonId:', lessonId)
    
    const fetchLessonData = async () => {
      if (!lessonId) {
        console.log('No lessonId, navigating to home')
        navigate('/')
        return
      }

      console.log('Starting to fetch lesson data...')
      setIsLoading(true)
      setError(null)

      try {
        console.log('Calling API:', `/api/lesson/${lessonId}`)
        const response = await fetch(`/api/lesson/${lessonId}`)
        const result: GetLessonResponse = await response.json()

        console.log('API response:', result)

        if (result.success && result.lesson) {
          console.log('Setting lesson data:', result.lesson)
          setLessonData(result.lesson)
        } else {
          throw new Error(result.error || 'Failed to load lesson')
        }
      } catch (err) {
        console.error('Error fetching lesson:', err)
        setError(err instanceof Error ? err.message : 'Failed to load lesson')
      } finally {
        console.log('Fetch completed, setting loading to false')
        setIsLoading(false)
      }
    }

    fetchLessonData()
  }, [lessonId, navigate])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <DefaultSpinner />
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className=" mb-4">Error: Failed to load lesson</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Show loading if no lesson data
  if (!lessonData || !lessonId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <DefaultSpinner />
          <p className="mt-4 text-gray-600">Loading lesson data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tldraw-ai-container">
      <Tldraw hideUi onMount={setEditor} />
      {/* Only render AI-powered content when editor is available */}
      {editor && (
        <LessonPageContent 
          editor={editor} 
          lessonId={lessonId} 
          lessonData={lessonData} 
        />
      )}
    </div>
  )
}



