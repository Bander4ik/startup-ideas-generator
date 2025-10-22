import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Встановлення токену з localStorage при ініціалізації
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Функція для встановлення токену
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Ideas API
export const ideasApi = {
  generate: (topic) => api.post('/ideas/generate', { topic }),
  generateGuest: (topic) => api.post('/guest/generate', { topic }),
  getAll: (savedOnly = false) => api.get('/ideas', { params: { saved_only: savedOnly } }),
  getById: (id) => api.get(`/ideas/${id}`),
  update: (id, data) => api.patch(`/ideas/${id}`, data),
  delete: (id) => api.delete(`/ideas/${id}`),
  addFeedback: (id, feedbackType, comment) => 
    api.post(`/ideas/${id}/feedback`, { feedback_type: feedbackType, comment }),
}

// Chat API
export const chatApi = {
  sendMessage: (message, ideaId = null) => 
    api.post('/chat', { message, idea_id: ideaId }),
  getHistory: (ideaId = null) => 
    api.get('/chat/history', { params: { idea_id: ideaId } }),
  clearHistory: (ideaId = null) => 
    api.delete('/chat/history', { params: { idea_id: ideaId } }),
}

// Punctuation API
export const punctuationApi = {
  addPunctuation: (text) => api.post('/punctuation/add', { text }),
}

export default api
