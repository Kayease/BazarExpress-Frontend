"use client"

import React from 'react'
import AdminLayout from '@/components/AdminLayout'
import ChatbotSettingsPanel from '@/components/admin/ChatbotSettingsPanel'

export default function ChatbotAdminPage() {
  return (
    <AdminLayout>
      <ChatbotSettingsPanel />
    </AdminLayout>
  )
}


