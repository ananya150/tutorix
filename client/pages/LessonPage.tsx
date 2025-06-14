import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { DefaultSpinner, Editor, Tldraw } from 'tldraw'
import { useTldrawAiExample } from '../useTldrawAiExample'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ArrowLeft } from 'lucide-react'

interface LessonConfig {
  topic: string
  depth: string
}

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [editor, setEditor] = useState<Editor | null>(null)
  
  // Get lesson config from navigation state
  const config = location.state?.config as LessonConfig | undefined

  // If no config, redirect to homepage
  useEffect(() => {
    if (!config) {
      navigate('/')
    }
  }, [config, navigate])

  if (!config) {
    return <div>Loading...</div>
  }

  return (
		<div className="tldraw-ai-container">
			<Tldraw hideUi onMount={setEditor} />
			{/* {editor && <InputBar editor={editor} />} */}
		</div>

  )
}

