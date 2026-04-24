import * as PIXI from "pixi.js"

export interface PixiParticle {
  sprite: PIXI.Sprite | PIXI.Graphics
  vx: number
  vy: number
  alpha: number
  decay: number
  type: "explode" | "absorb" | "firework" | "shard" | "miss"
  targetX?: number
  targetY?: number
  trailParticles?: PIXI.Graphics[]
  scale: number
  rotation: number
  rotationSpeed: number
}

export class PixiParticleSystem {
  private app: PIXI.Application
  private particleContainer: PIXI.Container
  private particles: PixiParticle[] = []
  private textureCache: Map<string, PIXI.Texture> = new Map()

  constructor(app: PIXI.Application) {
    this.app = app
    this.particleContainer = new PIXI.Container()
    this.app.stage.addChild(this.particleContainer)
  }

  /**
   * Create particles with enhanced visual effects
   */
  createParticles(
    x: number,
    y: number,
    color: string,
    type: "explode" | "absorb" | "firework" | "shard" | "miss",
    intense: boolean,
    targetX?: number,
    targetY?: number
  ) {
    const count = intense ? 40 : 15
    const isAbsorb = type === "absorb"

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const velocity = Math.random() * 5 + 2

      // Create particle graphics
      const particle = new PIXI.Graphics()
      const radius = type === "shard" ? Math.random() * 5 + 1 : Math.random() * 3 + 1

      // Draw different particle shapes based on type
      if (type === "shard") {
        // Sharp shards
        particle.lineStyle(1, parseInt(color.replace("#", "0x")), 0.8)
        particle.moveTo(-radius, -radius)
        particle.lineTo(radius, radius)
        particle.moveTo(radius, -radius)
        particle.lineTo(-radius, radius)
      } else if (type === "firework") {
        // Star-shaped particles for fireworks
        particle.beginFill(parseInt(color.replace("#", "0x")), 0.9)
        this.drawStar(particle, 0, 0, 5, radius, radius * 0.5)
        particle.endFill()
      } else {
        // Circular particles with glow
        particle.beginFill(parseInt(color.replace("#", "0x")), 0.8)
        particle.arc(0, 0, radius, 0, Math.PI * 2)
        particle.endFill()

        // Add glow effect
        particle.lineStyle(1, parseInt(color.replace("#", "0x")), 0.3)
        particle.arc(0, 0, radius + 2, 0, Math.PI * 2)
      }

      particle.position.set(x, y)

      const pixiParticle: PixiParticle = {
        sprite: particle,
        vx: isAbsorb ? (Math.random() - 0.5) * 5 : Math.cos(angle) * velocity,
        vy: isAbsorb ? -velocity : Math.sin(angle) * velocity,
        alpha: 1,
        decay: type === "firework" ? 0.01 : 0.02,
        type,
        targetX: isAbsorb ? targetX : undefined,
        targetY: isAbsorb ? targetY : undefined,
        scale: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        trailParticles: [],
      }

      // Add trail for faster particles
      if (type === "firework" || type === "explode") {
        pixiParticle.trailParticles = []
      }

      this.particleContainer.addChild(particle)
      this.particles.push(pixiParticle)
    }
  }

  /**
   * Update all particles
   */
  update(deltaTime: number = 1) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]

      // Update position
      if (p.type === "absorb" && p.targetX !== undefined && p.targetY !== undefined) {
        // Absorb particles move towards target
        p.sprite.x += (p.targetX - p.sprite.x) * 0.15
        p.sprite.y += (p.targetY - p.sprite.y) * 0.15
      } else {
        // Regular movement
        p.sprite.x += p.vx
        p.sprite.y += p.vy

        // Add gravity for non-firework particles
        if (p.type !== "firework") {
          p.vy += 0.1 // gravity
        }
      }

      // Update rotation
      p.rotation += p.rotationSpeed
      p.sprite.rotation = p.rotation

      // Update scale with fade
      p.alpha -= p.decay
      p.sprite.alpha = Math.max(0, p.alpha)

      // Scale down as it fades
      const scaleDecay = 1 - Math.pow(1 - Math.min(1, p.decay * 50), 2)
      p.scale *= 1 - scaleDecay * 0.02
      p.sprite.scale.set(p.scale)

      // Remove dead particles
      if (p.alpha <= 0) {
        this.particleContainer.removeChild(p.sprite)
        p.sprite.destroy()
        this.particles.splice(i, 1)
      }
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    for (const p of this.particles) {
      this.particleContainer.removeChild(p.sprite)
      p.sprite.destroy()
    }
    this.particles = []
  }

  /**
   * Get particle count
   */
  getParticleCount(): number {
    return this.particles.length
  }

  /**
   * Draw a star shape
   */
  private drawStar(
    graphics: PIXI.Graphics,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let step = (Math.PI * 2) / spikes
    let half = step / 2
    let points: [number, number][] = []

    for (let i = 0; i < spikes; i++) {
      let angle1 = i * step
      let angle2 = angle1 + half

      points.push([
        cx + Math.cos(angle1) * outerRadius,
        cy + Math.sin(angle1) * outerRadius,
      ])
      points.push([
        cx + Math.cos(angle2) * innerRadius,
        cy + Math.sin(angle2) * innerRadius,
      ])
    }

    graphics.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i][0], points[i][1])
    }
    graphics.lineTo(points[0][0], points[0][1])
  }

  /**
   * Create special effects like confetti or rain
   */
  createConfetti(x: number, y: number, count: number = 30) {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const velocity = Math.random() * 8 + 4

      const particle = new PIXI.Graphics()
      particle.beginFill(parseInt(color.replace("#", "0x")), 0.9)
      particle.drawRect(-3, -2, 6, 4)
      particle.endFill()
      particle.position.set(x, y)

      const pixiParticle: PixiParticle = {
        sprite: particle,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 3,
        alpha: 1,
        decay: 0.015,
        type: "explode",
        scale: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      }

      this.particleContainer.addChild(particle)
      this.particles.push(pixiParticle)
    }
  }

  /**
   * Create rain effect
   */
  createRainEffect(canvasWidth: number, canvasHeight: number, count: number = 50) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * canvasWidth
      const y = Math.random() * canvasHeight

      const particle = new PIXI.Graphics()
      particle.lineStyle(2, 0x3b82f6, 0.6)
      particle.moveTo(0, -10)
      particle.lineTo(0, 10)
      particle.position.set(x, y)

      const pixiParticle: PixiParticle = {
        sprite: particle,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 4 + 3,
        alpha: 0.6,
        decay: 0.003,
        type: "explode",
        scale: 1,
        rotation: 0,
        rotationSpeed: 0,
      }

      this.particleContainer.addChild(particle)
      this.particles.push(pixiParticle)
    }
  }
}
