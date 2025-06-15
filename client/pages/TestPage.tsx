import React, { useState } from 'react'
import { Tldraw, Editor } from 'tldraw'
import { useTldrawAiExample, useTldrawAiExampleWithCameraControl } from '../useTldrawAiExample'
import { useWhiteboardWebhook } from '../hooks/useWhiteboardWebhook'
import { type SubtopicData } from '../contexts/WhiteboardContext'
import { WhiteboardTestPanel } from '../components/WhiteboardTestPanel'

// Newton's Laws lesson data
const NEWTONS_LAWS_LESSON = {
  "topic": "Newton's Laws of Motion",
  "subtopics": [
    {
      "name": "Introduction",
      "index": 1,
      "summary": "We'll study Newton's laws of motion for about 5 minutes, covering the three fundamental principles that describe how and why objects move. Understanding these laws helps explain everyday phenomena, from why a ball rolls to how rockets launch.",
      "durationSec": 45,
      "whiteboardItems": [
        {
          "text": "Newton's Laws of Motion",
          "type": "title"
        },
        {
          "text": "3 Laws Explain Forces & Motion",
          "type": "definition"
        },
        {
          "text": "Why objects move, stop, or stay at rest",
          "type": "bullet"
        }
      ]
    },
    {
      "name": "First Law – Inertia",
      "index": 2,
      "summary": "Newton's First Law, also called the law of inertia, states that an object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted on by a net external force. This explains why seatbelts are important and why objects don't change motion on their own.",
      "durationSec": 50,
      "whiteboardItems": [
        {
          "text": "First Law: Law of Inertia",
          "type": "heading"
        },
        {
          "text": "Inertia: Resistance to motion change",
          "type": "definition"
        },
        {
          "text": "Object at rest stays at rest",
          "type": "bullet"
        },
        {
          "text": "Object in motion stays moving in same direction & speed",
          "type": "bullet"
        },
        {
          "text": "Example: Car stops suddenly, passengers lurch forward",
          "type": "example"
        }
      ]
    },
    {
      "name": "Second Law – Force & Acceleration",
      "index": 3,
      "summary": "Newton's Second Law quantifies how forces cause acceleration. It states that the acceleration of an object depends on its mass and the net force applied. The mathematical formula is F = ma. This law explains why heavier objects need more force to accelerate equally.",
      "durationSec": 55,
      "whiteboardItems": [
        {
          "text": "Second Law: Force & Acceleration",
          "type": "heading"
        },
        {
          "text": "F = ma (Force = mass × acceleration)",
          "type": "formula"
        },
        {
          "text": "Force causes objects to speed up, slow down, or change direction",
          "type": "bullet"
        },
        {
          "text": "More mass → greater force needed for same acceleration",
          "type": "note"
        },
        {
          "text": "Example: Pushing a shopping cart vs. a truck",
          "type": "example"
        }
      ]
    },
    {
      "name": "Third Law – Action & Reaction",
      "index": 4,
      "summary": "Newton's Third Law states that for every action, there is an equal and opposite reaction. This means forces always come in pairs. When you push on a wall, the wall pushes back with equal force, even though only one seems to move.",
      "durationSec": 50,
      "whiteboardItems": [
        {
          "text": "Third Law: Action-Reaction",
          "type": "heading"
        },
        {
          "text": "For every action, equal and opposite reaction",
          "type": "definition"
        },
        {
          "text": "Forces always come in pairs",
          "type": "bullet"
        },
        {
          "text": "Example: Jumping off a boat pushes it backward",
          "type": "example"
        }
      ]
    },
    {
      "name": "Real-Life Applications",
      "index": 5,
      "summary": "Newton's laws explain real-world phenomena: cars accelerating, balls bouncing, or rockets launching. Understanding these laws is key in engineering, sports, transportation, and even walking. Being aware of them helps us predict and control motion in daily life.",
      "durationSec": 45,
      "whiteboardItems": [
        {
          "text": "Applying Newton's Laws",
          "type": "heading"
        },
        {
          "text": "Explains engineering, sports, launching rockets",
          "type": "bullet"
        },
        {
          "text": "Predicting and controlling motion",
          "type": "note"
        },
        {
          "text": "Example: Airplanes generate lift by pushing air downwards",
          "type": "example"
        }
      ]
    },
    {
      "name": "Quick Recap & Key Takeaways",
      "index": 6,
      "summary": "To recap, Newton's laws describe how forces interact to change motion. The First Law is about inertia, the Second links force and acceleration, and the Third explains action-reaction pairs. These simple rules help us understand and harness motion everywhere.",
      "durationSec": 35,
      "whiteboardItems": [
        {
          "text": "Newton's Laws Recap",
          "type": "heading"
        },
        {
          "text": "First: Inertia | Second: F = ma | Third: Action-Reaction",
          "type": "bullet"
        },
        {
          "text": "Fundamental to science and real life",
          "type": "note"
        }
      ]
    }
  ],
  "totalDurationMinutes": 5
} as const

