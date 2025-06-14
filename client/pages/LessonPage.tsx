import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DefaultSpinner, Editor, Tldraw } from 'tldraw'
import { useTldrawAiExample } from '../useTldrawAiExample'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Vapi from '@vapi-ai/web'
import { VapiWidget } from '../components/vapi-widget'
import { useSSEConnection } from '../hooks/useSSEConnection'
import { useWhiteboardWebhook } from '../hooks/useWhiteboardWebhook'

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

  // Initialize webhook state management
  const { state: webhookState, handleWebhookCall } = useWhiteboardWebhook()

  // Set up SSE connection for this specific lesson
  const { state: sseState, isConnected, error: sseError } = useSSEConnection(
    lessonId || '', 
    (event) => {
      console.log('📡 SSE Event received in LessonPage:', event)
      
      try {
        // Handle whiteboard-update events
        if (event.type === 'whiteboard-update') {
          console.log('🎯 Processing whiteboard update:', event.data)
          
          // Extract subtopic data and trigger webhook processing
          const { subtopic } = event.data
          if (subtopic) {
            // Validate subtopic data before processing
            if (subtopic.index && subtopic.name && subtopic.summary) {
              // Ensure whiteboardItems exists and is an array
              if (!subtopic.whiteboardItems || !Array.isArray(subtopic.whiteboardItems)) {
                console.warn('⚠️ Missing or invalid whiteboardItems, using empty array')
                subtopic.whiteboardItems = []
              }
              
              // Ensure durationSec exists
              if (!subtopic.durationSec) {
                console.warn('⚠️ Missing durationSec, using default value')
                subtopic.durationSec = 30
              }
              
              console.log('✅ Validated subtopic data:', subtopic)
              handleWebhookCall(subtopic)
            } else {
              console.error('❌ Invalid subtopic data structure:', subtopic)
            }
          } else {
            console.error('❌ No subtopic data in whiteboard-update event')
          }
        }
      } catch (error) {
        console.error('❌ Error processing SSE event:', error)
        console.error('Event data:', event)
      }
    }
  )

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
  if (!lessonData) {
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

      {/* SSE Connection Status */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {sseError && <div className="text-red-600">SSE Error: {sseError}</div>}
          {webhookState.isProcessing && (
            <div className="text-blue-600">Processing: {webhookState.currentSubtopic?.name}</div>
          )}
          {sseState.lastEvent && (
            <div className="text-gray-600">
              Last: {sseState.lastEvent.type} at {new Date(sseState.lastEvent.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <VapiWidget lessonId={lessonId!} lessonData={lessonData} />

      <Tldraw hideUi onMount={setEditor} />
      {/* {editor && <InputBar editor={editor} />} */}
    </div>
  )
}



