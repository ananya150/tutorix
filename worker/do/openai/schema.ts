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

// Removed rectangle, ellipse, cloud, line, and note shapes - we only support text now

const SimpleTextShape = z.object({
	type: z.literal('text'),
	shapeId: z.string(),
	note: z.string(),
	// Grid-based positioning instead of coordinates
	contentType: z.enum(['title', 'heading', 'subheading', 'definition', 'bullet', 'numbered', 'formula', 'note', 'example', 'summary']),
	targetRow: z.number().optional(), // AI can suggest specific row, otherwise auto-assigned
	columnSpan: z.array(z.number()).length(2).optional(), // [start, end] columns, otherwise auto from content type
	// Keep text properties
	color: SimpleColor.optional(),
	text: z.string().optional(),
	textAlign: z.enum(['start', 'middle', 'end']).optional(),
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
	text: z.string(),
	intent: z.string(),
})
export type ISimpleThinkEvent = z.infer<typeof SimpleThinkEvent>

export const SimpleEvent = z.union([
	SimpleThinkEvent,
	SimpleCreateEvent, // or update
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
