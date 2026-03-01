import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// AI Configuration Initialization from Environment Variables
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const apiBase = import.meta.env.VITE_OPENAI_API_BASE

  if (apiKey) {
    const models = JSON.parse(localStorage.getItem('ai_models') || '[]')
    const onboardedModelId = 'onboarded-openai'
    const existingModelIndex = models.findIndex(m => m.id === onboardedModelId)

    const modelData = {
      id: onboardedModelId,
      name: 'OpenAI (Auto-configured)',
      type: 'openai',
      url: apiBase || 'https://api.openai.com/v1',
      apiKey: apiKey,
      modelName: 'gpt-4o-mini'
    }

    if (existingModelIndex !== -1) {
      // Update existing model if environment variable changed
      if (models[existingModelIndex].apiKey !== apiKey || models[existingModelIndex].url !== apiBase) {
        models[existingModelIndex] = modelData
        localStorage.setItem('ai_models', JSON.stringify(models))
      }
    } else {
      // Add new model
      models.push(modelData)
      localStorage.setItem('ai_models', JSON.stringify(models))
    }
    
    // Set as default if no default is set
    if (!localStorage.getItem('ai_default_model')) {
      localStorage.setItem('ai_default_model', onboardedModelId)
    }
  }
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')