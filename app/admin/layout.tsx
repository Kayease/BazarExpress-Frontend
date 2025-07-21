import { AppProvider } from '@/components/app-provider'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  )
} 