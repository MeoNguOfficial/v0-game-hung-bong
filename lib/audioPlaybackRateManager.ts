/**
 * Audio Playback Rate Manager
 * Manages music playback rate based on game speed with chipmunk (nightcore) effect
 * 
 * Game Speed Progression:
 * - baseSpeed = 1.5 + score * 0.02
 * - gameSpeed = Math.min(baseSpeed, 80)
 * 
 * Music Playback Rate Calculation (Nightcore Mode):
 * - Every 2x increase in game speed → +0.05x music speed (chipmunk effect)
 * - Preserves pitch is disabled to create chipmunk voice effect
 * - Max game speed: 80
 * - Max music speed: ~1.35x (base 1.0x + increments)
 * 
 * Formula:
 * - gameSpeedMultiplier = (actualGameSpeed - 1.5) / 1.5  // Normalize to 0-based
 * - increments = Math.floor(gameSpeedMultiplier / 2)
 * - musicPlaybackRate = 1.0 + (increments * 0.05)
 * - musicPlaybackRate = Math.min(musicPlaybackRate, 1.35) // Cap at ~1.35x
 */

export class AudioPlaybackRateManager {
  private currentAudioElements: Map<string, HTMLAudioElement> = new Map()
  private updateInterval: NodeJS.Timeout | null = null
  private lastGameSpeed = 1.5
  private lastMusicRate = 1.0
  private targetMusicRate = 1.0
  private isNightcoreMode = true // Enable chipmunk effect by default
  private slowModeActive = false // Track slow mode state
  private normalMusicRate = 1.0 // Store normal rate when slow mode activates
  private smoothInterpolationSpeed = 0.15 // Lower = smoother, 0.15 is sweet spot

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
   * Every 2x game speed increase = +0.05x music rate (nightcore chipmunk effect)
   */
  private calculateMusicRate(gameSpeed: number): number {
    // Normalize game speed (subtract base speed of 1.5)
    const baseGameSpeed = 1.5
    const speedAboveBase = Math.max(0, gameSpeed - baseGameSpeed)
    
    // Calculate how many "2x increments" we've gone through
    const incrementCount = Math.floor(speedAboveBase / 2)
    
    // Base music rate is 1.0x, each increment adds 0.05x (nightcore effect)
    let musicRate = 1.0 + (incrementCount * 0.05)
    
    // Cap at 1.35x (approximately 35% speed increase max)
    musicRate = Math.min(musicRate, 1.35)
    
    return Math.round(musicRate * 1000) / 1000 // Round to 3 decimals
  }

  /**
   * Update playback rate for all registered audio elements
   * Uses smooth interpolation for linear speed transitions
   * Disables pitch preservation for chipmunk (nightcore) effect
   */
  public updatePlaybackRate(gameSpeed: number) {
    if (gameSpeed === this.lastGameSpeed) {
      return // No change needed
    }

    const newMusicRate = this.calculateMusicRate(gameSpeed)

    if (newMusicRate === this.targetMusicRate) {
      return // No change needed
    }

    this.lastGameSpeed = gameSpeed
    this.targetMusicRate = newMusicRate

    // Start smooth interpolation
    this.startSmoothInterpolation()
  }

  /**
   * Start smooth linear interpolation to target music rate
   */
  private startSmoothInterpolation() {
    if (this.updateInterval) {
      return // Already interpolating
    }

    const interpolationFrames = 10 // Number of frames to interpolate over
    let currentFrame = 0

    this.updateInterval = window.setInterval(() => {
      currentFrame++
      
      // Linear interpolation: current = start + (end - start) * (frame / totalFrames)
      const progress = Math.min(currentFrame / interpolationFrames, 1)
      this.lastMusicRate = this.lastMusicRate + (this.targetMusicRate - this.lastMusicRate) * progress

      this.applyPlaybackRate(this.lastMusicRate)

      if (progress >= 1) {
        // Done interpolating
        this.lastMusicRate = this.targetMusicRate
        if (this.updateInterval) {
          clearInterval(this.updateInterval)
          this.updateInterval = null
        }
      }
    }, 16) // ~60fps
  }

  /**
   * Apply playback rate to all registered audio elements
   */
  private applyPlaybackRate(musicRate: number) {
    this.currentAudioElements.forEach((audioElement) => {
      if (audioElement && !audioElement.paused) {
        try {
          // Apply nightcore effect: disable pitch preservation for chipmunk voice
          if (this.isNightcoreMode && musicRate > 1.0) {
            // Disable pitch preservation to get the chipmunk effect
            audioElement.preservesPitch = false
            // Webkit variant
            if ((audioElement as any).webkitPreservesPitch !== undefined) {
              (audioElement as any).webkitPreservesPitch = false
            }
            // Mozilla variant
            if ((audioElement as any).mozPreservesPitch !== undefined) {
              (audioElement as any).mozPreservesPitch = false
            }
          } else {
            // Normal mode: preserve pitch
            audioElement.preservesPitch = true
            if ((audioElement as any).webkitPreservesPitch !== undefined) {
              (audioElement as any).webkitPreservesPitch = true
            }
            if ((audioElement as any).mozPreservesPitch !== undefined) {
              (audioElement as any).mozPreservesPitch = true
            }
          }
          
          audioElement.playbackRate = musicRate
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
   * Toggle nightcore mode on/off
   */
  public setNightcoreMode(enabled: boolean) {
    this.isNightcoreMode = enabled
    // Reapply current playback rate with new settings
    this.updatePlaybackRate(this.lastGameSpeed)
  }

  /**
   * Get current nightcore mode status
   */
  public getNightcoreMode(): boolean {
    return this.isNightcoreMode
  }

  /**
   * Set slow mode (reduce music rate to half)
   * Used when snow ball is caught
   */
  public setSlowMode(active: boolean) {
    this.slowModeActive = active
    
    if (active) {
      // Store current music rate before slowing down
      this.normalMusicRate = this.lastMusicRate
    }
    
    // Apply slow mode: reduce music rate to half
    const targetRate = active ? this.normalMusicRate / 2 : this.normalMusicRate
    
    this.currentAudioElements.forEach((audioElement) => {
      if (audioElement && !audioElement.paused) {
        try {
          audioElement.playbackRate = targetRate
        } catch (e) {
          console.warn("[v0] Failed to set playbackRate in slow mode:", e)
        }
      }
    })
  }

  /**
   * Get current slow mode status
   */
  public isSlowMode(): boolean {
    return this.slowModeActive
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
        // Reset to normal pitch preservation
        audioElement.preservesPitch = true
        if ((audioElement as any).webkitPreservesPitch !== undefined) {
          (audioElement as any).webkitPreservesPitch = true
        }
        if ((audioElement as any).mozPreservesPitch !== undefined) {
          (audioElement as any).mozPreservesPitch = true
        }
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
