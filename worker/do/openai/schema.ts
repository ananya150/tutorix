import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const SimpleColor = z.enum([
	'red',
	'light-red',
	'green',
	'light-green',
	'blue',
	'light-blue',
	'orange',
	'yellow',
	'black',
	'violet',
	'light-violet',
	'grey',
	'white',
])

export type ISimpleColor = z.infer<typeof SimpleColor>

const SimpleFill = z.enum(['none', 'tint', 'semi', 'solid', 'pattern'])

export type ISimpleFill = z.infer<typeof SimpleFill>

const SimpleLabel = z.string()

// Text shape with explicit positioning instead of semantic grid

const SimpleTextShape = z.object({
	type: z.literal('text'),
	shapeId: z.string(),
	note: z.string(),
	// Explicit positioning parameters
	row: z.number(), // Required: which row to place the text box
	horizontalPosition: z.union([
		z.enum(['left', 'center', 'right']), // Named positions
		z.number().min(0).max(1) // Custom position as fraction (0=left, 1=right)
	]),
	width: z.union([
		z.string(), // Fractions like "1/4", "1/2", percentages like "25%", or pixels like "200px"
		z.number() // Direct pixel width
	]),
	// Text content and styling
	text: z.string(),
	textAlign: z.enum(['left', 'center', 'right']).optional().default('left'), // Alignment within the text box
	fontSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional().default('medium'),
	fontWeight: z.enum(['normal', 'bold']).optional().default('normal'),
	color: SimpleColor.optional().default('black'),
	bullet: z.boolean().optional().default(false), // Whether to add bullet point
})

export type ISimpleTextShape = z.infer<typeof SimpleTextShape>

// Only support text shapes now
const SimpleShape = SimpleTextShape

export type ISimpleShape = z.infer<typeof SimpleShape>

// Events

export const SimpleCreateEvent = z.object({
	type: z.enum(['create', 'update']),
	shape: SimpleShape,
	intent: z.string(),
})

export type ISimpleCreateEvent = z.infer<typeof SimpleCreateEvent>

export const SimpleMoveEvent = z.object({
	type: z.literal('move'),
	shapeId: z.string(),
	x: z.number(),
	y: z.number(),
	intent: z.string(),
})

export type ISimpleMoveEvent = z.infer<typeof SimpleMoveEvent>

const SimpleDeleteEvent = z.object({
	type: z.literal('delete'),
	shapeId: z.string(),
	intent: z.string(),
})
export type ISimpleDeleteEvent = z.infer<typeof SimpleDeleteEvent>

const SimpleThinkEvent = z.object({
	type: z.literal('think'),
	reasoning: z.string(),
})

const SimpleCameraEvent = z.object({
	type: z.literal('camera'),
	targetRow: z.number(), // The row where new content will be added
	reasoning: z.string(), // Why this camera position was chosen
})

export type ISimpleThinkEvent = z.infer<typeof SimpleThinkEvent>
export type ISimpleCameraEvent = z.infer<typeof SimpleCameraEvent>

export const SimpleEvent = z.union([
	SimpleThinkEvent,
	SimpleCameraEvent,
	SimpleCreateEvent,
	SimpleDeleteEvent,
	SimpleMoveEvent,
])

export type ISimpleEvent = z.infer<typeof SimpleEvent>

// Model response schema

export const ModelResponse = z.object({
	long_description_of_strategy: z.string(),
	events: z.array(SimpleEvent),
})

export type IModelResponse = z.infer<typeof ModelResponse>

export const RESPONSE_FORMAT = zodResponseFormat(ModelResponse, 'event')
