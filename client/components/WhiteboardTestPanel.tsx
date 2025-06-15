import React, { useState } from 'react'
import { useWhiteboardContext, type SubtopicData } from '../contexts/WhiteboardContext'
import { useWhiteboardWebhook } from '../hooks/useWhiteboardWebhook'

interface WhiteboardTestPanelProps {
  streamFunction?: (prompt: string) => Promise<void>
}

export function WhiteboardTestPanel({ streamFunction }: WhiteboardTestPanelProps) {
  const whiteboardContext = useWhiteboardContext()
  const [repositionCamera, setRepositionCamera] = useState(true)
  const webhook = useWhiteboardWebhook(streamFunction, repositionCamera)
  
  // Sample test data
  const sampleSubtopic: SubtopicData = {
    index: 1,
    name: "Introduction to Photosynthesis",
    summary: "Basic overview of how plants convert light energy into chemical energy through photosynthesis.",
    durationSec: 60,
    whiteboardItems: [
      {
        text: "Photosynthesis: Converting Light to Life",
        type: "title"
      },
      {
        text: "Photosynthesis: The biological process where plants convert light energy into chemical energy (glucose) using carbon dioxide and water",
        type: "definition"
      },
      {
        text: "Essential Components: Chloroplasts contain chlorophyll pigments that capture sunlight",
        type: "bullet"
      },
      {
        text: "Raw Materials: Carbon dioxide from air + Water from roots + Sunlight energy",
        type: "bullet"
      },
      {
        text: "6CO2 + 6H2O + light energy → C6H12O6 + 6O2",
        type: "formula"
      }
    ]
  }

  const handleTestWebhook = async () => {
    if (!streamFunction) {
      alert('No stream function provided! Please pass a stream function to the WhiteboardTestPanel.')
      return
    }
    
    try {
      await webhook.handleWebhookCall(sampleSubtopic)
    } catch (error) {
      console.error('Test webhook failed:', error)
    }
  }

  const handleInitializeSession = () => {
    whiteboardContext.initializeSession('test-session-123', 'test-lesson-456', 5)
  }

  const handleResetSession = () => {
    whiteboardContext.resetSession()
  }

  const progress = whiteboardContext.getCurrentProgress()

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '350px',
      backgroundColor: 'white', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      fontSize: '14px',
      zIndex: 1000,
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Whiteboard Test Panel</h3>
      
      {/* Camera Control Section */}
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Camera Control</h4>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={repositionCamera}
            onChange={(e) => setRepositionCamera(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <span>Enable camera repositioning</span>
        </label>
        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
          {repositionCamera 
            ? 'Camera will automatically position to show new content' 
            : 'Camera will stay in current position (faster for multiple prompts)'
          }
        </div>
      </div>

      {/* Session Status */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Session Status</h4>
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          <div>Session ID: {whiteboardContext.state.sessionId || 'Not initialized'}</div>
          <div>Lesson ID: {whiteboardContext.state.lessonId || 'Not set'}</div>
          <div>Current Row: {whiteboardContext.state.currentRow}</div>
          <div>Progress: {progress.completed}/{progress.total} prompts</div>
          <div>Processing: {whiteboardContext.state.isProcessing ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Current Subtopic */}
      {whiteboardContext.state.currentSubtopic && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Current Subtopic</h4>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            <div>Name: {whiteboardContext.state.currentSubtopic.name}</div>
            <div>Index: {whiteboardContext.state.currentSubtopic.index}</div>
            <div>Items: {whiteboardContext.state.currentSubtopic.whiteboardItems.length}</div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {whiteboardContext.state.lastError && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '8px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Error:</strong> {whiteboardContext.state.lastError}
          <button 
            onClick={whiteboardContext.clearError}
            style={{ 
              marginLeft: '8px', 
              padding: '2px 6px', 
              fontSize: '10px',
              backgroundColor: '#721c24',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Prompt History */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Prompt History</h4>
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          <div>Total: {whiteboardContext.state.promptHistory.length}</div>
          <div>Executed: {whiteboardContext.state.promptHistory.filter(p => p.executed).length}</div>
          <div>Pending: {whiteboardContext.state.pendingPrompts.length}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={handleInitializeSession}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Initialize Session
        </button>
        
        <button 
          onClick={handleTestWebhook}
          disabled={whiteboardContext.state.isProcessing}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: whiteboardContext.state.isProcessing ? '#6c757d' : '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: whiteboardContext.state.isProcessing ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {whiteboardContext.state.isProcessing ? 'Processing...' : 'Test Webhook Call'}
        </button>
        
        <button 
          onClick={handleResetSession}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reset Session
        </button>
      </div>

      {/* Stream Function Status */}
      <div style={{ 
        marginTop: '16px', 
        padding: '8px', 
        backgroundColor: streamFunction ? '#d4edda' : '#f8d7da',
        color: streamFunction ? '#155724' : '#721c24',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        Stream Function: {streamFunction ? 'Available ✓' : 'Not provided ✗'}
      </div>
    </div>
  )
} 