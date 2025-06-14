import { IRequest } from 'itty-router'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { Environment } from '../types'

interface LessonRequest {
	topic: string
	depth: string
	lessonId: string
}

interface SubTopic {
	index: number
	name: string
	durationSec: number
	summary: string
}

interface LessonPlan {
	topic: string
	totalDurationMinutes: number
	subtopics: SubTopic[]
}

interface DatabaseLesson {
	lesson_id: string
	topic: string
	depth: string
	lesson_plan: LessonPlan
}

export async function generateLesson(request: IRequest, env: Environment) {
	console.log('Generate lesson')
	
	try {
		const { topic, depth, lessonId } = await request.json() as LessonRequest
		console.log('Lesson request:', { topic, depth, lessonId })
		
		// Initialize OpenAI client
		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		})
		
		// Initialize Supabase client
		const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
		
		// Convert depth (string) to duration in minutes
		const durationMinutes = parseInt(depth, 10)
		
		// Create the detailed curriculum planning prompt
		const systemPrompt = `You are Planner, an expert curriculum architect. You create concise micro-lessons that can be voiced in 30-60 seconds each.`
		
		const userPrompt = `Topic: ${topic}
			Target total lesson length: ${durationMinutes} minutes

			INSTRUCTIONS
				1.	Think step-by-step but do NOT reveal your thoughts.
				2.	Split the lesson into sub-topics lasting 30–60 seconds each.
				3.	The first sub-topic must be an introduction that says, "We'll study ${topic} for about ${durationMinutes} minutes …".
				4.	Each sub-topic must have:
			* index  (integer, starts at 1)
			* name  (short title ≤ 8 words)
			* durationSec (30–60)
			* summary (concise ≤ 25 words, what will be taught)
				5.	Ensure the sum of durationSec ≈ ${durationMinutes} × 60 ± 15 s.
				6.	Respond only with valid UTF-8 JSON inside one set of triple back-ticks—no commentary, no markdown.
				7.	Example format (do not reuse values):

			{  
			"topic": "Sample Topic",  
			"totalDurationMinutes": 5,  
			"subtopics": [  
				{ "index": 1, "name": "Introduction", "durationSec": 45, "summary": "We'll study …"},  
				{ "index": 2, "name": "Key Concept A", "durationSec": 50, "summary": "Explain …"}  
			]  
			}  

			8.	Begin now.`

		console.log('Calling OpenAI with prompt for topic:', topic)
		
		// Call OpenAI o3 model
		const completion = await openai.chat.completions.create({
			model: "o3", // Using o3-mini as o3 might not be available yet
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt }
			],
			max_completion_tokens: 2000,
		})
		
		const responseContent = completion.choices[0]?.message?.content
		if (!responseContent) {
			throw new Error('No response content from OpenAI')
		}
		
		console.log('OpenAI response:', responseContent)
		
		// Extract JSON from the response (remove triple backticks if present)
		const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
		const jsonString = jsonMatch ? jsonMatch[1] : responseContent
		
		// Parse the lesson plan
		const lessonPlan: LessonPlan = JSON.parse(jsonString)
		
		console.log('Parsed lesson plan:')
		console.log(lessonPlan)
		
		// Save to Supabase database
		console.log('Saving lesson to database...')
		const { data: savedLesson, error: dbError } = await supabase
			.from('lessons')
			.insert({
				lesson_id: lessonId,
				topic: topic,
				depth: depth,
				lesson_plan: lessonPlan
			} as DatabaseLesson)
			.select()
			.single()
		
		if (dbError) {
			console.error('Database error:', dbError)
			throw new Error(`Failed to save lesson to database: ${dbError.message}`)
		}
		
		console.log('Lesson saved to database:', savedLesson)
		
		// Return the lesson plan with additional metadata
		return new Response(JSON.stringify({
			success: true,
			lessonId,
			lessonPlan,
			generatedAt: new Date().toISOString(),
			requestedDuration: durationMinutes,
			actualDuration: lessonPlan.totalDurationMinutes,
			savedToDatabase: true,
			databaseId: savedLesson?.id
		}), {
			headers: { 'Content-Type': 'application/json' },
		})
		
	} catch (error) {
		console.error('Error generating lesson:', error)
		
		// Return error response
		return new Response(JSON.stringify({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
			lessonId: null,
			savedToDatabase: false
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
} 