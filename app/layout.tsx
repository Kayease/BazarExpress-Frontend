import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/components/app-provider'
import SiteFrame from '@/components/SiteFrame'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'BazarXpress | All your desired here..',
  description: 'Design and Developed by Pradeependra Pratap',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <SiteFrame>
            {children}
          </SiteFrame>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '1rem',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
              },
              success: {
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '1rem',
                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '1rem',
                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
                },
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  )
}