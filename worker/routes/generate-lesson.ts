import { IRequest } from 'itty-router'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { Environment } from '../types'

interface LessonRequest {
	topic: string
	depth: string
	lessonId: string
}

interface WhiteboardItem {
	text: string
	type: 'title' | 'heading' | 'subheading' | 'definition' | 'bullet' | 'formula' | 'example' | 'note'
}

interface SubTopic {
	index: number
	name: string
	durationSec: number
	summary: string
	whiteboardItems: WhiteboardItem[]
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
			* summary (detailed explanation 40-80 words, covering key concepts and teaching points)
			* whiteboardItems (array of detailed objects with text and type that will be displayed on whiteboard during this subtopic: {text: string, type: "title"|"heading"|"subheading"|"definition"|"bullet"|"formula"|"example"|"note"})
				5.	Ensure the sum of durationSec ≈ ( ${durationMinutes} × 60 ) ± 15 s.
				6.	For whiteboardItems, create detailed content that supports the teaching:
			* type "title": Main lesson or subtopic titles (clear, descriptive)
			* type "heading": Section headings that organize content
			* type "subheading": Subsection headings for detailed breakdown
			* type "definition": Complete key term definitions with explanations
			* type "bullet": Detailed bullet points with specific information, not just keywords
			* type "formula": Complete mathematical equations, formulas, or scientific notation with labels
			* type "example": Specific, detailed examples with context and explanation
			* type "note": Important clarifications, warnings, or additional context
			Make each whiteboardItem comprehensive and educational, not just brief labels
				7.	Respond only with valid UTF-8 JSON inside one set of triple back-ticks—no commentary, no markdown.
				8.	Example format (do not reuse values):

			{  
			"topic": "Sample Topic",  
			"totalDurationMinutes": 5,  
			"subtopics": [  
				{ 
					"index": 1, 
					"name": "Introduction", 
					"durationSec": 45, 
					"summary": "We'll study photosynthesis for about 5 minutes, covering the basic process, key components, and importance in ecosystems. This introduction sets the foundation for understanding how plants convert light energy into chemical energy.",
					"whiteboardItems": [
						{"text": "Photosynthesis: Converting Light to Life", "type": "title"},
						{"text": "Photosynthesis: The biological process where plants convert light energy into chemical energy (glucose) using carbon dioxide and water", "type": "definition"},
						{"text": "Essential Components: Chloroplasts contain chlorophyll pigments that capture sunlight", "type": "bullet"},
						{"text": "Raw Materials: Carbon dioxide from air + Water from roots + Sunlight energy", "type": "bullet"}
					]
				},  
				{ 
					"index": 2, 
					"name": "Light Reactions", 
					"durationSec": 50, 
					"summary": "Explain the light-dependent reactions occurring in chloroplasts, focusing on how chlorophyll captures photons and converts them into ATP and NADPH through the electron transport chain.",
					"whiteboardItems": [
						{"text": "Light-Dependent Reactions: The Photo Stage", "type": "heading"},
						{"text": "Location: Thylakoid Membranes in Chloroplasts", "type": "subheading"},
						{"text": "Overall Equation: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2 + ATP", "type": "formula"},
						{"text": "Energy Conversion: Light photons excite electrons in chlorophyll, creating ATP and NADPH", "type": "bullet"},
						{"text": "Oxygen Release: Water molecules split (photolysis) releasing O2 as a byproduct", "type": "bullet"}
					]
				}
			]  
			}  

			9.	Begin now.`

		console.log('Calling OpenAI with prompt for topic:', topic)
		
		// Call OpenAI o3 model
		const completion = await openai.chat.completions.create({
			model: "gpt-4.1", // Using o3-mini as o3 might not be available yet
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