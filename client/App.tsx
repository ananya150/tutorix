import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'
import { TestPage } from './pages/TestPage'
import { Toaster } from "./components/ui/sonner"
import { WhiteboardProvider } from './contexts/WhiteboardContext'
import './index.css'

function App() {
	return (
		<WhiteboardProvider>
			<Router>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/lesson" element={<LessonPage />} />
					<Route path="/test" element={<TestPage />} />
				</Routes>
				<Toaster />
			</Router>
		</WhiteboardProvider>
	)
}

export default App
