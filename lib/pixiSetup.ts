import * as PIXI from "pixi.js"
import { PixiParticleSystem } from "./pixiParticleSystem"

/**
 * Initialize PixiJS with optimized settings for the game
 */
export async function initializePixiJS(canvasElement: HTMLCanvasElement): Promise<PIXI.Application | null> {
  try {
    // Check if WebGL is available
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    if (!gl) {
      console.warn("[v0] WebGL not available, falling back to Canvas rendering")
      return null
    }

    // Get canvas dimensions
    const width = canvasElement.offsetWidth || 500
    const height = canvasElement.offsetHeight || 800

    // Create PixiJS application with optimized settings
    const app = new PIXI.Application({
      width,
      height,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      backgroundColor: 0x000000,
      transparent: false,
    })

    // Position the PixiJS canvas absolutely over the game canvas
    if (app.canvas instanceof HTMLCanvasElement) {
      app.canvas.style.position = "absolute"
      app.canvas.style.top = canvasElement.style.top || "0"
      app.canvas.style.left = canvasElement.style.left || "0"
      app.canvas.style.pointerEvents = "none" // Don't intercept mouse events
      app.canvas.style.zIndex = "10"

      // Insert PixiJS canvas right after the game canvas
      canvasElement.parentElement?.insertBefore(app.canvas, canvasElement.nextSibling)
    }

    // Store in window for global access
    (window as any).pixiApp = app
    (window as any).pixiParticleSystem = new PixiParticleSystem(app)

    // Handle resize
    window.addEventListener("resize", () => {
      const newWidth = canvasElement.offsetWidth || 500
      const newHeight = canvasElement.offsetHeight || 800
      app.renderer.resize(newWidth, newHeight)
    })

    console.log("[v0] PixiJS initialized successfully")
    return app
  } catch (error) {
    console.warn("[v0] Failed to initialize PixiJS:", error)
    return null
  }
}

/**
 * Clean up PixiJS resources
 */
export function cleanupPixiJS() {
  const app = (window as any).pixiApp as PIXI.Application | undefined
  if (app) {
    if (app.canvas instanceof HTMLCanvasElement) {
      app.canvas.remove()
    }
    app.destroy()
    ;(window as any).pixiApp = undefined
    ;(window as any).pixiParticleSystem = undefined
  }
}
