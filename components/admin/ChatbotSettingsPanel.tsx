"use client"

import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getChatbotSettings, saveChatbotSettings, type ChatbotSettings, addFaqDoc, getFaqDocs, removeFaqDoc, type FaqDoc, getFaqQAs, addFaqQA, removeFaqQA, type FaqQA } from '@/lib/chatbotSettings'
import { fetchChatbotSettings, updateChatbotSettings, fetchQAs, createQA, deleteQA as apiDeleteQA, fetchDocs, uploadDocText, deleteDocById } from '@/lib/api/chatbot'
import { Copy, Trash2 } from 'lucide-react'

function generateId() {
    return Math.random().toString(36).slice(2, 10)
}

export default function ChatbotSettingsPanel() {
    const [settings, setSettings] = useState<ChatbotSettings>(() => getChatbotSettings())
    const [docs, setDocs] = useState<FaqDoc[]>(() => getFaqDocs())
    const [uploading, setUploading] = useState(false)
    const [saved, setSaved] = useState<null | 'saved' | 'error'>(null)
  const [qas, setQas] = useState<FaqQA[]>(() => getFaqQAs())
    const [qaForm, setQaForm] = useState<{ question: string; answer: string }>({ question: '', answer: '' })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Load from backend on mount when API configured
  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        if (process.env.NEXT_PUBLIC_API_URL) {
          const [s, d, q] = await Promise.all([
            fetchChatbotSettings().catch(() => null),
            fetchDocs().catch(() => []),
            fetchQAs().catch(() => []),
          ])
          if (cancelled) return
          if (s) setSettings(s)
          if (Array.isArray(d)) setDocs(d as any)
          if (Array.isArray(q)) setQas(q as any)
        }
      } catch (_) {}
    }
    loadAll()
    return () => { cancelled = true }
  }, [])

  async function handleSave() {
        try {
      // Persist to backend if API is configured, else localStorage fallback
      if (process.env.NEXT_PUBLIC_API_URL) {
        const saved = await updateChatbotSettings(settings)
        setSettings(saved)
      } else {
        saveChatbotSettings(settings)
      }
            setSaved('saved')
      toast.success('Chatbot settings saved')
            setTimeout(() => setSaved(null), 1200)
        } catch {
            setSaved('error')
      toast.error('Failed to save settings')
            setTimeout(() => setSaved(null), 1200)
        }
    }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
    try {
      const text = await file.text()
      if (process.env.NEXT_PUBLIC_API_URL) {
        // Also upload the source file to Cloudinary if it's a local .md/.txt file user chose
        // Reuse existing Cloudinary helper if available
        let url: string | undefined
        try {
          const { uploadToCloudinary } = await import('@/lib/uploadToCloudinary')
          // Use a neutral folder name for docs
          url = await uploadToCloudinary(new File([text], file.name, { type: 'text/plain' }), 'chatbot/docs', { allowedTypes: ['image','video'] })
        } catch (_) {
          // ignore cloud upload failures; backend can store content
        }
        await uploadDocText({ filename: file.name, content: text, url })
        const reloaded = await fetchDocs()
        setDocs(reloaded)
      } else {
        const doc: FaqDoc = { id: generateId(), filename: file.name, content: text }
        addFaqDoc(doc)
        setDocs(getFaqDocs())
      }
      toast.success('Document uploaded')
    } catch (err) {
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    }

  async function deleteDoc(id: string) {
    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        await deleteDocById(id)
        setDocs(await fetchDocs())
      } else {
        removeFaqDoc(id)
        setDocs(getFaqDocs())
      }
      toast.success('Document deleted')
    } catch (e) {
      toast.error('Failed to delete document')
    }
    }

  async function handleAddQA() {
        const question = qaForm.question.trim()
        const answer = qaForm.answer.trim()
        if (!question || !answer) return
    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        await createQA({ question, answer })
        setQas(await fetchQAs())
      } else {
        const qa: FaqQA = { id: generateId(), question, answer }
        addFaqQA(qa)
        setQas(getFaqQAs())
      }
      setQaForm({ question: '', answer: '' })
      toast.success('Q&A added')
    } catch (e) {
      toast.error('Failed to add Q&A')
    }
    }

  async function deleteQA(id: string) {
    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        await apiDeleteQA(id)
        setQas(await fetchQAs())
      } else {
        removeFaqQA(id)
        setQas(getFaqQAs())
      }
      toast.success('Q&A deleted')
    } catch (e) {
      toast.error('Failed to delete Q&A')
    }
    }

    return (
        <div className="space-y-6 w-full">
            <div className="space-y-6">
                <div className="rounded-xl bg-white shadow-sm border border-purple-200/50">
                    <div className="border-b border-purple-100 px-5 py-4 bg-gradient-to-r from-purple-50 to-white rounded-t-xl">
                        <h2 className="text-base font-semibold text-gray-800">Bot Identity</h2>
                        <p className="text-xs text-gray-500">Name, icon, and color theme for the floating assistant</p>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Bot Name</label>
                            <Input value={settings.botName}
                                onChange={e => setSettings({ ...settings, botName: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <Input type="color" value={settings.primaryColor || '#111827'}
                                    onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} className="h-10 w-16 p-1" />
                                <div className="text-xs text-gray-500">Used for header background and button</div>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Icon Type</label>
                            <select className="border rounded h-10 px-3 w-full"
                                value={settings.iconType}
                                onChange={e => setSettings({ ...settings, iconType: e.target.value as ChatbotSettings['iconType'] })}
                            >
                                <option value="emoji">Emoji</option>
                                <option value="image">Image</option>
                            </select>
                        </div>
                        {settings.iconType === 'emoji' ? (
                            <div>
                                <label className="text-sm font-medium text-gray-700">Emoji</label>
                                <Input value={settings.iconEmoji || ''}
                                    placeholder="e.g., 🤖"
                                    onChange={e => setSettings({ ...settings, iconEmoji: e.target.value })} />
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm font-medium text-gray-700">Icon URL</label>
                                <Input value={settings.iconUrl || ''}
                                    placeholder="https://..."
                                    onChange={e => setSettings({ ...settings, iconUrl: e.target.value })} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl bg-white shadow-sm border border-purple-200/50">
                    <div className="border-b border-purple-100 px-5 py-4 bg-gradient-to-r from-purple-50 to-white rounded-t-xl">
                        <h2 className="text-base font-semibold text-gray-800">Conversation Messages</h2>
                        <p className="text-xs text-gray-500">Custom greeting, follow-up, and fallback messaging</p>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Greeting Message</label>
                            <Textarea value={settings.greetingMessage || ''}
                                onChange={e => setSettings({ ...settings, greetingMessage: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Follow-up Message</label>
                            <Textarea value={settings.followUpMessage || ''}
                                onChange={e => setSettings({ ...settings, followUpMessage: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Fallback Message</label>
                            <Textarea value={settings.fallbackMessage || ''}
                                onChange={e => setSettings({ ...settings, fallbackMessage: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div className="pt-2">
                            <Button onClick={handleSave} className="bg-purple-700 hover:bg-purple-800 text-white">
                                Save Messages
                            </Button>
                            {saved === 'saved' && <span className="ml-2 text-sm text-green-600 align-middle">Saved</span>}
                            {saved === 'error' && <span className="ml-2 text-sm text-red-600 align-middle">Failed</span>}
                        </div>
                    </div>
                </div>
                                {/* Q&A Container */}
                                <div className="rounded-xl bg-white shadow-sm border border-purple-200/50">
                    <div className="border-b border-purple-100 px-5 py-4 bg-gradient-to-r from-purple-50 to-white rounded-t-xl">
                        <h2 className="text-base font-semibold text-gray-800">Quick Q&A</h2>
                        <p className="text-xs text-gray-500">Add frequently asked questions with precise answers</p>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Question</label>
                            <Input value={qaForm.question} placeholder="e.g., What is your refund window?" onChange={e => setQaForm({ ...qaForm, question: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Answer</label>
                            <Textarea rows={3} value={qaForm.answer} placeholder="We offer refunds within 7 days of delivery..." onChange={e => setQaForm({ ...qaForm, answer: e.target.value })} />
                        </div>
                        <div>
                            <Button onClick={handleAddQA} className="bg-purple-700 hover:bg-purple-800 text-white">Add Q&A</Button>
                        </div>
                        <div className="space-y-2">
                            {qas.length === 0 ? (
                                <div className="text-sm text-gray-500">No Q&A added yet.</div>
                            ) : (
                qas.map((q, idx) => (
                  <div key={q._id || q.id || idx} className="flex items-start justify-between border rounded-lg p-3">
                                        <div className="pr-3">
                                            <div className="text-sm font-semibold text-gray-800">Q: {q.question}</div>
                                            <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">A: {q.answer}</div>
                                        </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteQA(q._id || q.id)}
                        title="Delete Q&A"
                        aria-label="Delete Q&A"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="rounded-xl bg-white shadow-sm border border-purple-200/50">
                    <div className="border-b border-purple-100 px-5 py-4 bg-gradient-to-r from-purple-50 to-white rounded-t-xl">
                        <h2 className="text-base font-semibold text-gray-800">FAQ Documents</h2>
                        <p className="text-xs text-gray-500">Upload .txt or .md policy files (refunds, returns, about)</p>
                    </div>
                    <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">These files power general queries within the chat.</div>
              <div className="inline-flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept=".txt,.md,.markdown,.mdown,.mkd" className="hidden" onChange={handleFileUpload} />
                <Button disabled={uploading} className="bg-purple-700 hover:bg-purple-800 text-white disabled:opacity-60" onClick={() => fileInputRef.current?.click()}>
                  {uploading ? 'Uploading...' : 'Upload Doc'}
                </Button>
              </div>
                        </div>
                        <div className="space-y-2">
              {docs.length === 0 ? (
                                <div className="text-sm text-gray-500 border border-dashed border-purple-200 rounded-lg p-4 text-center">No documents uploaded yet.</div>
                            ) : (
                docs.map((d, idx) => (
                  <div key={d._id || d.id || idx} className="flex items-center justify-between border rounded-lg p-3">
                                        <div className="text-sm font-medium text-gray-800">{d.filename}</div>
                                        <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigator.clipboard.writeText(d.content)}
                        title="Copy document"
                        aria-label="Copy document"
                        className="text-purple-700 hover:text-purple-800 hover:bg-purple-50"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDoc(d._id || d.id)}
                        title="Delete document"
                        aria-label="Delete document"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


