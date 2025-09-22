export type ChatbotSettings = {
  botName: string
  iconType: 'emoji' | 'image'
  iconEmoji?: string
  iconUrl?: string
  primaryColor?: string
  greetingMessage?: string
  followUpMessage?: string
  fallbackMessage?: string
}

export type FaqDoc = {
  _id?: string
  id: string
  filename: string
  content: string
  url?: string
}

export type FaqQA = {
  _id?: string
  id: string
  question: string
  answer: string
}

const SETTINGS_KEY = 'bx_chatbot_settings'
const FAQ_DOCS_KEY = 'bx_chatbot_docs'
const FAQ_QAS_KEY = 'bx_chatbot_qas'

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function getChatbotSettings(): ChatbotSettings {
  return safeParse<ChatbotSettings>(
    typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null,
    {
      botName: 'BazarBot',
      iconType: 'emoji',
      iconEmoji: '🤖',
      primaryColor: '#111827',
      greetingMessage: "Hi! I'm BazarBot. How can I assist you today?",
      followUpMessage: 'Do you need help regarding Orders, Refunds, or Other?',
      fallbackMessage: "Sorry, I didn't get that. You can ask about orders, refunds, or FAQs.",
    }
  )
}

export function saveChatbotSettings(settings: ChatbotSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new StorageEvent('storage', { key: SETTINGS_KEY }))
}

export function getFaqDocs(): FaqDoc[] {
  return safeParse<FaqDoc[]>(
    typeof window !== 'undefined' ? localStorage.getItem(FAQ_DOCS_KEY) : null,
    []
  )
}

export function addFaqDoc(doc: FaqDoc) {
  if (typeof window === 'undefined') return
  const docs = getFaqDocs()
  const next = [...docs, doc]
  localStorage.setItem(FAQ_DOCS_KEY, JSON.stringify(next))
  window.dispatchEvent(new StorageEvent('storage', { key: FAQ_DOCS_KEY }))
}

export function removeFaqDoc(id: string) {
  if (typeof window === 'undefined') return
  const docs = getFaqDocs().filter(d => d.id !== id)
  localStorage.setItem(FAQ_DOCS_KEY, JSON.stringify(docs))
  window.dispatchEvent(new StorageEvent('storage', { key: FAQ_DOCS_KEY }))
}

export function getFaqQAs(): FaqQA[] {
  return safeParse<FaqQA[]>(
    typeof window !== 'undefined' ? localStorage.getItem(FAQ_QAS_KEY) : null,
    []
  )
}

export function addFaqQA(qa: FaqQA) {
  if (typeof window === 'undefined') return
  const qas = getFaqQAs()
  const next = [...qas, qa]
  localStorage.setItem(FAQ_QAS_KEY, JSON.stringify(next))
  window.dispatchEvent(new StorageEvent('storage', { key: FAQ_QAS_KEY }))
}

export function removeFaqQA(id: string) {
  if (typeof window === 'undefined') return
  const qas = getFaqQAs().filter(q => q.id !== id)
  localStorage.setItem(FAQ_QAS_KEY, JSON.stringify(qas))
  window.dispatchEvent(new StorageEvent('storage', { key: FAQ_QAS_KEY }))
}