// Inner component that has access to the editor context
function TestPageContent({ editor }: { editor: Editor | null }) {
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sessionInitialized, setSessionInitialized] = useState(false)
  
  // Create both camera-enabled and camera-disabled AI instances
  const tldrawAiWithCamera = editor ? useTldrawAiExampleWithCameraControl(editor, true) : null
  const tldrawAiWithoutCamera = editor ? useTldrawAiExampleWithCameraControl(editor, false) : null
  
  // Create concatenated streaming function that uses the actual /stream endpoint
  const concatenatedStreamFunction = React.useCallback(async (concatenatedPrompt: string, repositionCamera: boolean) => {
    console.log('🎯 ConcatenatedStreamFunction: Executing concatenated prompt with REAL STREAMING:', {
      length: concatenatedPrompt.length,
      repositionCamera,
      preview: concatenatedPrompt.substring(0, 200) + '...'
    })
    
    if (!editor) {
      console.error('❌ ConcatenatedStreamFunction: No editor available')
      throw new Error('No editor available for prompt execution')
    }
    
    if (!tldrawAiWithCamera) {
      console.error('❌ ConcatenatedStreamFunction: No tldraw AI available')
      throw new Error('No tldraw AI available for prompt execution')
    }
    
    try {
      console.log('📝 ConcatenatedStreamFunction: Calling tldraw AI with STREAMING enabled...')
      console.log('🌊 Using /stream endpoint for real-time response processing')
      
      // Use the stream: true parameter to enable actual streaming via /stream endpoint
      const { promise, cancel } = tldrawAiWithCamera.prompt({ 
        message: concatenatedPrompt,
        stream: true  // 🔥 This enables actual streaming!
      })
      
      // Store cancel function for potential future use
      console.log('📡 Streaming started, waiting for real-time responses...')
      
      // Wait for the streaming to complete
      await promise
      
      console.log('✅ ConcatenatedStreamFunction: STREAMING completed successfully', {
        repositionCamera,
        endpoint: '/stream'
      })
    } catch (error) {
      console.error('❌ ConcatenatedStreamFunction: Error during streaming:', error)
      throw error
    }
  }, [editor, tldrawAiWithCamera])
  
  // Create stream function WITH camera repositioning (for first prompt) - LEGACY
  const streamFunctionWithCamera = React.useCallback(async (prompt: string) => {
    console.log('🎯 StreamFunction (WITH camera): Executing prompt:', prompt)
    
    if (!editor) {
      console.error('❌ StreamFunction: No editor available')
      throw new Error('No editor available for prompt execution')
    }
    
    if (!tldrawAiWithCamera) {
      console.error('❌ StreamFunction: No tldraw AI with camera available')
      throw new Error('No tldraw AI with camera available for prompt execution')
    }
    
    try {
      console.log('📝 StreamFunction (WITH camera): Calling tldraw AI prompt (via /generate endpoint)...')
      const result = tldrawAiWithCamera.prompt({ message: prompt })
      await result.promise
      console.log('✅ StreamFunction (WITH camera): Prompt executed successfully')
    } catch (error) {
      console.error('❌ StreamFunction (WITH camera): Error executing prompt:', error)
      throw error
    }
  }, [editor, tldrawAiWithCamera])

  // Create stream function WITHOUT camera repositioning (for subsequent prompts) - LEGACY
  const streamFunctionWithoutCamera = React.useCallback(async (prompt: string) => {
    console.log('🎯 StreamFunction (WITHOUT camera): Executing prompt:', prompt)
    
    if (!editor) {
      console.error('❌ StreamFunction: No editor available')
      throw new Error('No editor available for prompt execution')
    }
    
    if (!tldrawAiWithoutCamera) {
      console.error('❌ StreamFunction: No tldraw AI without camera available')
      throw new Error('No tldraw AI without camera available for prompt execution')
    }
    
    try {
      console.log('📝 StreamFunction (WITHOUT camera): Calling tldraw AI prompt (via /generate endpoint)...')
      const result = tldrawAiWithoutCamera.prompt({ message: prompt })
      await result.promise
      console.log('✅ StreamFunction (WITHOUT camera): Prompt executed successfully')
    } catch (error) {
      console.error('❌ StreamFunction (WITHOUT camera): Error executing prompt:', error)
      throw error
    }
  }, [editor, tldrawAiWithoutCamera])
  
  // Get the whiteboard webhook functionality (using the camera-enabled function as default)
  const webhook = useWhiteboardWebhook(streamFunctionWithCamera)
  
  // Initialize session on component mount (only once)
  React.useEffect(() => {
    if (!sessionInitialized) {
      console.log('🔧 TestPageContent: Initializing session...')
      webhook.initializeSession(
        'test-session-newtons-laws',
        'lesson-newtons-laws-123',
        NEWTONS_LAWS_LESSON.subtopics.length
      )
      console.log('✅ TestPageContent: Session initialized with', NEWTONS_LAWS_LESSON.subtopics.length, 'subtopics')
      setSessionInitialized(true)
    }
  }, [webhook, sessionInitialized])

  const handleNext = async () => {
    if (currentSubtopicIndex >= NEWTONS_LAWS_LESSON.subtopics.length) {
      console.log('🏁 TestPageContent: All subtopics completed!')
      alert('All subtopics completed!')
      return
    }

    const currentSubtopic = NEWTONS_LAWS_LESSON.subtopics[currentSubtopicIndex]
    
    console.log('🚀 TestPageContent: Processing subtopic', currentSubtopic.index, ':', currentSubtopic.name)
    console.log('📝 TestPageContent: Subtopic data:', {
      index: currentSubtopic.index,
      name: currentSubtopic.name,
      summary: currentSubtopic.summary.substring(0, 100) + '...',
      whiteboardItemsCount: currentSubtopic.whiteboardItems.length,
      items: currentSubtopic.whiteboardItems.map(item => ({ text: item.text.substring(0, 30) + '...', type: item.type }))
    })

    setIsProcessing(true)

    try {
      // Convert to the format expected by the webhook
      const subtopicData: SubtopicData = {
        index: currentSubtopic.index,
        name: currentSubtopic.name,
        summary: currentSubtopic.summary,
        durationSec: currentSubtopic.durationSec,
        whiteboardItems: currentSubtopic.whiteboardItems.map(item => ({
          text: item.text,
          type: item.type as any // Type assertion for the specific types
        }))
      }

      console.log('📡 TestPageContent: Calling webhook with concatenated streaming...')
      console.log('🎯 Strategy: All prompts concatenated and sent as one request with selective camera control')
      
      // Use the new concatenated streaming method - all prompts in one request
      await webhook.handleWebhookCallWithConcatenatedStreaming(
        subtopicData,
        concatenatedStreamFunction  // Single function that handles the concatenated prompt
      )
      
      console.log('✅ TestPageContent: Webhook call completed for subtopic:', currentSubtopic.name)
      
      // Move to next subtopic
      setCurrentSubtopicIndex(prev => prev + 1)
      
    } catch (error) {
      console.error('❌ TestPageContent: Error processing subtopic:', error)
      alert(`Error processing subtopic: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    console.log('🔄 TestPageContent: Resetting lesson...')
    setCurrentSubtopicIndex(0)
    setSessionInitialized(false) // Allow re-initialization
    webhook.resetState()
    console.log('✅ TestPageContent: Lesson reset complete')
  }

  const currentSubtopic = NEWTONS_LAWS_LESSON.subtopics[currentSubtopicIndex]
  const isCompleted = currentSubtopicIndex >= NEWTONS_LAWS_LESSON.subtopics.length

  return (
    <>
      {/* Test panel overlay */}
      <WhiteboardTestPanel streamFunction={streamFunctionWithCamera} />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 z-10">
        <div className="max-w-4xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {currentSubtopicIndex} / {NEWTONS_LAWS_LESSON.subtopics.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentSubtopicIndex / NEWTONS_LAWS_LESSON.subtopics.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentSubtopicIndex / NEWTONS_LAWS_LESSON.subtopics.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current subtopic info */}
          {!isCompleted && currentSubtopic && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">
                Next: {currentSubtopic.name} (Subtopic {currentSubtopic.index})
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {currentSubtopic.summary.substring(0, 150)}...
              </p>
              <div className="text-xs text-blue-600 mt-2">
                Whiteboard items: {currentSubtopic.whiteboardItems.length} | 
                Duration: {currentSubtopic.durationSec}s
              </div>
            </div>
          )}

          {/* Completion message */}
          {isCompleted && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900">
                🎉 Lesson Complete!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                All {NEWTONS_LAWS_LESSON.subtopics.length} subtopics have been processed and added to the whiteboard.
              </p>
            </div>
          )}

          {/* Control buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleNext}
              disabled={isProcessing || isCompleted || !editor || !sessionInitialized}
              className={`
                flex-1 py-3 px-6 rounded-lg font-medium transition-all
                ${isProcessing || !editor || !sessionInitialized
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : isCompleted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                }
              `}
            >
              {!editor
                ? '⏳ Loading Editor...'
                : !sessionInitialized
                  ? '⏳ Initializing...'
                  : isProcessing 
                    ? '⏳ Processing...' 
                    : isCompleted 
                      ? '✅ Completed' 
                      : `Next: ${currentSubtopic?.name || 'Unknown'}`
              }
            </button>

            <button
              onClick={handleReset}
              disabled={isProcessing || !editor}
              className="py-3 px-6 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-all"
            >
              🔄 Reset
            </button>
          </div>

          {/* Debug info */}
          <div className="mt-3 text-xs text-gray-500">
            <div>Current subtopic index: {currentSubtopicIndex}</div>
            <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
            <div>Session initialized: {sessionInitialized ? 'Yes' : 'No'}</div>
            <div>Stream function available: {typeof streamFunctionWithCamera === 'function' ? 'Yes' : 'No'}</div>
            <div>Editor available: {editor ? 'Yes' : 'No'}</div>
            <div>Tldraw AI with camera available: {tldrawAiWithCamera ? 'Yes' : 'No'}</div>
            <div>Tldraw AI without camera available: {tldrawAiWithoutCamera ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
    </>
  )
}

export function TestPage() {
  const [editor, setEditor] = useState<Editor | null>(null)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Whiteboard AI Test Page</h1>
        <p className="text-gray-600">Testing Newton's Laws of Motion lesson with AI-generated whiteboard prompts</p>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative">
        {/* Tldraw component */}
        <div className="h-full">
          <Tldraw hideUi onMount={setEditor} />
          {/* Only render content when editor is available */}
          {editor && <TestPageContent editor={editor} />}
        </div>
      </div>
    </div>
  )
} 