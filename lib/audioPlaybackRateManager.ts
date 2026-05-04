/**
 * Audio Playback Rate Manager
 * Manages music playback rate based on game speed with chipmunk effect
 * 
 * Game Speed Progression:
 * - baseSpeed = 1.5 + score * 0.02
 * - gameSpeed = Math.min(baseSpeed, 80)
 * 
 * Music Playback Rate Calculation:
 * - Every 2x increase in game speed → +0.01x music speed (chipmunk effect)
 * - Max game speed: 80
 * - Max music speed: ~1.27x (base 1.0x + increments)
 * 
 * Formula:
 * - gameSpeedMultiplier = (actualGameSpeed - 1.5) / 1.5  // Normalize to 0-based
 * - increments = Math.floor(gameSpeedMultiplier / 2)
 * - musicPlaybackRate = 1.0 + (increments * 0.01)
 * - musicPlaybackRate = Math.min(musicPlaybackRate, 1.27) // Cap at ~1.27x
 */

export class AudioPlaybackRateManager {
  private currentAudioElements: Map<string, HTMLAudioElement> = new Map()
  private updateInterval: NodeJS.Timeout | null = null
  private lastGameSpeed = 1.5
  private lastMusicRate = 1.0

  constructor() {}

  /**
   * Register audio elements to be controlled
   */
  public registerAudioElement(name: string, audioElement: HTMLAudioElement | null) {
    if (audioElement) {
      this.currentAudioElements.set(name, audioElement)
    } else {
      this.currentAudioElements.delete(name)
    }
  }

  /**
   * Register multiple audio elements at once (useful for refs)
   */
  public registerAudioElements(audioRefs: Record<string, HTMLAudioElement | undefined>) {
    Object.entries(audioRefs).forEach(([name, element]) => {
      if (element) {
        this.registerAudioElement(name, element)
      }
    })
  }

  /**
   * Calculate music playback rate based on game speed
   * Every 2x game speed increase = +0.01x music rate (chipmunk effect)
   */
  private calculateMusicRate(gameSpeed: number): number {
    // Normalize game speed (subtract base speed of 1.5)
    const baseGameSpeed = 1.5
    const speedAboveBase = Math.max(0, gameSpeed - baseGameSpeed)
    
    // Calculate how many "2x increments" we've gone through
    const incrementCount = Math.floor(speedAboveBase / 2)
    
    // Base music rate is 1.0x, each increment adds 0.01x
    let musicRate = 1.0 + (incrementCount * 0.01)
    
    // Cap at 1.27x (approximately 27% speed increase max)
    musicRate = Math.min(musicRate, 1.27)
    
    return Math.round(musicRate * 1000) / 1000 // Round to 3 decimals
  }

  /**
   * Update playback rate for all registered audio elements
   */
  public updatePlaybackRate(gameSpeed: number) {
    if (gameSpeed === this.lastGameSpeed) {
      return // No change needed
    }

    const newMusicRate = this.calculateMusicRate(gameSpeed)

    if (newMusicRate === this.lastMusicRate) {
      return // No change needed
    }

    this.lastGameSpeed = gameSpeed
    this.lastMusicRate = newMusicRate

    // Update all registered audio elements
    this.currentAudioElements.forEach((audioElement) => {
      if (audioElement && !audioElement.paused) {
        try {
          audioElement.playbackRate = newMusicRate
        } catch (e) {
          // Some browsers might not support playbackRate
          console.warn("[v0] Failed to set playbackRate:", e)
        }
      }
    })
  }

  /**
   * Get current music playback rate
   */
  public getCurrentMusicRate(): number {
    return this.lastMusicRate
  }

  /**
   * Get current game speed multiplier (for display purposes)
   */
  public getGameSpeedMultiplier(gameSpeed: number): string {
    const multiplier = (gameSpeed / 1.5).toFixed(2)
    return `${multiplier}x`
  }

  /**
   * Start continuous monitoring of audio playback (optional)
   */
  public startMonitoring(checkInterval = 100) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    this.updateInterval = setInterval(() => {
      // This is used internally if continuous monitoring is needed
    }, checkInterval)
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  /**
   * Reset to default values
   */
  public reset() {
    this.lastGameSpeed = 1.5
    this.lastMusicRate = 1.0
    this.currentAudioElements.forEach((audioElement) => {
      try {
        audioElement.playbackRate = 1.0
      } catch (e) {
        // Ignore
      }
    })
  }

  /**
   * Cleanup
   */
  public destroy() {
    this.stopMonitoring()
    this.currentAudioElements.clear()
  }
}

// Global instance
export const audioRateManager = new AudioPlaybackRateManager()
