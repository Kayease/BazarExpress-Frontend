// Service Worker registration and management

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, prompt user to refresh
                if (confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window !== 'undefined') {
    const criticalResources = [
      '/api/categories',
      '/api/brands',
      // Add other critical API endpoints
    ];

    criticalResources.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

// Preconnect to external domains
export function preconnectExternalDomains() {
  if (typeof window !== 'undefined') {
    const domains = [
      'https://res.cloudinary.com',
      // Add other external domains
    ];

    domains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
}