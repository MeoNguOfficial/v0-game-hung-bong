// Service Worker for caching game assets
const CACHE_NAME = 'game-assets-cache-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  // Add other critical assets here
]

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching assets')
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.log('[ServiceWorker] Cache add error:', err)
        // Continue even if some assets fail to cache
        return Promise.resolve()
      })
    })
  )
  self.skipWaiting() // Activate immediately
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim() // Take control of clients immediately
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[ServiceWorker] Serving from cache:', request.url)
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache successful responses
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline fallback if available
          console.log('[ServiceWorker] Fetch failed, using cache or offline')
          return caches.match(request)
        })
    })
  )
})

// Listen for cache clear message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[ServiceWorker] Clearing cache...')
    caches.delete(CACHE_NAME).then(() => {
      console.log('[ServiceWorker] Cache cleared')
      // Notify all clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_CLEARED' })
        })
      })
    })
  }
})
