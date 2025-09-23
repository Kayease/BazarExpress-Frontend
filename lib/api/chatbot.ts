import { API_URL } from '@/lib/config'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import type { ChatbotSettings, FaqQA, ChatbotCategory } from '@/lib/chatbotSettings'

const base = `${API_URL}/chatbot`

export async function fetchChatbotSettings(): Promise<ChatbotSettings> {
  return apiGet(`${base}/settings`)
}

export async function updateChatbotSettings(settings: ChatbotSettings): Promise<ChatbotSettings> {
  return apiPut(`${base}/settings`, settings)
}

export async function fetchQAs(): Promise<FaqQA[]> {
  return apiGet(`${base}/qas`)
}

export async function createQA(payload: { question: string; answer: string; categoryId?: string }): Promise<FaqQA> {
  return apiPost(`${base}/qas`, payload)
}

export async function deleteQA(id: string): Promise<{ success: boolean }> {
  return apiDelete(`${base}/qas/${id}`)
}

// FAQ Documents API removed

// Categories
export async function fetchCategories(): Promise<ChatbotCategory[]> {
  return apiGet(`${base}/categories`)
}

export async function createCategory(payload: { name: string }): Promise<ChatbotCategory> {
  return apiPost(`${base}/categories`, payload)
}

export async function updateCategory(id: string, payload: { name: string }): Promise<ChatbotCategory> {
  return apiPut(`${base}/categories/${id}`, payload)
}

export async function deleteCategory(id: string): Promise<{ success: boolean }> {
  return apiDelete(`${base}/categories/${id}`)
}


