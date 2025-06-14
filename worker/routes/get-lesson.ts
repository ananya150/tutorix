import { IRequest } from 'itty-router'
import { createClient } from '@supabase/supabase-js'
import { Environment } from '../types'

export async function getLesson(request: IRequest, env: Environment) {
	console.log('Get lesson')
	
	try {
		// Extract lesson ID from URL parameters
		const url = new URL(request.url)
		const lessonId = url.pathname.split('/').pop()
		
		if (!lessonId) {
			return new Response(JSON.stringify({
				success: false,
				error: 'Lesson ID is required'
			}), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}
		
		console.log('Fetching lesson:', lessonId)
		
		// Initialize Supabase client
		const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
		
		// Fetch lesson from database
		const { data: lesson, error: dbError } = await supabase
			.from('lessons')
			.select('*')
			.eq('lesson_id', lessonId)
			.single()
		
		if (dbError) {
			console.error('Database error:', dbError)
			
			if (dbError.code === 'PGRST116') {
				return new Response(JSON.stringify({
					success: false,
					error: 'Lesson not found'
				}), {
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				})
			}
			
			throw new Error(`Failed to fetch lesson: ${dbError.message}`)
		}
		
		console.log('Lesson retrieved from database:', lesson)
		
		// Return the lesson data
		return new Response(JSON.stringify({
			success: true,
			lesson: {
				id: lesson.id,
				lessonId: lesson.lesson_id,
				topic: lesson.topic,
				depth: lesson.depth,
				lessonPlan: lesson.lesson_plan,
				createdAt: lesson.created_at,
				updatedAt: lesson.updated_at
			}
		}), {
			headers: { 'Content-Type': 'application/json' },
		})
		
	} catch (error) {
		console.error('Error fetching lesson:', error)
		
		return new Response(JSON.stringify({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
} 