import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LessonPage } from './pages/LessonPage'
import { Toaster } from "./components/ui/sonner"
import './index.css'

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/lesson/:lessonId" element={<LessonPage />} />
			</Routes>
			<Toaster />
		</Router>
	)
}

export default App
