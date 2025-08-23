import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/components/app-provider'
import SiteFrame from '@/components/SiteFrame'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'BazarXpress | All your desired here..',
  description: 'Need - Click - Express',
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
        
        {/* Performance and Service Worker Scripts */}
        <Script
          id="performance-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Register Service Worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('SW registered'))
                    .catch(error => console.log('SW registration failed'));
                });
              }
              
              // Preconnect to external domains
              const domains = ['https://res.cloudinary.com'];
              domains.forEach(domain => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
              });
            `
          }}
        />
      </body>
    </html>
  )
}