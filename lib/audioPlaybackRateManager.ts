/**
 * Audio Playback Rate Manager
 * Manages music playback rate and applies the chipmunk (nightcore) effect
 * by disabling pitch preservation when the rate is changed.
 */

export class AudioPlaybackRateManager {
  private currentAudioElements: Map<string, HTMLAudioElement> = new Map()
  private updateInterval: NodeJS.Timeout | null = null
  private lastMusicRate = 1.0
  private targetMusicRate = 1.0
  private isNightcoreMode = true // Enable chipmunk effect by default
  private slowModeActive = false // Track slow mode state
  private preservesPitchSetting = false // User preference
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
   * Update playback rate directly.
   * Uses smooth interpolation for linear speed transitions
   * Disables pitch preservation for chipmunk (nightcore) effect
   */
  public updatePlaybackRate(musicRate: number) {
    if (musicRate === this.targetMusicRate) {
      return // No change needed
    }

    this.targetMusicRate = musicRate

    // Start smooth interpolation
    this.startSmoothInterpolation()
  }

  /**
   * Smoothly animate playback rate to a target value over a duration (ms)
   * Used for death sequences (OSU style) - Now pitch drops correctly
   */
  public animatePlaybackRate(targetRate: number, duration: number) {
    this.slowModeActive = false; // Disable slow mode during death animation
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    const startRate = this.lastMusicRate
    const startTime = performance.now()
    this.targetMusicRate = targetRate

    const step = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      this.lastMusicRate = startRate + (targetRate - startRate) * progress
      this.applyPlaybackRate(this.lastMusicRate)

      if (progress < 1) {
        this.updateInterval = setTimeout(step, 16) as any
      } else {
        this.updateInterval = null
      }
    }
    
    step()
  }

  /**
   * Start smooth linear interpolation to target music rate
   */
  private startSmoothInterpolation() {
    if (this.updateInterval) return

    this.updateInterval = window.setInterval(() => {
      // Smoother exponential interpolation (LERP)
      const diff = this.targetMusicRate - this.lastMusicRate
      
      if (Math.abs(diff) < 0.001) {
        this.lastMusicRate = this.targetMusicRate
        if (this.updateInterval) {
          clearInterval(this.updateInterval)
          this.updateInterval = null
        }
      } else {
        this.lastMusicRate += diff * this.smoothInterpolationSpeed
      }
      
      this.applyPlaybackRate(this.lastMusicRate)
    }, 16) // ~60fps
  }

  /**
   * Apply playback rate to all registered audio elements
   */
  private applyPlaybackRate(musicRate: number) {
    // Calculate effective rate: Apply 0.5x multiplier if slow mode is active
    const effectiveRate = this.slowModeActive ? musicRate * 0.5 : musicRate;

    this.currentAudioElements.forEach((audioElement) => {
      if (audioElement && !audioElement.paused) {
        try {
          if (this.isNightcoreMode && effectiveRate !== 1.0 && !this.preservesPitchSetting) {
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
          
          audioElement.playbackRate = effectiveRate
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
    this.applyPlaybackRate(this.lastMusicRate)
  }

  /**
   * Update user preference for pitch preservation
   */
  public setPreservesPitch(enabled: boolean) {
    this.preservesPitchSetting = enabled
    this.applyPlaybackRate(this.lastMusicRate)
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
    // Re-apply immediately based on current interpolated rate
    this.applyPlaybackRate(this.lastMusicRate)
  }

  /**
   * Get current slow mode status
   */
  public isSlowMode(): boolean {
    return this.slowModeActive
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
    this.slowModeActive = false
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
