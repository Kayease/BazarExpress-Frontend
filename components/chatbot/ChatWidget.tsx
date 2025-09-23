"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getChatbotSettings, saveChatbotSettings, type ChatbotSettings, getFaqQAs, type FaqQA, type ChatbotCategory } from '@/lib/chatbotSettings'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, ChevronRight, ChevronDown, CheckCheck } from 'lucide-react'
import { fetchChatbotSettings, fetchQAs, fetchCategories } from '@/lib/api/chatbot'

type ChatMessage = {
  id: string
  role: 'user' | 'bot'
  content: string
  createdAt: number
}

type ConversationMode = 'idle' | 'orders' | 'refunds' | 'other'

function useChatbotConfig(): ChatbotSettings {
  const [settings, setSettings] = useState<ChatbotSettings>(() => getChatbotSettings())
  useEffect(() => {
    const handler = () => setSettings(getChatbotSettings())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])
  return settings
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenize(text: string): Set<string> {
  return new Set(normalize(text).split(' ').filter(Boolean))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter(x => b.has(x))).size
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

export default function ChatWidget() {
  const pathname = usePathname()
  return pathname === '/contact' ? <ChatWidgetInner /> : null
}

function ChatWidgetInner() {
  const settings = useChatbotConfig()
  const [serverSettings, setServerSettings] = useState<ChatbotSettings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(!process.env.NEXT_PUBLIC_API_URL)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<ConversationMode>('idle')
  const [awaitingOrderId, setAwaitingOrderId] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [qaItems, setQaItems] = useState<FaqQA[]>(process.env.NEXT_PUBLIC_API_URL ? [] : getFaqQAs())
  const [categories, setCategories] = useState<ChatbotCategory[]>([])
  const [categoryPageStart, setCategoryPageStart] = useState<number>(0)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [otherView, setOtherView] = useState<'categories' | 'questions' | 'post_answer'>('categories')
  const [showOptions, setShowOptions] = useState(false)
  const [postAnswerOrigin, setPostAnswerOrigin] = useState<'orders' | 'refunds' | 'return' | 'other' | null>(null)

  const activeSettings: ChatbotSettings = serverSettings || settings

  // Refresh settings from backend when widget opens (if API configured)
  useEffect(() => {
    async function load() {
      try {
        if (process.env.NEXT_PUBLIC_API_URL) {
          const s = await fetchChatbotSettings()
          setServerSettings(s)
          setSettingsLoaded(true)
        }
      } catch (_) {}
    }
    if (open) load()
  }, [open])

  // Load once on mount so the widget shows server-configured branding immediately
  useEffect(() => {
    let cancelled = false
    async function loadInitial() {
      try {
        if (process.env.NEXT_PUBLIC_API_URL) {
          const [s, qas, cats] = await Promise.all([
            fetchChatbotSettings(),
            fetchQAs().catch(() => []),
            fetchCategories().catch(() => []),
          ])
          if (cancelled) return
          setServerSettings(s)
          setSettingsLoaded(true)
          setQaItems(qas as FaqQA[])
          setCategories(cats as ChatbotCategory[])
        }
      } catch (_) {
        setSettingsLoaded(true)
      }
    }
    loadInitial()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!open) return
    if (messages.length === 0) {
      const greeting = activeSettings.greetingMessage || `Hi! I'm ${activeSettings.botName}. How can I assist you today?`
      const followUp = activeSettings.followUpMessage || 'Please choose an option to get started: Orders, Refunds, Returns, or Other.'
      // Show typing dots briefly before first messages
      setIsTyping(true)
      const t = setTimeout(() => {
        const now = Date.now()
        setMessages([
          { id: generateId(), role: 'bot', content: greeting, createdAt: now },
          { id: generateId(), role: 'bot', content: followUp, createdAt: now },
        ])
        setShowOptions(true)
        setIsTyping(false)
      }, 600)
      return () => clearTimeout(t)
    }
  }, [open, activeSettings, messages.length])

  // Close on outside click (outside card and trigger button)
  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (!open) return
      const target = e.target as Node
      if (cardRef.current && cardRef.current.contains(target)) return
      if (triggerRef.current && triggerRef.current.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open])

  // Lock background scroll when widget is open
  useEffect(() => {
    if (!open) return
    const { body, documentElement } = document
    const scrollY = window.scrollY || window.pageYOffset
    const prev = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      touchAction: body.style.touchAction,
      htmlOverscroll: documentElement.style.overscrollBehavior,
    }

    // Compensate desktop scrollbar to avoid layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.touchAction = 'none'
    documentElement.style.overscrollBehavior = 'none'

    return () => {
      body.style.overflow = prev.overflow
      body.style.paddingRight = prev.paddingRight
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.touchAction = prev.touchAction
      documentElement.style.overscrollBehavior = prev.htmlOverscroll
      // restore scroll position
      const y = Math.abs(parseInt(prev.top || '0', 10)) || scrollY
      window.scrollTo(0, y)
    }
  }, [open])

  const quickOptions = useMemo(() => ['Orders', 'Refunds', 'Return', 'Other'], [])
  const showQuickOptions = open && mode === 'idle' && !awaitingOrderId && showOptions

  function handleUserSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setShowOptions(false)
    const next: ChatMessage[] = [...messages, { id: generateId(), role: 'user', content: trimmed, createdAt: Date.now() }]
    setMessages(next)
    respond(trimmed, next)
    setInput('')
  }

  function handleQuickSelection(option: string) {
    setShowOptions(false)
    // Echo the user's choice into the chat
  setMessages(prev => [...prev, { id: generateId(), role: 'user', content: option, createdAt: Date.now() }])
    // Hide quick options after selection
    if (option === 'Orders') {
      setMode('orders')
      setAwaitingOrderId(true)
      botReply('Sure—please share your Order ID (e.g., ORD-00000000-UVWXYZ).', 200)
      return
    }
    if (option === 'Refunds') {
      setMode('refunds')
      setAwaitingOrderId(true)
      botReply('For refunds/returns, please provide your Return ID (e.g., RET-00000000-UVWXYZ).', 200)
      botReply('You can initiate a return from <a href="/account?tab=orders" class="underline text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Orders</a> after delivery if the item is eligible. Share your Return ID (e.g., RET-00000000-UVWXYZ) to check status.', 300)
      return
    }
    if (option === 'Return') {
      botReply('You can initiate a return from <a href="/account?tab=orders" class="underline text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Orders</a> once the order is delivered and eligible for return.', 200)
      // After guidance, show post-answer prompt instead of main options
      setMode('other')
      setOtherView('post_answer')
      setPostAnswerOrigin('orders')
      setShowOptions(false)
      return
    }
    if (option === 'Other') {
      // Enter Other flow; only snapshot after the next specific selection
      setMode('other')
      setOtherView('categories')
      setCategoryPageStart(0)
      setSelectedCategoryId(null)
      return
    }
  }

  function respond(userText: string, current: ChatMessage[]) {
    const lower = userText.toLowerCase()
    const foundOrder = findOrderId(userText)
    const foundReturn = findReturnId(userText)

    // Handle awaiting order id
    if (awaitingOrderId) {
      setAwaitingOrderId(false)
      if (mode === 'orders') {
        const raw = userText.trim()
        const parsed = foundOrder || parseOrderId(raw)
        if (!parsed) {
          botReply('That Order ID appears invalid. It should look like ORD-00000000-UVWXYZ. Please double-check and try again.', 200)
          return
        }
        handleOrderLookup(parsed)
        return
      }
      if (mode === 'refunds') {
        const raw = userText.trim()
        const parsedReturn = foundReturn || parseReturnId(raw)
        if (parsedReturn) {
          handleReturnLookup(parsedReturn)
          return
        }
        const parsedOrder = foundOrder || parseOrderId(raw)
        if (parsedOrder) {
          botReply('I detected an Order ID. To initiate or track a return, open <a href="/account" class="underline  text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Orders</a>, select the order, and choose Return/Refund. If you already have a Return ID (RET-00000000-UVWXYZ), share that and I’ll check its status.', 200)
          return
        }
        botReply('That reference looks incorrect. For returns, please provide a Return ID like RET-00000000-UVWXYZ.', 200)
        return
      }
    }

    // If an ID is mentioned even without prompting, handle immediately
    if (foundOrder) {
      setMode('orders')
      handleOrderLookup(foundOrder)
      return
    }
    if (foundReturn) {
      setMode('refunds')
      handleReturnLookup(foundReturn)
      return
    }

    // Branching flows
    if (lower === 'other') {
      setMode('other')
      setOtherView('categories')
      setCategoryPageStart(0)
      setSelectedCategoryId(null)
      return
    }
    if (lower === 'return') {
      botReply('You can initiate a return from <a href="/account?tab=orders" class="underline text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Orders</a> once your order is delivered and eligible for return.', 250)
      setMode('other')
      setOtherView('post_answer')
      setPostAnswerOrigin('refunds')
      setShowOptions(false)
      return
    }
    if (lower.includes('order')) {
      setMode('orders')
      setAwaitingOrderId(true)
      botReply('Sure—please share your Order ID (e.g., ORD-00000000-UVWXYZ).', 300)
      return
    }
    if (lower.includes('refund') || lower.includes('return')) {
      setMode('refunds')
      setAwaitingOrderId(true)
      botReply('For refunds/returns, please provide your Return ID (e.g., RET-00000000-UVWXYZ).', 250)
      botReply('You can initiate a return from <a href="/account?tab=orders" class="underline  text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Orders</a> after delivery if the item is eligible. Share your Return ID (e.g., RET-00000000-UVWXYZ) to check status.', 350)
      return
    }

    // Q&A lookup then docs
    const qaAns = searchQAsLocalOrServer(lower)
    if (qaAns) {
      botReply(qaAns, 250)
      return
    }
    // Documents search removed

    botReply(activeSettings.fallbackMessage || "I'm not sure about that. Try asking about orders, refunds, or general info.", 250)
    setMode('idle')
    setTimeout(() => setShowOptions(true), 250)
  }

  function enqueue(content: string) {
    setMessages(prev => [...prev, { id: generateId(), role: 'bot', content, createdAt: Date.now() }])
  }

  // (CTA row removed by request; we now include inline links in bot messages.)

  function botReply(content: string, delayMs = 800, showTyping: boolean = true) {
    if (showTyping) setIsTyping(true)
    setTimeout(() => {
      enqueue(content)
      if (showTyping) setIsTyping(false)
    }, delayMs)
  }

  // Helpers to snapshot the options the user saw into the chat (no typing indicator)
  function buildCategoriesContent(startIndex: number = categoryPageStart): string {
    const slice = categories.slice(startIndex, startIndex + 5)
    const lines: string[] = []
    lines.push(`Sure, what's your question about?`)
    lines.push('')
    for (const c of slice) {
      lines.push(c.name)
    }
    lines.push('Go Back')
    if (startIndex + 5 < categories.length) {
      lines.push('Load More...')
    }
    return lines.join('<br/>')
  }

  function snapshotCategoriesToChat(startIndex?: number) {
    const content = buildCategoriesContent(typeof startIndex === 'number' ? startIndex : categoryPageStart)
    // Post immediately without typing
    enqueue(content)
  }

  function buildQuestionsContent(categoryId: string): string {
    const items = qaItems.filter(q => (q as any).categoryId === categoryId)
    const lines: string[] = []
    lines.push('Sure, what\'s your question about?')
    lines.push('')
    for (const q of items) {
      lines.push(q.question)
    }
    lines.push('Go Back')
    return lines.join('<br/>')
  }

  function snapshotQuestionsToChat(categoryId: string) {
    const content = buildQuestionsContent(categoryId)
    enqueue(content)
  }

  function formatTime(ts: number): string {
    try {
      const d = new Date(ts)
      const hours = d.getHours()
      const minutes = d.getMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'pm' : 'am'
      const h12 = ((hours + 11) % 12) + 1
      return `${h12}:${minutes} ${ampm}`
    } catch {
      return ''
    }
  }

  // Auto-scroll to bottom when messages or typing indicator changes
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isTyping, open])

  // ===== Validation and lookups for ORD-/RET- ids =====
  function parseOrderId(input: string): string | null {
    const s = input.trim().toUpperCase()
    const m = s.match(/^ORD-\d{8}-[A-Z0-9]{6}$/)
    return m ? m[0] : null
  }

  function parseReturnId(input: string): string | null {
    const s = input.trim().toUpperCase()
    const m = s.match(/^RET-\d{8}-[A-Z0-9]{6}$/)
    return m ? m[0] : null
  }

  function findOrderId(input: string): string | null {
    return canonicalizeIdLoose(input, 'ORD')
  }

  function findReturnId(input: string): string | null {
    return canonicalizeIdLoose(input, 'RET')
  }

  function canonicalizeIdLoose(input: string, prefix: 'ORD' | 'RET'): string | null {
    const upper = input.toUpperCase()
    const idx = upper.indexOf(prefix)
    if (idx === -1) return null
    // Take a tail of reasonable length after the prefix to scan
    const tail = upper.slice(idx + prefix.length, idx + prefix.length + 40)
    // Collect exactly 8 digits, then 6 alnum, ignoring any non-alnum separators
    let digits = ''
    let code = ''
    for (const ch of tail) {
      if (digits.length < 8) {
        if (ch >= '0' && ch <= '9') digits += ch
      } else if (code.length < 6) {
        if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) code += ch
      } else {
        break
      }
    }
    if (digits.length === 8 && code.length === 6) {
      return `${prefix}-${digits}-${code}`
    }
    return null
  }

  function formatStatusWord(s: any): string {
    const str = typeof s === 'string' ? s : String(s || '')
    if (!str) return 'Processing'
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  async function handleOrderLookup(orderId: string) {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      botReply(`To view details for ${orderId}, please sign in and try again. You can also see all orders under <a href="/account" class="underline  text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Orders</a>.`, 200)
      setMode('other')
      setOtherView('post_answer')
      setShowOptions(false)
      return
    }
    botReply(`Checking status for ${orderId} ...`, 200)
    try {
      const res = await fetch(`${api}/orders/order/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (res.status === 404) {
        botReply(`I couldn’t find an order with ID ${orderId}. Please confirm the ID and try again. If you recently placed it, it may take a minute to appear.`, 200)
        setMode('other')
        setOtherView('post_answer')
        setPostAnswerOrigin('orders')
        setShowOptions(false)
        return
      }
      if (res.status === 403) {
        botReply(`This order doesn’t belong to the signed-in account. Please ensure you’re signed in with the correct account.`, 200)
        setMode('other')
        setOtherView('post_answer')
        setPostAnswerOrigin('orders')
        setShowOptions(false)
        return
      }
      if (!res.ok) {
        botReply(`Sorry, I couldn’t retrieve that order right now. Please try again in a moment.`, 200)
        setMode('other')
        setOtherView('post_answer')
        setPostAnswerOrigin('refunds')
        setShowOptions(false)
        return
      }
      const json = await res.json()
      const order = json?.order
      const status = formatStatusWord(order?.status || order?.currentStatus)
      const placed = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : undefined
      const eta = order?.estimatedDelivery || order?.eta
      let line = `Order ${orderId} — Status: ${status}.`
      if (placed) line += ` Order Placed on ${placed}.`
      if (eta) line += ` Estimated delivery: ${eta}.`
      botReply(line, 150)
      botReply('You can see complete details under <a href="/account?tab=orders" class="underline  text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Orders</a>.', 200)
      setMode('other')
      setOtherView('post_answer')
      setPostAnswerOrigin('orders')
      setShowOptions(false)
    } catch (_) {
      botReply(`Sorry, something went wrong while checking that order. Please try again.`, 200)
      setMode('other')
      setOtherView('post_answer')
      setPostAnswerOrigin('orders')
      setShowOptions(false)
    }
  }

  async function handleReturnLookup(returnId: string) {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      botReply(`To view details for ${returnId}, please sign in and try again. You can manage returns under <a href="/account" class="underline  text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Orders</a>.`, 200)
      setMode('other')
      setOtherView('post_answer')
      setShowOptions(false)
      return
    }
    botReply(`Checking return ${returnId} ...`, 200)
    try {
      const res = await fetch(`${api}/returns/${returnId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (res.status === 404) {
        botReply(`I couldn’t find a return with ID ${returnId}. Please verify the Return ID (e.g., RET-00000000-UVWXYZ) and try again.`, 200)
        setMode('other')
        setOtherView('post_answer')
        setPostAnswerOrigin('refunds')
        setShowOptions(false)
        return
      }
      if (res.status === 403) {
        botReply(`This return doesn’t belong to the signed-in account. Please ensure you’re signed in with the correct account.`, 200)
        setMode('other')
        setOtherView('post_answer')
        setShowOptions(false)
        return
      }
      if (!res.ok) {
        botReply(`Sorry, I couldn’t retrieve that return right now. Please try again in a moment.`, 200)
        setMode('other')
        setOtherView('post_answer')
        setShowOptions(false)
        return
      }
      const json = await res.json()
      const ret = json?.returnRequest
      const status = formatStatusWord(ret?.status || 'Pending')
      const created = ret?.createdAt ? new Date(ret.createdAt).toLocaleDateString() : undefined
      let line = `Return ${returnId} — Status: ${status}.`
      if (created) line += ` Created on ${created}.`
      // Basic guidance
      botReply(line, 150)
      botReply('You can view full details under <a href="/account?tab=returns" class="underline text-brand-primary hover:text-brand-primary-dark" target="_self" rel="noopener">Account → Returns</a>.', 200)
      setMode('other')
      setOtherView('post_answer')
      setPostAnswerOrigin('refunds')
      setShowOptions(false)
    } catch (_) {
      botReply(`Sorry, something went wrong while checking that return. Please try again.`, 200)
      setMode('other')
      setOtherView('post_answer')
      setPostAnswerOrigin('refunds')
      setShowOptions(false)
    }
  }

  // Knowledge search that prefers backend data when available
  function searchQAsLocalOrServer(query: string): string | null {
    const q = normalize(query)
    // exact match
    const exact = qaItems.find(x => normalize(x.question) === q)
    if (exact) return exact.answer
    // best fuzzy by Jaccard
    const qTokens = tokenize(q)
    let best: { score: number; answer: string } | null = null
    for (const item of qaItems) {
      const score = jaccard(qTokens, tokenize(item.question))
      if (!best || score > best.score) best = { score, answer: item.answer }
    }
    return best && best.score >= 0.28 ? best.answer : null
  }

  // FAQ documents search removed

  return (
    <>
      {process.env.NEXT_PUBLIC_API_URL && !settingsLoaded ? null : null}
      {/* Floating Button */}
      <div
        className={
          cn(
            'fixed z-[9999] bottom-5 right-5 flex items-center justify-center rounded-full shadow-lg cursor-pointer',
            'transition-transform hover:scale-105',
          )
        }
        style={{ width: 56, height: 56, backgroundColor: activeSettings.primaryColor || '#111827' }}
        onClick={() => setOpen(v => !v)}
        aria-label="Open chatbot"
        ref={triggerRef}
      >
        {activeSettings.iconType === 'emoji' ? (
          <span style={{ fontSize: 24 }} aria-hidden>
            {activeSettings.iconEmoji || '🤖'}
          </span>
        ) : activeSettings.iconUrl ? (
          <img src={activeSettings.iconUrl} alt="Bot" style={{ width: 28, height: 28, borderRadius: 6 }} />
        ) : (
          <span style={{ fontSize: 24 }}>🤖</span>
        )}
      </div>

      {/* Chat Window */}
      {open && (
        <>
          {/* Transparent overlay to capture touch and prevent background scroll on mobile */}
          <div
            className="fixed inset-0 z-[9998]"
            style={{ touchAction: 'none' }}
            aria-hidden
            onClick={() => setOpen(false)}
          />
        <Card ref={cardRef} className="fixed z-[9999] bottom-20 right-5 w-[350px] h-[580px] flex flex-col overflow-hidden bg-black/5 backdrop-blur-lg border border-white/60 shadow-xl rounded-xl">
          <div className="flex items-center gap-2 px-3 py-2" style={{ background: activeSettings.primaryColor || '#111827', color: '#fff' }}>
            <div className="flex items-center justify-center w-6 h-6 rounded bg-white/10">
              {activeSettings.iconType === 'emoji' ? (
                <span style={{ fontSize: 14 }}>{activeSettings.iconEmoji || '🤖'}</span>
              ) : activeSettings.iconUrl ? (
                <img src={activeSettings.iconUrl} alt="Bot" className="w-4 h-4 rounded" />
              ) : (
                <span style={{ fontSize: 14 }}>🤖</span>
              )}
            </div>
            <div className="font-semibold text-sm">{activeSettings.botName || 'Assistant'}</div>
            <div className="ml-auto text-xs opacity-80">Online 🟢</div>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {messages.map(m => (
                <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {/* Bubble container for tail positioning */}
                  <div className="relative max-w-[80%]">
                    {m.role === 'user' ? (
                      <div className="relative">
                        <div
                          className={cn(
                            'px-3 py-2 rounded text-sm whitespace-pre-wrap border text-white',
                          )}
                          style={{ backgroundColor: activeSettings.primaryColor || '#111827', borderColor: 'transparent' }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: m.content }} />
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
                            <span>{formatTime(m.createdAt)}</span>
                            <CheckCheck className="h-3 w-3" />
                          </div>
                        </div>
                        {/* Right tail */}
                        <div
                          className="absolute -bottom-1 -right-1 w-2 h-2 rotate-45"
                          style={{ backgroundColor: activeSettings.primaryColor || '#111827' }}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <div
                          className={cn(
                            'px-3 py-2 rounded text-sm whitespace-pre-wrap border bg-white text-gray-900'
                          )}
                          style={{ borderColor: '#ffffff' }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: m.content }} />
                          <div className="mt-1 flex items-center justify-start gap-1 text-[10px] text-gray-500">
                            <span>{formatTime(m.createdAt)}</span>
                          </div>
                        </div>
                        {/* Left tail with border */}
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 rotate-45 bg-white border" style={{ borderColor: '#ffffff' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded text-sm max-w-[80%] border bg-gray-100 text-gray-900" style={{ borderColor: '#e5e7eb' }}>
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-500" style={{ animation: 'chatDots 1s infinite ease-in-out', animationDelay: '0ms' }}></span>
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-500" style={{ animation: 'chatDots 1s infinite ease-in-out', animationDelay: '150ms' }}></span>
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-500" style={{ animation: 'chatDots 1s infinite ease-in-out', animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="px-3 pb-2">
            {showQuickOptions && (
              <div className="flex gap-2 mb-2">
                {quickOptions.map(opt => (
                  <Button key={opt} variant="outline" size="sm" onClick={() => handleQuickSelection(opt)} className="rounded-full">
                    {opt}
                  </Button>
                ))}
              </div>
            )}
            {/* Guided Other flow: categories / questions / post-answer */}
            {mode === 'other' && otherView === 'categories' && (
              <div className="mb-2 space-y-2">
                <div className="text-xs text-gray-600">Sure, what's your question about?</div>
                <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-2">
                  <div className="flex flex-col gap-2">
                    {categories.slice(categoryPageStart, categoryPageStart + 5).map(c => (
                      <Button
                        key={(c._id || c.id) as string}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Snapshot the questions visible for this category
                          const cid = (c._id || c.id) as string
                          snapshotQuestionsToChat(cid)
                          // Record user selection
                          setMessages(prev => [...prev, { id: generateId(), role: 'user', content: c.name, createdAt: Date.now() }])
                          setSelectedCategoryId(cid)
                          setOtherView('questions')
                        }}
                        className="w-full justify-between rounded-lg border-purple-200 bg-white text-purple-600 hover:text-purple-700"
                      >
                        <span className="truncate text-left">{c.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between rounded-lg border-purple-200 bg-white text-purple-600 hover:text-purple-700"
                      onClick={() => {
                        // Snapshot current category list then record user action
                        snapshotCategoriesToChat(categoryPageStart)
                        setMessages(prev => [...prev, { id: generateId(), role: 'user', content: 'Go Back', createdAt: Date.now() }])
                        if (categoryPageStart > 0) {
                          const nextStart = Math.max(0, categoryPageStart - 5)
                          setCategoryPageStart(nextStart)
                        } else {
                          setMode('idle')
                          setShowOptions(true)
                        }
                      }}
                    >
                      <span>Go Back</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    {categoryPageStart + 5 < categories.length && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between rounded-lg border-purple-200 bg-white text-purple-600 hover:text-purple-700"
                        onClick={() => {
                          // Snapshot current view then record user action
                          snapshotCategoriesToChat(categoryPageStart)
                          setMessages(prev => [...prev, { id: generateId(), role: 'user', content: 'Load More...', createdAt: Date.now() }])
                          const nextStart = categoryPageStart + 5
                          setCategoryPageStart(nextStart)
                        }}
                      >
                        <span>Load More...</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    )}

                  </div>
                </div>
              </div>
            )}
            {mode === 'other' && otherView === 'questions' && selectedCategoryId && (
              <div className="mb-2 space-y-2">
                <div className="text-xs text-gray-600">Sure, what would you like to know?</div>
                <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-2">
                  <div className="flex flex-col gap-2">
                    {qaItems.filter(q => (q as any).categoryId === selectedCategoryId).map((q, idx) => (
                      <Button
                        key={(q._id || q.id || idx) as string}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Snapshot the questions list the user saw
                          if (selectedCategoryId) {
                            snapshotQuestionsToChat(selectedCategoryId)
                          }
                          // Record the user's chosen question, then answer
                          setMessages(prev => [...prev, { id: generateId(), role: 'user', content: q.question, createdAt: Date.now() }])
                          botReply(q.answer, 150)
                          setOtherView('post_answer')
                        }}
                        className="w-full justify-between rounded-lg border-purple-200 bg-white text-purple-600 hover:text-purple-700"
                      >
                        <span className="truncate text-left">{q.question}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                    {qaItems.filter(q => (q as any).categoryId === selectedCategoryId).length === 0 && (
                      <div className="text-xs text-gray-500">No questions in this category yet.</div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between rounded-lg border-purple-200 bg-white text-purple-600 hover:text-purple-700"
                      onClick={() => {
                        // Snapshot categories then record action
                        snapshotCategoriesToChat(0)
                        setMessages(prev => [...prev, { id: generateId(), role: 'user', content: 'Go Back', createdAt: Date.now() }])
                        setOtherView('categories');
                        setSelectedCategoryId(null);
                      }}
                    >
                      <span>Go Back</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {mode === 'other' && otherView === 'post_answer' && (
              <div className="mb-2 space-y-2">
                <div className="text-xs text-gray-500">Anything else I can help with?</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessages(prev => [...prev, { id: generateId(), role: 'user', content: 'Yes, I still need help', createdAt: Date.now() }])
                      if (postAnswerOrigin === 'orders' || postAnswerOrigin === 'refunds' || postAnswerOrigin === 'return') {
                        // Restart from beginning: show greeting + main options
                        const now = Date.now()
                        const followUp = activeSettings.followUpMessage || 'Please choose an option to get started: Orders, Refunds, Returns, or Other.'
                        setMessages(prev => [...prev, { id: generateId(), role: 'bot', content: followUp, createdAt: now }])
                        setMode('idle')
                        setShowOptions(true)
                        setOtherView('categories')
                        setCategoryPageStart(0)
                        setSelectedCategoryId(null)
                        setPostAnswerOrigin(null)
                      } else {
                        // Continue in Other flow from categories
                        setOtherView('categories')
                        setCategoryPageStart(0)
                        setSelectedCategoryId(null)
                        setPostAnswerOrigin(null)
                      }
                    }}
                  >
                    Yes, I still need help
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessages(prev => [...prev, { id: generateId(), role: 'user', content: "No, I'm done", createdAt: Date.now() }])
                      botReply('Bye!', 150)
                      setTimeout(() => setOpen(false), 800)
                      setMode('idle')
                      setShowOptions(true)
                      setOtherView('categories')
                      setCategoryPageStart(0)
                      setSelectedCategoryId(null)
                    }}
                  >
                    No, I'm done
                  </Button>
                </div>
              </div>
            )}
            {(mode === 'orders' || mode === 'refunds' || awaitingOrderId) && (
              <div className="flex gap-2 pb-3">
                <Input
                  ref={inputRef}
                  placeholder="Type your message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleUserSend(input)
                  }}
                />
                <Button onClick={() => handleUserSend(input)} size="icon" className="text-white" style={{ backgroundColor: activeSettings.primaryColor || '#111827' }} aria-label="Send message" title="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
        </>
      )}
      <style jsx>{`
        @keyframes chatDots {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-2px); opacity: 1; }
        }
      `}</style>
    </>
  )
}


