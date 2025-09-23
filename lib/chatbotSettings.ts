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

// FAQ Documents type removed

export type FaqQA = {
  _id?: string
  id: string
  question: string
  answer: string
  categoryId?: string
}
export type ChatbotCategory = {
  _id?: string
  id?: string
  name: string
}

const CATEGORY_KEY = 'bx_chatbot_categories'

const SETTINGS_KEY = 'bx_chatbot_settings'
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

// FAQ documents local storage helpers removed

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


export function getCategories(): ChatbotCategory[] {
  return safeParse<ChatbotCategory[]>(
    typeof window !== 'undefined' ? localStorage.getItem(CATEGORY_KEY) : null,
    []
  )
}

export function addCategory(cat: ChatbotCategory) {
  if (typeof window === 'undefined') return
  const cats = getCategories()
  const next = [...cats, cat]
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(next))
  window.dispatchEvent(new StorageEvent('storage', { key: CATEGORY_KEY }))
}

export function updateCategoryLocal(id: string, name: string) {
  if (typeof window === 'undefined') return
  const cats = getCategories().map(c => (c.id === id ? { ...c, name } : c))
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(cats))
  window.dispatchEvent(new StorageEvent('storage', { key: CATEGORY_KEY }))
}

export function removeCategoryLocal(id: string) {
  if (typeof window === 'undefined') return
  const cats = getCategories().filter(c => c.id !== id)
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(cats))
  window.dispatchEvent(new StorageEvent('storage', { key: CATEGORY_KEY }))
}
