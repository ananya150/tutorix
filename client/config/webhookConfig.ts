// Central webhook configuration
// Update these URLs when switching between local development and ngrok

interface WebhookConfig {
  // Base URL for the webhook server
  baseUrl: string
  
  // Specific endpoints
  webhookEndpoint: string
  sseEndpoint: (lessonId: string) => string
  healthEndpoint: string
  
  // Full URLs (computed)
  webhookUrl: string
  healthUrl: string
}

// Environment detection
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// Configuration based on environment
const createWebhookConfig = (): WebhookConfig => {
  // Default to local development
  let baseUrl = 'https://f564-106-219-70-127.ngrok-free.app'
  
  // Check for environment variable override
  const envWebhookUrl = import.meta.env.VITE_WEBHOOK_BASE_URL
  if (envWebhookUrl) {
    baseUrl = envWebhookUrl
    console.log('📡 Using webhook base URL from environment:', baseUrl)
  }
  
  // You can manually override here for ngrok testing
  // Uncomment and update the line below when using ngrok:
  // baseUrl = 'https://your-ngrok-url.ngrok-free.app'
  
  return {
    baseUrl,
    webhookEndpoint: '/api/whiteboard-update',
    sseEndpoint: (lessonId: string) => `/events/${lessonId}`,
    healthEndpoint: '/health',
    
    // Computed full URLs
    webhookUrl: `${baseUrl}/api/whiteboard-update`,
    healthUrl: `${baseUrl}/health`
  }
}

// Export the configuration
export const webhookConfig = createWebhookConfig()

// Helper functions
export const getSSEUrl = (lessonId: string): string => {
  return `${webhookConfig.baseUrl}${webhookConfig.sseEndpoint(lessonId)}`
}

export const getWebhookUrl = (): string => {
  return webhookConfig.webhookUrl
}

export const getHealthUrl = (): string => {
  return webhookConfig.healthUrl
}

// Log current configuration
console.log('📡 Webhook Configuration:', {
  baseUrl: webhookConfig.baseUrl,
  webhookUrl: webhookConfig.webhookUrl,
  environment: isDevelopment ? 'development' : 'production'
})

// Export for easy updates
export const updateWebhookBaseUrl = (newBaseUrl: string) => {
  console.log('📡 Updating webhook base URL from', webhookConfig.baseUrl, 'to', newBaseUrl)
  
  webhookConfig.baseUrl = newBaseUrl
  webhookConfig.webhookUrl = `${newBaseUrl}/api/whiteboard-update`
  webhookConfig.healthUrl = `${newBaseUrl}/health`
  
  console.log('📡 Updated webhook configuration:', webhookConfig)
} 