import Vapi from "@vapi-ai/web"
import { useEffect, useState } from "react"


export const VapiWidget = ({lessonData, lessonId}: {lessonData: any, lessonId: string}) => {

    const [vapi, setVapi] = useState<Vapi | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [loading, setLoading] = useState(false);

    console.log(lessonData.depth)

    useEffect(() => {
      const vapi = new Vapi('85d4dfc9-c98b-48f2-95f5-c4cadda50bff')
      setVapi(vapi)
  
      vapi.on('call-start', () => {
        setIsConnected(true);
        setLoading(false);
      })
      vapi.on('call-end',   () => setIsConnected(false))
      vapi.on('message',    m => console.log('LLM msg / func calls', m))
  
      vapi.on('speech-start', () => {
        console.log('Assistant started speaking');
        setIsSpeaking(true);
      });
      vapi.on('speech-end', () => {
        console.log('Assistant stopped speaking');
        setIsSpeaking(false);
      });
  
  
    }, [])
  
    async function startCall() {
      console.log('Starting call');
      if (vapi) {
        setLoading(true);
        console.log('Vapi instance found');
        vapi.start('9abdc10b-8a05-478f-821a-5bb512ccb35d', {variableValues: {playlist: JSON.stringify(lessonData.lessonPlan), lessonId: lessonId}, firstMessageMode: 'assistant-speaks-first', firstMessage: `Hi there, how are you doing? Should we start the lesson?`});
      }
    }

    const endCall = () => {
        if (vapi) {
          vapi.stop();
        }
      };

  return (
    <div>
      {!isConnected ? (
        <button onClick={startCall} className="fixed top-1/2 left-1/2 -translate-x-1/2 w-[150px] items-center justify-center flex -translate-y-1/2 z-10 bg-black backdrop-blur-sm rounded-lg p-3 shadow-sm z-1000">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-semibold text-xl text-white flex items-center gap-2">
                {loading ? (
                  <>
                    <div role="status">
                        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                        </svg>
                    </div>
                  </>
                ) : (
                  'Start Lesson'
                )}
              </h2>
            </div>
          </div>
        </button>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          width: '320px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e1e5e9',
          position: 'fixed',
          bottom: '50px',
          right: '4px',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isSpeaking ? '#ff4444' : '#12A594',
                animation: isSpeaking ? 'pulse 1s infinite' : 'none'
              }}></div>
              <span style={{ fontWeight: 'bold', color: '#333' }}>
                {isSpeaking ? 'Speaking...' : 'Listening...'}
              </span>
            </div>
            <button
              onClick={endCall}
              style={{
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Stop lesson
            </button>
          </div>
          
          {/* <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: '12px',
            padding: '8px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {transcript.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                Conversation will appear here...
              </p>
            ) : (
              transcript.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '8px',
                    textAlign: msg.role === 'user' ? 'right' : 'left'
                  }}
                >
                  <span style={{
                    background: msg.role === 'user' ? '#12A594' : '#333',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    fontSize: '14px',
                    maxWidth: '80%'
                  }}>
                    {msg.text}
                  </span>
                </div>
              ))
            )}
          </div> */}
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>

  )
}