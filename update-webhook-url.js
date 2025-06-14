#!/usr/bin/env node

// Quick utility to update webhook URL in config
// Usage: node update-webhook-url.js https://your-ngrok-url.ngrok-free.app

import fs from 'fs'
import path from 'path'

const configPath = 'client/config/webhookConfig.ts'

function updateWebhookUrl(newUrl) {
  if (!newUrl) {
    console.error('❌ Please provide a URL')
    console.log('Usage: node update-webhook-url.js https://your-ngrok-url.ngrok-free.app')
    process.exit(1)
  }

  // Validate URL format
  try {
    new URL(newUrl)
  } catch (error) {
    console.error('❌ Invalid URL format:', newUrl)
    process.exit(1)
  }

  // Read current config
  if (!fs.existsSync(configPath)) {
    console.error('❌ Config file not found:', configPath)
    process.exit(1)
  }

  let configContent = fs.readFileSync(configPath, 'utf8')
  
  // Update the baseUrl line
  const urlPattern = /baseUrl = ['"`]([^'"`]+)['"`]/
  const commentedPattern = /\/\/ baseUrl = ['"`]([^'"`]+)['"`]/
  
  if (configContent.match(urlPattern)) {
    // Replace existing baseUrl
    configContent = configContent.replace(urlPattern, `baseUrl = '${newUrl}'`)
    console.log('✅ Updated existing baseUrl')
  } else if (configContent.match(commentedPattern)) {
    // Uncomment and update
    configContent = configContent.replace(commentedPattern, `baseUrl = '${newUrl}'`)
    console.log('✅ Uncommented and updated baseUrl')
  } else {
    // Add after the environment variable check
    const insertPoint = 'if (envWebhookUrl) {'
    const insertIndex = configContent.indexOf(insertPoint)
    
    if (insertIndex !== -1) {
      const beforeInsert = configContent.substring(0, insertIndex)
      const afterInsert = configContent.substring(insertIndex)
      
      configContent = beforeInsert + 
        `// Manual override for ngrok/production\n  baseUrl = '${newUrl}'\n  \n  ` + 
        afterInsert
      console.log('✅ Added new baseUrl override')
    } else {
      console.error('❌ Could not find insertion point in config file')
      process.exit(1)
    }
  }

  // Write updated config
  fs.writeFileSync(configPath, configContent)
  
  console.log('📡 Webhook URL updated to:', newUrl)
  console.log('📁 Updated file:', configPath)
  console.log('')
  console.log('🔄 Next steps:')
  console.log('1. Restart your React dev server if running')
  console.log('2. Update your Vapi assistant webhook URL to:')
  console.log(`   ${newUrl}/api/whiteboard-update`)
}

// Get URL from command line argument
const newUrl = process.argv[2]
updateWebhookUrl(newUrl) 