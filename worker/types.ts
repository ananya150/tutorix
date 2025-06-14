export interface Environment {
	TLDRAW_AI_DURABLE_OBJECT: DurableObjectNamespace
	OPENAI_API_KEY: string
	LOG_LEVEL: 'debug' | 'none'
	SUPABASE_URL: string
	SUPABASE_ANON_KEY: string
	SUPABASE_SERVICE_ROLE_KEY: string
}
