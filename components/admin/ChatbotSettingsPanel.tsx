"use client"

import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getChatbotSettings, saveChatbotSettings, type ChatbotSettings, getFaqQAs, addFaqQA, removeFaqQA, type FaqQA, type ChatbotCategory, getCategories, addCategory, updateCategoryLocal, removeCategoryLocal } from '@/lib/chatbotSettings'
import { fetchChatbotSettings, updateChatbotSettings, fetchQAs, createQA, deleteQA as apiDeleteQA, fetchCategories, createCategory as apiCreateCategory, updateCategory as apiUpdateCategory, deleteCategory as apiDeleteCategory } from '@/lib/api/chatbot'
import { Trash2 } from 'lucide-react'

function generateId() {
    return Math.random().toString(36).slice(2, 10)
}

export default function ChatbotSettingsPanel() {
    const [settings, setSettings] = useState<ChatbotSettings>(() => getChatbotSettings())
    const [saved, setSaved] = useState<null | 'saved' | 'error'>(null)
  const [qas, setQas] = useState<FaqQA[]>(() => getFaqQAs())
  const [qaForm, setQaForm] = useState<{ question: string; answer: string; categoryId?: string }>({ question: '', answer: '', categoryId: undefined })
  const [categories, setCategories] = useState<ChatbotCategory[]>(() => getCategories())
  const [catForm, setCatForm] = useState<{ id?: string; name: string }>({ name: '' })

  // Load from backend on mount when API configured
  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        if (process.env.NEXT_PUBLIC_API_URL) {
          const [s, q, c] = await Promise.all([
            fetchChatbotSettings().catch(() => null),
            fetchQAs().catch(() => []),
            fetchCategories().catch(() => []),
          ])
          if (cancelled) return
          if (s) setSettings(s)
          if (Array.isArray(q)) setQas(q as any)
          if (Array.isArray(c)) setCategories(c as any)
        }
      } catch (_) { }
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

  async function handleAddQA() {
        const question = qaForm.question.trim()
        const answer = qaForm.answer.trim()
    if (!question) {
      toast.error('Question is required')
      return
    }
    if (!answer) {
      toast.error('Answer is required')
      return
    }
    if (!qaForm.categoryId) {
      toast.error('Please select a category')
      return
    }
    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        await createQA({ question, answer, categoryId: qaForm.categoryId })
        setQas(await fetchQAs())
      } else {
        const qa: FaqQA = { id: generateId(), question, answer, categoryId: qaForm.categoryId }
        addFaqQA(qa)
        setQas(getFaqQAs())
      }
      setQaForm({ question: '', answer: '', categoryId: undefined })
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

  // Check if a category has any linked questions
  const hasLinkedQuestions = (categoryId: string) => {
    return qas.some(qa => qa.categoryId === categoryId)
  }

  // Handle category deletion with validation
  const handleDeleteCategory = async (category: ChatbotCategory) => {
    const categoryId = (category._id || category.id) as string
    
    // Check if category has linked questions
    if (hasLinkedQuestions(categoryId)) {
      toast.error('Cannot delete category with linked questions. Please remove or reassign questions first.')
      return
    }

    try {
      if (process.env.NEXT_PUBLIC_API_URL) {
        await apiDeleteCategory(categoryId)
        setCategories(await fetchCategories())
      } else {
        removeCategoryLocal(categoryId)
        setCategories(getCategories())
      }
      toast.success('Category deleted')
    } catch (_) {
      toast.error('Failed to delete category')
    }
  }

    return (
        <div className="space-y-6 w-full">
            <div className="space-y-6">

                <div className="rounded-xl bg-white shadow-sm border border-purple-200/50">
          <div className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-purple-50 to-white rounded-t-xl border-b border-purple-100">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Bot Identity & Conversation</h2>
              <p className="text-xs text-gray-500">Configure appearance and default messages</p>
            </div>
            <Button onClick={handleSave} className="ml-auto bg-purple-700 hover:bg-purple-800 text-white">Save</Button>
                    </div>
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

            <div className="space-y-4">
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
            </div>
          </div>
        </div>
        {/* Categories Container */}
        <div className="rounded-xl bg-white shadow-sm border border-purple-200/50">
          <div className="border-b border-purple-100 px-5 py-4 bg-gradient-to-r from-purple-50 to-white rounded-t-xl">
            <h2 className="text-base font-semibold text-gray-800">Q&A Categories</h2>
            <p className="text-xs text-gray-500">Create and manage categories to organize questions.</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-2">
              <Input value={catForm.name} placeholder="Category name" onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
              <Button
                onClick={async () => {
                  const name = catForm.name.trim()
                  if (!name) return
                  try {
                    if (process.env.NEXT_PUBLIC_API_URL) {
                      if (catForm.id) {
                        await apiUpdateCategory(catForm.id, { name })
                      } else {
                        await apiCreateCategory({ name })
                      }
                      setCategories(await fetchCategories())
                    } else {
                      if (catForm.id) {
                        updateCategoryLocal(catForm.id, name)
                      } else {
                        addCategory({ id: generateId(), name })
                      }
                      setCategories(getCategories())
                    }
                    setCatForm({ id: undefined, name: '' })
                    toast.success('Saved')
                  } catch (_) {
                    toast.error('Failed to save category')
                  }
                }}
                className="bg-purple-700 hover:bg-purple-800 text-white"
              >
                {catForm.id ? 'Update' : 'Add'}
              </Button>
            </div>
            <div className="space-y-2">
              {categories.length === 0 ? (
                <div className="p-6 border border-dashed border-purple-200/70 rounded-lg text-center bg-purple-50/40">
                  <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-purple-700">📁</div>
                  <div className="text-sm font-semibold text-gray-800">No categories yet</div>
                  <div className="text-xs text-gray-500 mt-1">Create your first category to organize Q&A topics.</div>
                </div>
              ) : (
                categories.map((c, idx) => {
                  const categoryId = (c._id || c.id) as string
                  const hasQuestions = hasLinkedQuestions(categoryId)
                  
                  return (
                    <div key={categoryId || idx} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-800">{c.name}</div>
                        {hasQuestions && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {qas.filter(qa => qa.categoryId === categoryId).length} Questions
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCatForm({ id: categoryId, name: c.name })}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(c)}
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                          title={hasQuestions ? "Cannot delete category with linked questions" : "Delete category"}
                          aria-label={hasQuestions ? "Cannot delete category with linked questions" : "Delete category"}
                          disabled={hasQuestions}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
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
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  className="border rounded h-10 px-3 w-full"
                  value={qaForm.categoryId || ''}
                  onChange={e => setQaForm({ ...qaForm, categoryId: e.target.value || undefined })}
                  aria-label="Select category"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={(c._id || c.id) as string} value={(c._id || c.id) as string}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Button onClick={handleAddQA} className="bg-purple-700 hover:bg-purple-800 text-white">Add Q&A</Button>
              </div>
            </div>
            <div className="space-y-2">
              {qas.length === 0 ? (
                <div className="p-6 border border-dashed border-purple-200/70 rounded-lg text-center bg-purple-50/40">
                  <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-purple-700">💬</div>
                  <div className="text-sm font-semibold text-gray-800">No Q&A added yet</div>
                  <div className="text-xs text-gray-500 mt-1">Add answers to common questions and assign a category.</div>
                </div>
              ) : (
                qas.map((q, idx) => (
                  <div key={q._id || q.id || idx} className="flex items-start justify-between border rounded-lg p-3">
                    <div className="pr-3">
                      <div className="text-sm font-semibold text-gray-800">Q: {q.question}</div>
                      <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">A: {q.answer}</div>
                      {q.categoryId && (
                        <div className="text-xs text-gray-500 mt-2">
                          Category: {categories.find(c => (c._id || c.id) === q.categoryId)?.name || 'Unknown'}
                        </div>
                      )}
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
      </div>
    </div>
  )
}