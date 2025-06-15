import React from 'react'
import { promptStorage } from '../utils/promptStorage'
import { useSimpleWhiteboard } from '../hooks/useSimpleWhiteboard'

export function SimpleWhiteboardStatus() {
  const whiteboard = useSimpleWhiteboard()
  const [refresh, setRefresh] = React.useState(0)

  // Force re-render to show latest state
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRefresh(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const state = whiteboard.getState()
  const counts = promptStorage.getCounts()
  const session = promptStorage.getSession()
  const recentPrompts = promptStorage.getLastNExecuted(3)

  return (
    <div className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border max-w-sm">
      <h3 className="font-semibold text-sm mb-2 text-gray-800">Whiteboard Status</h3>
      
      {/* Processing Status */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${state.isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-xs font-medium">
            {state.isProcessing ? 'Processing...' : 'Ready'}
          </span>
        </div>
        
        {state.currentSubtopic && (
          <div className="text-xs text-blue-600 pl-4">
            Working on: {state.currentSubtopic.name}
          </div>
        )}
        
        {state.error && (
          <div className="text-xs text-red-600 pl-4">
            Error: {state.error}
          </div>
        )}
      </div>

      {/* Session Info */}
      <div className="mb-3 text-xs text-gray-600">
        <div>Session: {session.sessionId ? 'Active' : 'Not initialized'}</div>
        <div>Lesson: {session.lessonId || 'None'}</div>
        <div>Current Row: {state.currentRow}</div>
      </div>

      {/* Prompt Counts */}
      <div className="mb-3 text-xs">
        <div className="flex justify-between">
          <span>Total Prompts:</span>
          <span className="font-mono">{counts.total}</span>
        </div>
        <div className="flex justify-between">
          <span>Executed:</span>
          <span className="font-mono text-green-600">{counts.executed}</span>
        </div>
        <div className="flex justify-between">
          <span>Pending:</span>
          <span className="font-mono text-orange-600">{counts.pending}</span>
        </div>
      </div>

      {/* Recent Prompts */}
      {recentPrompts.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-700 mb-1">Recent Prompts:</div>
          <div className="space-y-1">
            {recentPrompts.map((prompt, index) => (
              <div key={prompt.id} className="text-xs bg-gray-50 p-1 rounded">
                <div className="text-gray-600 text-xs">
                  {prompt.subtopicName}
                </div>
                <div className="text-gray-800 truncate">
                  {prompt.prompt.substring(0, 50)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => whiteboard.resetSession()}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Reset
        </button>
        <button
          onClick={() => setRefresh(prev => prev + 1)}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>
    </div>
  )
} 