/**
 * Service Worker Manager
 * Handles registration, updates, and cache management
 */

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  /**
   * Register Service Worker
   */
  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('[ServiceWorkerManager] Service Workers not supported')
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      })
      console.log('[ServiceWorkerManager] Service Worker registered')
      this.emit('registered')

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          console.log('[ServiceWorkerManager] Cache cleared from service worker')
          this.emit('cacheCleared')
        }
      })
    } catch (error) {
      console.error('[ServiceWorkerManager] Registration failed:', error)
      this.emit('error', error)
    }
  }

  /**
   * Unregister Service Worker and clear cache
   */
  async unregister(): Promise<void> {
    if (!this.registration) {
      console.log('[ServiceWorkerManager] No registration to unregister')
      return
    }

    try {
      await this.registration.unregister()
      console.log('[ServiceWorkerManager] Service Worker unregistered')
      this.registration = null
      this.emit('unregistered')
    } catch (error) {
      console.error('[ServiceWorkerManager] Unregistration failed:', error)
      this.emit('error', error)
    }
  }

  /**
   * Clear all cached assets
   */
  async clearCache(): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.log('[ServiceWorkerManager] No active service worker')
      // Fallback: clear cache directly if SW not available
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
        console.log('[ServiceWorkerManager] Cache cleared (direct)')
        this.emit('cacheCleared')
      } catch (error) {
        console.error('[ServiceWorkerManager] Direct cache clear failed:', error)
      }
      return
    }

    try {
      // Send message to service worker to clear cache
      this.registration.active.postMessage({
        type: 'CLEAR_CACHE',
      })
      console.log('[ServiceWorkerManager] Sent clear cache message')
    } catch (error) {
      console.error('[ServiceWorkerManager] Clear cache failed:', error)
      this.emit('error', error)
    }
  }

  /**
   * Check if Service Worker is registered
   */
  isRegistered(): boolean {
    return this.registration !== null
  }

  /**
   * Get Service Worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }

  /**
   * Event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    if (!this.listeners.has(event)) return
    const callbacks = this.listeners.get(event)!
    const index = callbacks.indexOf(callback)
    if (index !== -1) {
      callbacks.splice(index, 1)
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach((callback) => callback(data))
  }
}

// Export singleton instance
export const swManager = ServiceWorkerManager.getInstance()
