import { API_URL } from '@/lib/config'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import type { ChatbotSettings, FaqDoc, FaqQA } from '@/lib/chatbotSettings'

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

export async function createQA(payload: { question: string; answer: string }): Promise<FaqQA> {
  return apiPost(`${base}/qas`, payload)
}

export async function deleteQA(id: string): Promise<{ success: boolean }> {
  return apiDelete(`${base}/qas/${id}`)
}

export async function fetchDocs(): Promise<FaqDoc[]> {
  return apiGet(`${base}/docs`)
}

export async function uploadDocText(payload: { filename: string; content: string; url?: string }): Promise<FaqDoc> {
  return apiPost(`${base}/docs`, payload)
}

export async function deleteDocById(id: string): Promise<{ success: boolean }> {
  return apiDelete(`${base}/docs/${id}`)
}


