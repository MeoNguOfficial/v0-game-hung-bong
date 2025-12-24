"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Volume2,
  VolumeX,
  X,
  Trophy,
  Trash2,
  Cpu,
  Play,
  Home,
  Zap,
  Star,
  Sparkles,
  Wind,
  Pause,
  AlertCircle,
  Info,
  Skull,
  Film,
  RotateCcw,
  Heart,
  Disc,
  BarChart3,
  Bug,
  ExternalLink,
  Edit3,
} from "lucide-react"
import { TRANSLATIONS } from "./translations"
import SettingsModal from "./SettingsModal"

// --- Custom Hook: useIsMobile (Được tích hợp trực tiếp để không cần file ngoài) ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Kiểm tra ngay khi mount
    checkMobile()

    // Lắng nghe sự kiện resize
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

// --- Interfaces ---
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  decay: number
  type?: "explode" | "absorb" | "firework" | "shard" | "miss"
}

interface Trail {
  x: number
  y: number
  alpha: number
}

// --- Main Component ---
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number | null>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(5)
  const [bestScoreNormal, setBestScoreNormal] = useState(0)
  const [bestScoreHardcore, setBestScoreHardcore] = useState(0)
  const [bestScoreClassicNormal, setBestScoreClassicNormal] = useState(0)
  const [bestScoreClassicHardcore, setBestScoreClassicHardcore] = useState(0)
  const [gameState, setGameState] = useState<"start" | "countdown" | "running" | "paused" | "over">("start")
  const [countdown, setCountdown] = useState<number | string>(3)
  const [comboCount, setComboCount] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [showNewBest, setShowNewBest] = useState(false)
  const [isAuto, setIsAuto] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isClassic, setIsClassic] = useState(false)
  const [particlesEnabled, setParticlesEnabled] = useState(true)
  const [trailsEnabled, setTrailsEnabled] = useState(true)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [openSettings, setOpenSettings] = useState(false)
  const [openStats, setOpenStats] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmResetNormal, setConfirmResetNormal] = useState(false)
  const [confirmResetHardcore, setConfirmResetHardcore] = useState(false)
  const [confirmResetClassicNormal, setConfirmResetClassicNormal] = useState(false)
  const [confirmResetClassicHardcore, setConfirmResetClassicHardcore] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [isFlashRed, setIsFlashRed] = useState(false)
  const [isFlashWhite, setIsFlashWhite] = useState(false)
  const [gameMode, setGameMode] = useState<"normal" | "hardcode">("normal")
  const [openGuide, setOpenGuide] = useState(false)
  const [snowLeft, setSnowLeft] = useState(0)
  const [snowActive, setSnowActive] = useState(false)
  const [language, setLanguage] = useState<"en" | "vi" | "es" | "ru">("en")
  const [openCustom, setOpenCustom] = useState(false)
  const [customConfig, setCustomConfig] = useState({
    mode: "normal" as "normal" | "hardcode",
    isAuto: false,
    balls: {
      normal: true,
      purple: true,
      yellow: true,
      boost: true,
      grey: true,
      snow: true,
      orange: true,
      heal: true,
    }
  })

  const isMobile = useIsMobile()

  const gameData = useRef({
    score: 0,
    lives: 5,
    combo: 0,
    isAuto: false,
    isCustom: false,
    allowedBalls: [] as string[],
    isClassic: false,
    gameMode: "normal" as "normal" | "hardcode",
    playerX: 160,
    playerWidth: 80,
    targetWidth: 80,
    isBoosted: false,
    bestNormal: 0,
    bestHardcore: 0,
    bestClassicNormal: 0,
    bestClassicHardcore: 0,
    isMuted: false,
    boostTimeLeft: 0,
    snowTimeLeft: 0,
    isSnowSlowed: false,
    timeScale: 1,
    targetTimeScale: 1,
    hasPlayedNewBest: false,
    hasShield: false,
    particlesEnabled: true,
    trailsEnabled: true,
    ball: { x: 200, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal" as any, sinTime: 0 },
    bombs: [] as { x: number; y: number; radius: number; speed: number }[],
    isDying: false,
    deathX: 0,
    deathY: 0,
  })

  const particles = useRef<Particle[]>([])
  const trails = useRef<Trail[]>([])
  const audioRefs = useRef<any>(null)
  const snowIntervalRef = useRef<number | null>(null)

  const t = TRANSLATIONS[language]

  const changeLanguage = (lang: "en" | "vi" | "es" | "ru") => {
    setLanguage(lang)
    localStorage.setItem("game_language", lang)
  }

  // --- Anti-Right Click (PC) ---
  useEffect(() => {
    let isDevMode = false
    const keys = new Set<string>()

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code)
      if (e.repeat) return

      // Toggle DevMode if Left Control + Backquote (` or ~) are pressed
      if (keys.has("ControlLeft") && keys.has("Backquote")) {
        isDevMode = !isDevMode
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code)
    }

    const handleContextMenu = (e: MouseEvent) => {
      if (!isDevMode) e.preventDefault()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("contextmenu", handleContextMenu)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [])

  // Countdown timer refs and helpers
  const countdownTimeouts = useRef<number[]>([])
  const clearCountdownTimeouts = () => {
    countdownTimeouts.current.forEach((id) => clearTimeout(id))
    countdownTimeouts.current = []
  }

  const playSound = (name: string, idx?: number) => {
    if (!audioRefs.current || gameData.current.isMuted) return
    const audio =
      name === "combo" && idx !== undefined ? audioRefs.current.combo[Math.min(idx, 5)] : audioRefs.current[name]
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => { })
    }
  }

  const runCountdown = (isAutoParam: boolean, onFinish: () => void) => {
    clearCountdownTimeouts()
    if (isAutoParam) {
      onFinish()
      return
    }
    setGameState("countdown")
    setCountdown(3)
    playSound("count")
    countdownTimeouts.current.push(
      window.setTimeout(() => {
        setCountdown(2)
        playSound("count")
      }, 1000),
    )
    countdownTimeouts.current.push(
      window.setTimeout(() => {
        setCountdown(1)
        playSound("count")
      }, 2000),
    )
    countdownTimeouts.current.push(
      window.setTimeout(() => {
        setCountdown("GO")
        playSound("go")
        playSound("kjacs")
      }, 3000),
    )
    countdownTimeouts.current.push(
      window.setTimeout(() => {
        setCountdown(3)
        onFinish()
      }, 3500),
    )
  }

  // --- LOGIC TẠM DỪNG & TIẾP TỤC ---
  const pauseGame = () => {
    if (gameState !== "running") return
    setGameState("paused")
    setConfirmExit(false)
    if (!gameData.current.isMuted && audioRefs.current?.pause_bg) {
      audioRefs.current.pause_bg.play().catch(() => { })
    }
  }

  const resumeGame = () => {
    if (audioRefs.current?.pause_bg) {
      audioRefs.current.pause_bg.pause()
      audioRefs.current.pause_bg.currentTime = 0
    }
    // If autoplay is enabled, resume immediately
    if (gameData.current.isAuto) {
      setGameState("running")
      return
    }
    // Start a short countdown to resume (preserve gameData)
    runCountdown(false, () => {
      setGameState("running")
    })
  }

  const handleExitRequest = () => {
    if (!confirmExit) {
      setConfirmExit(true)
      setTimeout(() => setConfirmExit(false), 3000) // Reset sau 3s nếu ko nhấn lại
      return
    }
    // Thực hiện thoát
    if (audioRefs.current?.pause_bg) {
      audioRefs.current.pause_bg.pause()
      audioRefs.current.pause_bg.currentTime = 0
    }
    setGameState("start")
    setConfirmExit(false)
  }

  const toggleAutoMode = () => {
    gameData.current.isAuto = !gameData.current.isAuto
    setIsAuto(gameData.current.isAuto)
    if (typeof window !== "undefined" && window.navigator.vibrate) window.navigator.vibrate(50)
  }

  const toggleMute = () => {
    const newState = !isMuted
    setIsMuted(newState)
    gameData.current.isMuted = newState
    localStorage.setItem("game_muted", String(newState))
  }

  const toggleParticles = () => {
    const newState = !particlesEnabled
    setParticlesEnabled(newState)
    gameData.current.particlesEnabled = newState
    localStorage.setItem("game_particles", String(newState))
  }

  const toggleTrails = () => {
    const newState = !trailsEnabled
    setTrailsEnabled(newState)
    gameData.current.trailsEnabled = newState
    localStorage.setItem("game_trails", String(newState))
  }

  const toggleAnimations = () => {
    const newState = !animationsEnabled
    setAnimationsEnabled(newState)
    localStorage.setItem("game_animations", String(newState))
  }

  const resetBall = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (gameData.current.lives <= 0 || gameData.current.isDying) return
    const b = gameData.current.ball
    const score = gameData.current.score

    b.y = -20
    b.x = Math.random() * (canvas.width - 40) + 20
    b.sinTime = 0

    const baseSpeed = Math.min(1.5 + score * 0.02, 80)
    const straightChance = Math.max(0.98 - score / 250, 0.02)

    if (Math.random() < straightChance) {
      b.dx = (Math.random() - 0.5) * 2
    } else {
      const tiltPower = Math.min(4 + score * 0.05, 12)
      b.dx = (Math.random() - 0.5) * tiltPower
    }

    if (gameData.current.isCustom) {
      const allowed = gameData.current.allowedBalls
      // Custom Mode Priority: Always pick from allowed list
      if (allowed && allowed.length > 0) {
        b.type = allowed[Math.floor(Math.random() * allowed.length)] as any
      } else {
        b.type = "normal"
      }
    } else if (gameData.current.isClassic) {
      // Classic Mode: 93% Normal (Red), 5% Heal (Green), 2% Shield (Grey)
      const r = Math.random()
      if (r < 0.02) b.type = "grey"
      else if (gameData.current.gameMode !== "hardcode" && r < 0.07) b.type = "heal"
      else b.type = "normal"
    } else if (score < 10) {
      b.type = "normal"
    } else {
      // Use a weight-based selection so we can enforce spawn thresholds and adjust rates
      // Reduce grey, boost and snow by 30% (multiply by 0.7) when available
      const weights: { [k: string]: number } = {
        orange: score >= 2 && score <= 50 ? 0.15 : 0, // Bomb (single)
        grey: score >= 300 ? 0.02 * 0.7 : 0, // Shield (grey) available from 300
        heal: gameData.current.gameMode !== "hardcode" && score >= 150 ? 0.05 : 0, // Heal (green) from 150
        boost: score >= 200 ? 0.05 * 0.7 : 0, // Boost (blue) from 200
        snow: score >= 500 ? 0.05 * 0.7 : 0, // Snow (white) from 500
        yellow: score >= 100 ? 0.20 : 0, // Yellow from 100
        purple: score >= 50 ? 0.40 : 0, // Purple from 50
      }
      const baseSum = Object.values(weights).reduce((s, v) => s + v, 0)
      const normalWeight = Math.max(0, 1 - baseSum)
      const pool: [string, number][] = [...Object.entries(weights), ["normal", normalWeight]]
      const total = pool.reduce((s, [, w]) => s + w, 0)
      let r = Math.random() * total
      let chosen: string | undefined
      for (const [k, w] of pool) {
        if (r < w) {
          chosen = k
          break
        }
        r -= w
      }
      b.type = (chosen as any) || "normal"
    }
    if (b.type === "yellow") {
      b.speed = Math.min((3 + score * 0.02) / 2, 40)
    } else {
      b.speed = b.type === "purple" ? Math.min(baseSpeed * 1.5, 160) : baseSpeed
    }

    // Bomb Spawn Logic (Simultaneous)
    if (!gameData.current.isClassic && !gameData.current.isCustom && score > 50 && Math.random() < 0.2) {
      const delayY = Math.random() * 150
      gameData.current.bombs.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -50 - delayY,
        radius: 12,
        speed: baseSpeed * 1.1,
      })
      playSound("bomb_fall")
    }

    // Play sound if single bomb spawned
    if (b.type === "orange") playSound("bomb_fall")
  }

  const startCountdown = (isAuto: boolean, mode: "normal" | "hardcode" = "normal") => {
    // Update startCountdown to accept and set game mode, then run countdown
    setGameMode(mode)
    runCountdown(isAuto, () => {
      gameData.current = {
        ...gameData.current,
        score: 0,
        lives: mode === "hardcode" ? 1 : 5, // 1 life for Hardcode
        combo: 0,
        gameMode: mode,
        isCustom: false,
        allowedBalls: [],
        isClassic: isClassic,
        playerX: 160,
        playerWidth: 80,
        targetWidth: 80,
        isBoosted: false,
        boostTimeLeft: 0,
        snowTimeLeft: 0,
        isSnowSlowed: false,
        timeScale: 1,
        hasPlayedNewBest: false,
        hasShield: false,
        ball: { x: 200, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal", sinTime: 0 },
        bombs: [],
        isDying: false,
        deathX: 0,
        deathY: 0,
        isAuto: isAuto,
      }
      if (snowIntervalRef.current) {
        clearInterval(snowIntervalRef.current)
        snowIntervalRef.current = null
      }
      setSnowLeft(0)
      setSnowActive(false)
      setIsAuto(isAuto)
      setIsClassic(isClassic)
      setScore(0)
      setLives(mode === "hardcode" ? 1 : 5)
      setComboCount(0)
      setGameState("running")
      setOpenSettings(false)
      setOpenStats(false)
      setShowNewBest(false)
      particles.current = []
      trails.current = []
      resetBall()
    })
  }

  const startCustomGame = () => {
    const isAutoCustom = customConfig.isAuto
    const allowed = Object.entries(customConfig.balls)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type)
    
    if (allowed.length === 0) return

    setGameMode(customConfig.mode)
    runCountdown(isAutoCustom, () => {
      gameData.current = {
        ...gameData.current,
        score: 0,
        lives: customConfig.mode === "hardcode" ? 1 : 5,
        combo: 0,
        gameMode: customConfig.mode,
        isClassic: false,
        isCustom: true,
        allowedBalls: allowed,
        playerX: 160,
        playerWidth: 80,
        targetWidth: 80,
        isBoosted: false,
        boostTimeLeft: 0,
        snowTimeLeft: 0,
        isSnowSlowed: false,
        timeScale: 1,
        targetTimeScale: 1,
        hasPlayedNewBest: false,
        hasShield: false,
        ball: { x: 200, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal", sinTime: 0 },
        bombs: [],
        isDying: false,
        deathX: 0,
        deathY: 0,
        isAuto: isAutoCustom,
      }
      if (snowIntervalRef.current) {
        clearInterval(snowIntervalRef.current)
        snowIntervalRef.current = null
      }
      setSnowLeft(0)
      setSnowActive(false)
      setIsAuto(isAutoCustom)
      setIsClassic(false)
      setScore(0)
      setLives(customConfig.mode === "hardcode" ? 1 : 5)
      setComboCount(0)
      setGameState("running")
      setOpenCustom(false)
      setOpenSettings(false)
      setOpenStats(false)
      setShowNewBest(false)
      particles.current = []
      trails.current = []
      resetBall()
    })
  }

  const startAutoGame = () => {
    gameData.current = {
      ...gameData.current,
      score: 0,
      lives: gameMode === "hardcode" ? 1 : 5, // 1 life for Hardcode
      combo: 0,
      gameMode: gameMode,
      isCustom: false,
      allowedBalls: [],
      isClassic: isClassic,
      playerX: 160,
      playerWidth: 80,
      targetWidth: 80,
      isBoosted: false,
      boostTimeLeft: 0,
      snowTimeLeft: 0,
      isSnowSlowed: false,
      timeScale: 1,
      hasPlayedNewBest: false,
      hasShield: false,
      ball: { x: 200, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal", sinTime: 0 },
      bombs: [],
      isDying: false,
      deathX: 0,
      deathY: 0,
      isAuto: true, // Enable auto mode
    }
    if (snowIntervalRef.current) {
      clearInterval(snowIntervalRef.current)
      snowIntervalRef.current = null
    }
    setSnowLeft(0)
    setSnowActive(false)
    setScore(0)
    setLives(gameMode === "hardcode" ? 1 : 5)
    setComboCount(0)
    setIsAuto(true)
    setGameState("running")
    setOpenSettings(false)
    setOpenStats(false)
  }

  useEffect(() => {
    const loadAudio = (src: string) => {
      const audio = new Audio(src)
      audio.preload = "auto"
      return audio
    }
    const pauseBg = loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/pause_music.mp3")
    pauseBg.loop = true

    audioRefs.current = {
      catch: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/catch.mp3"),
      miss: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/miss.mp3"),
      gameover: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/gameover.mp3"),
      heal: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/heal.mp3"),
      boost: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/boost.mp3"),
      boost_end: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/boost_end.mp3"),
      newbest: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/newbest.mp3"),
      shield: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/shield.mp3"),
      shield_breaking: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/shield_breaking.mp3"),
      snow: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/snow_start.mp3"),
      snow_end: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/snow_end.mp3"),
      bomb: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bomb.mp3"),
      critical_bomb: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/critical_bomb.mp3"),
      bomb_fall: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bomb_fall_loop.mp3"),
      pause_bg: pauseBg,
      count: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/count.mp3"),
      go: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/go.mp3"),
      kjacs: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/kjacs.mp3"),
      combo: [
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c1.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c2.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c3.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c4.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c5.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c6.mp3"),
      ],
    }
    const savedMute = localStorage.getItem("game_muted") === "true"
    setIsMuted(savedMute)
    gameData.current.isMuted = savedMute

    const dataNormal = localStorage.getItem("my_game_best_normal")
    const savedBestNormal = dataNormal ? Number.parseInt(dataNormal) ^ 0xaa : 0
    setBestScoreNormal(savedBestNormal)
    gameData.current.bestNormal = savedBestNormal

    const dataHardcore = localStorage.getItem("my_game_best_hardcore")
    const savedBestHardcore = dataHardcore ? Number.parseInt(dataHardcore) ^ 0xaa : 0
    setBestScoreHardcore(savedBestHardcore)
    gameData.current.bestHardcore = savedBestHardcore

    const dataClassicNormal = localStorage.getItem("my_game_best_classic_normal")
    const savedBestClassicNormal = dataClassicNormal ? Number.parseInt(dataClassicNormal) ^ 0xaa : 0
    setBestScoreClassicNormal(savedBestClassicNormal)
    gameData.current.bestClassicNormal = savedBestClassicNormal

    const dataClassicHardcore = localStorage.getItem("my_game_best_classic_hardcore")
    const savedBestClassicHardcore = dataClassicHardcore ? Number.parseInt(dataClassicHardcore) ^ 0xaa : 0
    setBestScoreClassicHardcore(savedBestClassicHardcore)
    gameData.current.bestClassicHardcore = savedBestClassicHardcore

    const savedParticles = localStorage.getItem("game_particles") !== "false"
    setParticlesEnabled(savedParticles)
    gameData.current.particlesEnabled = savedParticles
    const savedTrails = localStorage.getItem("game_trails") !== "false"
    const savedAnimations = localStorage.getItem("game_animations") !== "false" // Default true
    setAnimationsEnabled(savedAnimations)
    setTrailsEnabled(savedTrails)

    const savedLang = localStorage.getItem("game_language")
    if (savedLang === "en" || savedLang === "vi" || savedLang === "es" || savedLang === "ru") {
      setLanguage(savedLang)
    } else if (typeof navigator !== "undefined" && navigator.language.startsWith("vi")) {
      setLanguage("vi")
    }
    gameData.current.trailsEnabled = savedTrails
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let boostInterval: any

    const createParticles = (
      x: number,
      y: number,
      color: string,
      type: "explode" | "absorb" | "firework" | "shard" | "miss",
      intense: boolean,
    ) => {
      if (!gameData.current.particlesEnabled) return
      const count = intense ? 40 : 15
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const velocity = Math.random() * 5 + 2
        particles.current.push({
          x,
          y,
          vx: ["explode", "firework", "shard", "miss"].includes(type)
            ? Math.cos(angle) * velocity
            : (Math.random() - 0.5) * 5,
          vy: ["explode", "firework", "shard", "miss"].includes(type) ? Math.sin(angle) * velocity : -velocity,
          radius: type === "shard" ? Math.random() * 5 + 1 : Math.random() * 3 + 1,
          color,
          alpha: 1,
          decay: type === "firework" ? 0.01 : 0.02,
          type,
        })
      }
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (canvas.getAttribute("data-state") !== "running" || gameData.current.isAuto || gameData.current.isDying) return
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const mouseX = (clientX - rect.left) * scaleX
      gameData.current.playerX = mouseX - gameData.current.playerWidth / 2
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("touchmove", handleMove, { passive: false })

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const ballColors: any = {
        heal: "#22c55e",
        boost: "#3b82f6",
        purple: "#a855f7",
        yellow: "#facc15",
        normal: "#ef4444",
        grey: "#94a3b8",
        snow: "#ffffff",
        orange: "#f97316",
      }

      const stopSound = (name: string) => {
        if (audioRefs.current && audioRefs.current[name]) {
          audioRefs.current[name].pause()
          audioRefs.current[name].currentTime = 0
        }
      }

      // Helper for Bomb Hit
      const handleBombHit = (bx: number, by: number) => {
        if (gameData.current.gameMode === "hardcode") {

          // 1. Stop falling sound immediately
          stopSound("bomb_fall")

          // 2. Play insta sound immediately
          playSound("critical_bomb")

          // 3️⃣ Hiệu ứng va chạm
          createParticles(bx, by, "#ffffff", "shard", true)

          // 4️⃣ SAU ĐÓ mới set trạng thái chết
          gameData.current.isDying = true
          gameData.current.deathX = bx
          gameData.current.deathY = by

          // 5️⃣ Delay chỉ dành cho hình ảnh + game over
          setTimeout(() => {
            setIsFlashWhite(true)
            setTimeout(() => setIsFlashWhite(false), 800)
            setGameState("over")
            playSound("gameover")
          }, 1250)

        } else {
          // Normal mode
          playSound("bomb")
          gameData.current.lives = Math.max(0, gameData.current.lives - 1)
          setLives(gameData.current.lives)

          setIsFlashWhite(true)
          setTimeout(() => setIsFlashWhite(false), 150)

          createParticles(bx, by, "#f97316", "explode", true)

          if (gameData.current.lives <= 0) {
            setGameState("over")
            stopSound("bomb_fall")
            playSound("gameover")
          }
        }

        gameData.current.combo = 0
        setComboCount(0)
      }

      const b = gameData.current.ball

      const widthDiff = gameData.current.targetWidth - gameData.current.playerWidth
      gameData.current.playerWidth += widthDiff * 0.1

      // --- Bot Logic ---
      if (gameData.current.isAuto && canvas.getAttribute("data-state") === "running" && !gameData.current.isDying) {
        const b = gameData.current.ball
        const paddleY = 460 // Tọa độ Y của thanh hứng
        const ts = gameData.current.timeScale || 1

        const timeToHit = (paddleY - b.y) / (b.speed * ts)
        let predictedX = b.x

        if (timeToHit > 0) {
          predictedX = b.x + b.dx * timeToHit

          // Bouncing Logic
          let tempX = predictedX
          const minX = b.radius
          const maxX = canvas.width - b.radius

          while (tempX < minX || tempX > maxX) {
            if (tempX < minX) {
              tempX = minX + (minX - tempX)
            } else if (tempX > maxX) {
              tempX = maxX - (tempX - maxX)
            }
          }
          predictedX = tempX

          // Yellow ball sine wave
          if (b.type === "yellow") {
            const futureSinTime = b.sinTime + 0.15 * timeToHit
            const dynamicAmplitude = b.speed * 2
            predictedX += Math.sin(futureSinTime) * dynamicAmplitude
          }
        }

        let targetPaddleCenterX = predictedX

        // 1. Avoid Main Ball if Bomb
        if (b.type === "orange") {
          const currentPaddleCenterX = gameData.current.playerX + gameData.current.playerWidth / 2
          const avoidDist = gameData.current.playerWidth / 2 + b.radius + 40
          if (currentPaddleCenterX < predictedX) {
            targetPaddleCenterX = predictedX - avoidDist
          } else {
            targetPaddleCenterX = predictedX + avoidDist
          }
        }

        // 2. Avoid Secondary Bombs
        gameData.current.bombs.forEach(bomb => {
          if (bomb.y > 200) {
            const bombX = bomb.x
            const minDist = gameData.current.playerWidth / 2 + bomb.radius + 15
            const dist = targetPaddleCenterX - bombX
            if (Math.abs(dist) < minDist) {
              if (dist > 0) targetPaddleCenterX += 25
              else targetPaddleCenterX -= 25
            }
          }
        })

        const targetX = targetPaddleCenterX - gameData.current.playerWidth / 2

        gameData.current.playerX += (targetX - gameData.current.playerX) * 0.5
      }

      gameData.current.playerX = Math.max(
        0,
        Math.min(gameData.current.playerX, canvas.width - gameData.current.playerWidth),
      )

      if (canvas.getAttribute("data-state") === "running" && !gameData.current.isDying) {
        const smoothFactor = 0.05
        gameData.current.timeScale +=
          (gameData.current.targetTimeScale - gameData.current.timeScale) * smoothFactor
        const prevBallY = b.y
        const ts = gameData.current.timeScale || 1
        b.y += b.speed * ts
        if (b.type === "yellow") {
          b.sinTime += 0.15
          // b.x += b.dx + Math.sin(b.sinTime) * 10
          // Thay bằng logic linh hoạt:
          if (b.type === "yellow") {
            b.sinTime += 0.15
            // Biên độ (amplitude) tỉ lệ thuận với tốc độ
            // b.speed càng cao, dao động càng rộng
            const dynamicAmplitude = b.speed * 3 // Bạn có thể chỉnh con số 4 này để tăng/giảm độ cong
            b.x += b.dx * ts + Math.sin(b.sinTime) * dynamicAmplitude * ts
          } else {
            b.x += b.dx * ts
          }
        } else {
          b.x += b.dx * ts
        }

        if (b.x - b.radius < 0) {
          b.x = b.radius
          if (b.type === "yellow") b.dx = Math.abs(b.dx) + 0.8 // Yellow ball bounces off walls
          else b.dx = Math.abs(b.dx) + 0.8
        } else if (b.x + b.radius > canvas.width) {
          b.x = canvas.width - b.radius
          if (b.type === "yellow") b.dx = -Math.abs(b.dx) - 0.8 // Yellow ball bounces off walls
          else b.dx = -Math.abs(b.dx) - 0.8
        }

        if (gameData.current.trailsEnabled) {
          trails.current.push({ x: b.x, y: b.y, alpha: 0.5 })
          if (trails.current.length > 8) trails.current.shift()
        } else trails.current = []

        // --- Update Bombs ---
        for (let i = gameData.current.bombs.length - 1; i >= 0; i--) {
          const bomb = gameData.current.bombs[i]
          bomb.y += bomb.speed * ts

          // Check collision with player
          const isInsideX = bomb.x >= gameData.current.playerX && bomb.x <= gameData.current.playerX + gameData.current.playerWidth
          const isHitY = bomb.y + bomb.radius >= 460 && bomb.y - bomb.speed * ts <= 460 + 15

          if (isInsideX && isHitY) {
            handleBombHit(bomb.x, bomb.y)
            gameData.current.bombs.splice(i, 1)
            if (gameData.current.bombs.length === 0 && gameData.current.ball.type !== "orange") {
              stopSound("bomb_fall")
            }
            continue
          }

          // Remove if out of bounds
          if (bomb.y > canvas.height) {
            gameData.current.bombs.splice(i, 1)
            if (gameData.current.bombs.length === 0 && gameData.current.ball.type !== "orange") {
              stopSound("bomb_fall")
            }
          }
        }

        // Gentle snow flurries while slow is active
        if (gameData.current.isSnowSlowed && Math.random() < 0.06) {
          particles.current.push({
            x: Math.random() * canvas.width,
            y: -12,
            vx: (Math.random() - 0.5) * 0.4,
            vy: Math.random() * 0.8 + 0.3,
            radius: Math.random() * 1.8 + 0.6,
            color: "#ffffff",
            alpha: 0.9,
            decay: 0.002,
            type: "shard",
          })
        }

        const isInsideX =
          b.x >= gameData.current.playerX && b.x <= gameData.current.playerX + gameData.current.playerWidth
        const isHitY = b.y + b.radius >= 460 && prevBallY <= 460 + 15

        if (isInsideX && isHitY) {
          const isCenter =
            Math.abs(b.x - (gameData.current.playerX + gameData.current.playerWidth / 2)) <
            (gameData.current.playerWidth * 0.3) / 2
          if (b.type === "grey") {
            gameData.current.hasShield = true
            playSound("shield")
            createParticles(b.x, b.y, "#cbd5e1", "absorb", true)
          } else if (b.type === "boost") {
            gameData.current.targetWidth = 160
            gameData.current.isBoosted = true
            gameData.current.boostTimeLeft = 8
            playSound("boost")
            clearInterval(boostInterval)
            boostInterval = setInterval(() => {
              if (canvas.getAttribute("data-state") !== "running") return
              gameData.current.boostTimeLeft -= 1
              if (gameData.current.boostTimeLeft <= 0) {
                gameData.current.targetWidth = 80
                gameData.current.isBoosted = false
                playSound("boost_end")
                clearInterval(boostInterval)
              }
            }, 1000)
            createParticles(b.x, b.y, "#3b82f6", "absorb", true)
          } else if (b.type === "snow") {
            // Snowball: slows the whole game for 10s (only effective when score >= 500)
            if (gameData.current.score >= 500) {
              gameData.current.targetTimeScale = 0.4
              gameData.current.snowTimeLeft = 10
              gameData.current.isSnowSlowed = true
              setSnowLeft(10)
              setSnowActive(true)
              playSound("snow")
              createParticles(b.x, b.y, "#ffffff", "explode", true)
              if (snowIntervalRef.current) {
                clearInterval(snowIntervalRef.current)
                snowIntervalRef.current = null
              }
              snowIntervalRef.current = window.setInterval(() => {
                if (canvas.getAttribute("data-state") !== "running") return
                gameData.current.snowTimeLeft -= 1
                setSnowLeft(gameData.current.snowTimeLeft)
                if (gameData.current.snowTimeLeft <= 0) {
                  gameData.current.targetTimeScale = 1
                  gameData.current.isSnowSlowed = false
                  setSnowActive(false)
                  setSnowLeft(0)
                  playSound("snow_end")
                  if (snowIntervalRef.current) {
                    clearInterval(snowIntervalRef.current)
                    snowIntervalRef.current = null
                  }
                }
              }, 1000)
            } else {
              // If score < 500, just a normal white catch visual
              createParticles(b.x, b.y, "#ffffff", "explode", true)
            }
          } else if (b.type === "orange") {
            handleBombHit(b.x, b.y)
            if (gameData.current.bombs.length === 0) stopSound("bomb_fall")
          } else createParticles(b.x, b.y, ballColors[b.type], "explode", isCenter)

          if (b.type === "heal") {
            gameData.current.lives = Math.min(gameData.current.lives + 1, 5)
            setLives(gameData.current.lives)
            playSound("heal")
          }

          let scoreAdd = b.type === "orange" ? 0 : 1
          if (isCenter) {
            gameData.current.combo = Math.min(gameData.current.combo + 1, 6)
            setComboCount(gameData.current.combo)
            setShowCombo(true)
            setTimeout(() => setShowCombo(false), 500)
            playSound("combo", gameData.current.combo - 1)
            scoreAdd += gameData.current.combo
          } else {
            if (b.type !== "orange") gameData.current.combo = 0
            setComboCount(0)
            playSound("catch")
          }
          if (b.type === "purple") scoreAdd += 2
          if (b.type === "yellow") scoreAdd += 9
          
          gameData.current.score += scoreAdd
          
          const currentBest = (gameData.current.isClassic || gameData.current.isCustom)
            ? (gameData.current.gameMode === "hardcode" ? gameData.current.bestClassicHardcore : gameData.current.bestClassicNormal)
            : (gameData.current.gameMode === "hardcode" ? gameData.current.bestHardcore : gameData.current.bestNormal)

          if (gameData.current.score > currentBest && !gameData.current.isAuto && !gameData.current.isCustom) {
            if (!gameData.current.hasPlayedNewBest) {
              playSound("newbest")
              setShowNewBest(true)
              gameData.current.hasPlayedNewBest = true
              createParticles(canvas.width / 4, canvas.height / 3, "#facc15", "firework", true)
              createParticles((3 * canvas.width) / 4, canvas.height / 3, "#facc15", "firework", true)
              setTimeout(() => setShowNewBest(false), 2500)
            }
            
            if (gameData.current.isClassic) {
              if (gameData.current.gameMode === "hardcode") {
                setBestScoreClassicHardcore(gameData.current.score)
                gameData.current.bestClassicHardcore = gameData.current.score
                localStorage.setItem("my_game_best_classic_hardcore", String(gameData.current.score ^ 0xaa))
              } else {
                setBestScoreClassicNormal(gameData.current.score)
                gameData.current.bestClassicNormal = gameData.current.score
                localStorage.setItem("my_game_best_classic_normal", String(gameData.current.score ^ 0xaa))
              }
            } else if (gameData.current.gameMode === "hardcode") {
                setBestScoreHardcore(gameData.current.score)
                gameData.current.bestHardcore = gameData.current.score
                localStorage.setItem("my_game_best_hardcore", String(gameData.current.score ^ 0xaa))
            } else {
              setBestScoreNormal(gameData.current.score)
              gameData.current.bestNormal = gameData.current.score
              localStorage.setItem("my_game_best_normal", String(gameData.current.score ^ 0xaa))
            }
          }
          setScore(gameData.current.score)
          resetBall()
        }

        if (b.y > canvas.height) {
          if (["normal", "purple", "yellow", "orange"].includes(b.type)) {
            if (gameData.current.hasShield) {
              gameData.current.hasShield = false
              playSound("shield_breaking")
              createParticles(b.x, canvas.height - 6, "#94a3b8", "shard", true)
              gameData.current.combo = 0
              setComboCount(0)
              resetBall()
            } else if (b.type === "orange") {
              resetBall() // Bomb fell out safely
              if (gameData.current.bombs.length === 0) stopSound("bomb_fall")
            } else {
              gameData.current.lives--
              setLives(gameData.current.lives)
              playSound("miss")
              setIsFlashRed(true)
              setTimeout(() => setIsFlashRed(false), 150)
              createParticles(b.x, canvas.height - 6, "#ef4444", "miss", true)
              gameData.current.combo = 0
              setComboCount(0)
              if (gameData.current.lives <= 0) {
                setGameState("over")
                // Ensure snow effect cleaned up on game over
                if (gameData.current.isSnowSlowed) {
                  gameData.current.timeScale = 1
                  gameData.current.isSnowSlowed = false
                  gameData.current.snowTimeLeft = 0
                  if (snowIntervalRef.current) {
                    clearInterval(snowIntervalRef.current)
                    snowIntervalRef.current = null
                  }
                }
                stopSound("bomb_fall")
                playSound("gameover")
              }
              resetBall()
            }
          } else resetBall()
        }
      }

      // --- Render Logic ---
      if (gameData.current.hasShield) {
        ctx.save()
        ctx.shadowBlur = 20
        ctx.shadowColor = "rgba(148, 163, 184, 0.8)"
        ctx.fillStyle = "rgba(148, 163, 184, 0.6)"
        ctx.fillRect(0, canvas.height - 12, canvas.width, 12)
        ctx.restore()
      }

      if (gameData.current.trailsEnabled) {
        trails.current.forEach((t, i) => {
          t.alpha -= 0.05
          ctx.globalAlpha = Math.max(0, t.alpha)
          ctx.fillStyle = ballColors[b.type]
          ctx.beginPath()
          ctx.arc(t.x, t.y, b.radius * (i / 8), 0, Math.PI * 2)
          ctx.fill()
        })
      }

      if (gameData.current.particlesEnabled) {
        particles.current.forEach((p, i) => {
          if (p.type === "absorb") {
            const tX = gameData.current.playerX + gameData.current.playerWidth / 2
            p.x += (tX - p.x) * 0.15
            p.y += (460 - p.y) * 0.15
          } else {
            p.x += p.vx
            p.y += p.vy
          }
          p.alpha -= p.decay
          if (p.alpha <= 0) particles.current.splice(i, 1)
          else {
            ctx.globalAlpha = p.alpha
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      }

      // Render Bombs
      gameData.current.bombs.forEach(bomb => {
        ctx.beginPath()
        ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2)
        ctx.fillStyle = ballColors.orange
        ctx.fill()
        ctx.closePath()
      })

      ctx.globalAlpha = 1
      const pc =
        gameData.current.isBoosted && gameData.current.boostTimeLeft <= 2 && Math.floor(Date.now() / 100) % 2 === 0
          ? "#60a5fa"
          : gameData.current.isBoosted
            ? "#60a5fa"
            : "#3b82f6"
      ctx.fillStyle = pc
      ctx.beginPath()
      ctx.roundRect(gameData.current.playerX, 460, gameData.current.playerWidth, 15, 8)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      ctx.fillStyle = ballColors[b.type]
      ctx.fill()
      ctx.closePath()

      // Render Death Effect (Glowing Bomb)
      if (gameData.current.isDying) {
        const dx = gameData.current.deathX
        const dy = gameData.current.deathY
        ctx.save()
        ctx.shadowBlur = 30
        ctx.shadowColor = ballColors.orange
        ctx.fillStyle = "#fff7ed"
        ctx.beginPath()
        ctx.arc(dx, dy, 15 + Math.sin(Date.now() / 50) * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      requestRef.current = requestAnimationFrame(update)
    }

    update()
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("touchmove", handleMove)
      clearInterval(boostInterval)
      if (snowIntervalRef.current) {
        clearInterval(snowIntervalRef.current)
        snowIntervalRef.current = null
      }
      clearCountdownTimeouts()
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  const menuContainerVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 24 },
    visible: {
      opacity: 1, scale: 1, y: 0,
      transition: animationsEnabled 
        ? { type: "spring", stiffness: 450, damping: 28, staggerChildren: 0.06 }
        : { duration: 0 }
    },
    exit: { opacity: 0, scale: 0.96, y: -12, transition: { duration: animationsEnabled ? 0.25 : 0 } },
  }

  const menuItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: animationsEnabled ? { type: "spring", stiffness: 500, damping: 30 } : { duration: 0 } },
    exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: animationsEnabled ? 0.18 : 0 } },
  }

  const guideVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: animationsEnabled ? { type: "spring", stiffness: 360, damping: 28 } : { duration: 0 } },
    exit: { opacity: 0, y: -18, scale: 0.985, transition: { duration: animationsEnabled ? 0.28 : 0, ease: "easeInOut" } },
  }

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center overflow-hidden touch-none font-sans select-none md:p-4">
      {!animationsEnabled && (
        <style>{`
          .transition-all, .transition-colors, .transition-transform, .transition-opacity, .animate-pulse, .animate-spin {
            transition: none !important;
            animation: none !important;
          }
        `}</style>
      )}
      <AnimatePresence>
        {isFlashRed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={animationsEnabled ? undefined : { duration: 0 }}
            className="fixed inset-0 z-[100] bg-red-600 pointer-events-none"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isFlashWhite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={animationsEnabled ? undefined : { duration: 0 }}
            className="fixed inset-0 z-[100] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCombo && (
          <motion.div
            key={comboCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2.5, opacity: 0 }}
            transition={animationsEnabled ? undefined : { duration: 0 }}
            className="fixed z-50 pointer-events-none text-yellow-400 font-black italic text-6xl drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]"
          >
            {comboCount >= 6 ? t.max : `X${comboCount}`}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewBest && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: -100, opacity: 1 }}
            exit={{ y: -200, opacity: 0 }}
            transition={animationsEnabled ? undefined : { duration: 0 }}
            className="fixed z-[60] pointer-events-none flex flex-col items-center"
          >
            <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 p-1 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.5)]">
              <div className="bg-slate-900 px-8 py-3 rounded-xl flex items-center gap-3">
                <Star className="text-yellow-400 fill-yellow-400 animate-spin" size={24} />
                <span className="text-white font-black italic text-3xl tracking-tighter uppercase">{t.newBest}</span>
                <Star className="text-yellow-400 fill-yellow-400 animate-spin" size={24} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NEW HUD (Heads-Up Display) --- */}
      <div
        className={`relative w-full md:max-w-[400px] h-[calc(100vh-80px)] md:h-auto md:aspect-[4/5.5] rounded-none md:rounded-[2.5rem] overflow-auto md:overflow-hidden shadow-2xl border-0 md:border-[10px] transition-all duration-300 ${isFlashRed ? "md:border-red-600" : "md:border-slate-800"} bg-slate-900 flex items-center justify-center`}
      >
        <canvas
          ref={canvasRef}
          data-state={gameState}
          width="400"
          height="550"
          className="block cursor-none max-w-full max-h-full w-auto h-auto"
          style={{
            aspectRatio: "400/550",
          }}
        />

        {(gameState === "running" || gameState === "paused") && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
            {/* Score */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t.score}</span>
              <span className="text-xl font-black text-yellow-400 italic tabular-nums leading-none">{score}</span>
            </div>

            {/* Lives */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t.lives}</span>
              {gameMode === "hardcode" ? (
                <div className="flex items-center justify-center h-2.5">
                  <Heart size={16} className="text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                </div>
              ) : (
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full border border-white/10 transition-colors ${i < lives ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" : "bg-slate-700/50"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Best */}
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t.best}</span>
              <span className="text-xl font-black text-emerald-400 italic tabular-nums leading-none">
                {isClassic 
                  ? (gameMode === "hardcode" ? bestScoreClassicHardcore : bestScoreClassicNormal)
                  : (gameMode === "hardcode" ? bestScoreHardcore : bestScoreNormal)}
              </span>
            </div>

            {/* Snow Freeze Badge */}
            {snowActive && (
              <div className="flex flex-col items-center gap-1 mr-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t.freeze}</span>
                <div className="text-xs font-black text-white bg-white/5 px-2 py-1 rounded-full flex items-center gap-2 tabular-nums">
                  <span className="text-[12px]">❄️</span>
                  <span>{snowLeft}s</span>
                </div>
              </div>
            )}

            {/* Pause Button */}
            <button
              onClick={pauseGame}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md border border-white/20 transition-all active:scale-90"
            >
              <Pause size={16} className="text-white fill-white" />
            </button>
          </div>
        )}

        {/* MÀN HÌNH TẠM DỪNG CẢI TIẾP */}
        {gameState === "paused" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={animationsEnabled ? undefined : { duration: 0 }}
            className="absolute inset-0 z-[70] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center w-full max-w-[280px] h-full overflow-y-auto"
            >
              <div className="relative w-full mb-8">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">{t.gamePaused}</h2>
                {isMobile && (
                  <button
                    onClick={toggleAutoMode}
                    className="absolute left-[14px] top-0 w-[20px] h-[36px] opacity-0 cursor-pointer"
                    aria-label={t.auto}
                  />
                )}
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">
                {t.currentScore}: <span className="text-yellow-400">{score}</span>
              </p>

              <div className="w-full space-y-3 mb-8">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest text-left mb-4">
                  {t.quickSettings}
                </h3>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    {isMuted ? (
                      <VolumeX size={16} className="text-red-500" />
                    ) : (
                      <Volume2 size={16} className="text-green-500" />
                    )}
                    <span className="text-white font-bold uppercase tracking-widest text-xs">{t.audio}</span>
                  </div>
                  <button
                    onClick={toggleMute}
                    className={`w-12 h-6 rounded-full relative transition-colors ${isMuted ? "bg-slate-700" : "bg-green-600"}`}
                  >
                    <motion.div
                      layout
                      transition={animationsEnabled ? undefined : { duration: 0 }}
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full ${isMuted ? "left-1" : "left-6"}`}
                    />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className={particlesEnabled ? "text-yellow-400" : "text-slate-500"} />
                    <span className="text-white font-bold uppercase tracking-widest text-xs">{t.particles}</span>
                  </div>
                  <button
                    onClick={toggleParticles}
                    className={`w-12 h-6 rounded-full relative transition-colors ${!particlesEnabled ? "bg-slate-700" : "bg-blue-600"}`}
                  >
                    <motion.div
                      layout
                      transition={animationsEnabled ? undefined : { duration: 0 }}
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full ${!particlesEnabled ? "left-1" : "left-6"}`}
                    />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Wind size={16} className={trailsEnabled ? "text-blue-400" : "text-slate-500"} />
                    <span className="text-white font-bold uppercase tracking-widest text-xs">{t.trails}</span>
                  </div>
                  <button
                    onClick={toggleTrails}
                    className={`w-12 h-6 rounded-full relative transition-colors ${!trailsEnabled ? "bg-slate-700" : "bg-blue-600"}`}
                  >
                    <motion.div
                      layout
                      transition={animationsEnabled ? undefined : { duration: 0 }}
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full ${!trailsEnabled ? "left-1" : "left-6"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={resumeGame}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
                >
                  <Play size={20} fill="currentColor" /> {t.continue}
                </button>

                <button
                  onClick={handleExitRequest}
                  className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all border ${confirmExit ? "bg-red-600 text-white border-red-500 animate-pulse" : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700"}`}
                >
                  {confirmExit ? <AlertCircle size={20} /> : <Home size={20} />}
                  {confirmExit ? t.confirmExit : t.mainMenu}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState === "countdown" && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={animationsEnabled ? undefined : { duration: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm"
          >
            <span className="text-white font-black text-9xl italic drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
              {countdown}
            </span>
          </motion.div>
        )}

        {gameState !== "running" && gameState !== "countdown" && gameState !== "paused" && !openGuide && !openCustom && (
          <motion.div
            variants={menuContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
          >
            {gameState === "start" ? (
              <motion.div variants={menuItemVariants} className="w-full flex flex-col items-center" key="start">
                <motion.div variants={menuItemVariants} className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/40">
                  <Zap size={32} className="text-white fill-white" />
                </motion.div>
                <motion.h2 variants={menuItemVariants} className="text-4xl font-black mb-6 text-white italic uppercase tracking-tighter">Catch Master</motion.h2>
                
                {/* PLAY BUTTON */}
                <motion.button
                  variants={menuItemVariants}
                  onClick={() => startCountdown(isAuto, gameMode)}
                  className={`w-full py-5 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 shadow-xl transition-all mb-6 ${
                    gameMode === "hardcode" 
                      ? "bg-gradient-to-r from-red-600 to-orange-600 shadow-red-500/30 text-white" 
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/30 text-white"
                  }`}
                >
                  <Play size={32} fill="currentColor" />
                  {t.play}
                </motion.button>

                {/* CUSTOM BUTTON */}
                <motion.button
                  variants={menuItemVariants}
                  onClick={() => setOpenCustom(true)}
                  className="w-full py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all mb-6 bg-slate-800 text-slate-300 border border-white/5 hover:bg-slate-700 hover:text-white"
                >
                  <Edit3 size={20} /> {t.custom}
                </motion.button>

                {/* OPTIONS ROW */}
                <motion.div variants={menuItemVariants} className="flex gap-4 w-full mb-8">
                  <button
                    onClick={() => setIsAuto(!isAuto)}
                    className={`flex-1 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all border ${
                      isAuto 
                        ? "bg-green-600/20 border-green-500 text-green-400" 
                        : "bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700"
                    }`}
                  >
                    <Cpu size={24} />
                    <span className="text-[10px] uppercase tracking-widest">{t.auto}</span>
                  </button>
                  <button
                    onClick={() => setIsClassic(!isClassic)}
                    className={`flex-1 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all border ${
                      isClassic
                        ? "bg-yellow-600/20 border-yellow-500 text-yellow-400"
                        : "bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700"
                    }`}
                  >
                    <Disc size={24} />
                    <span className="text-[10px] uppercase tracking-widest">{t.classic}</span>
                  </button>
                  <button
                    onClick={() => setGameMode(gameMode === "normal" ? "hardcode" : "normal")}
                    className={`flex-1 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all border ${
                      gameMode === "hardcode"
                        ? "bg-red-600/20 border-red-500 text-red-400"
                        : "bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700"
                    }`}
                  >
                    <Skull size={24} />
                    <span className="text-[10px] uppercase tracking-widest">{t.hardcore}</span>
                  </button>
                </motion.div>

                <motion.div variants={menuItemVariants} className="flex gap-4">
                  <motion.button
                    variants={menuItemVariants}
                    onClick={() => setOpenGuide(true)}
                    className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 backdrop-blur-sm text-xs uppercase tracking-wider"
                    title={t.ballGuide}
                  >
                    <Info size={18} /> {t.guide}
                  </motion.button>
                  <motion.button
                    variants={menuItemVariants}
                    onClick={() => setOpenStats(true)}
                    className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40 backdrop-blur-sm text-xs uppercase tracking-wider"
                  >
                    <BarChart3 size={18} /> {t.stats}
                  </motion.button>
                  <motion.button
                    variants={menuItemVariants}
                    onClick={() => setOpenSettings(true)}
                    className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-600/20 bg-slate-700/20 text-slate-400 hover:bg-slate-700/40 hover:border-slate-500/40 backdrop-blur-sm text-xs uppercase tracking-wider"
                  >
                    <Settings size={18} /> {t.settings}
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div variants={menuItemVariants} className="flex flex-col items-center" key="over">
                <motion.div variants={menuItemVariants} animate={animationsEnabled ? { scale: [0.94, 1.08, 1] } : { scale: 1 }} transition={animationsEnabled ? { duration: 0.7, times: [0, 0.7, 1], type: "spring", stiffness: 400, damping: 12 } : { duration: 0 }}>
                  <Trophy size={80} className="text-yellow-500 mb-6" />
                </motion.div>
                <motion.h2 variants={menuItemVariants} className="text-5xl font-black mb-2 text-white italic uppercase tracking-tighter">{t.gameOver}</motion.h2>
                <motion.div variants={menuItemVariants} className="text-7xl font-black text-yellow-400 mb-12 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                  {score}
                </motion.div>
                <motion.div variants={menuItemVariants} className="flex gap-4 pointer-events-auto">
                  <motion.button
                    variants={menuItemVariants}
                    onClick={() => setGameState("start")}
                    className="px-10 py-4 bg-slate-800 text-white font-black rounded-full flex items-center gap-3 border border-white/10 hover:bg-slate-700 transition-all"
                  >
                    <Home size={24} /> {t.home}
                  </motion.button>
                  <motion.button
                    variants={menuItemVariants}
                    onClick={() => setOpenSettings(true)}
                    className="p-4 bg-slate-800 text-white rounded-full border border-white/10"
                  >
                    <Settings size={24} />
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {isAuto && gameState === "running" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md">
          <Cpu size={14} className="text-green-500 animate-spin" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">{t.botActive}</span>
        </div>
      )}

      <AnimatePresence>
        {snowActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={animationsEnabled ? { duration: 0.5 } : { duration: 0 }}
            className="absolute inset-0 z-[75] pointer-events-none"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={animationsEnabled ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={animationsEnabled ? { duration: 3, repeat: Infinity } : { duration: 0 }}
              className="absolute inset-0 backdrop-blur-sm mix-blend-screen"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openCustom && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={animationsEnabled ? { type: "spring", damping: 25 } : { duration: 0 }}
            className="absolute inset-0 z-[80] bg-slate-900 p-8 flex flex-col border-t-4 border-purple-600 rounded-t-[3rem]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.customGame}</h3>
              <button onClick={() => setOpenCustom(false)} className="text-slate-400 hover:text-white">
                <X size={32} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Mode & Auto Selection */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-2">
                <button
                  onClick={() => setCustomConfig(prev => ({ ...prev, mode: "normal" }))}
                  className={`flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all ${customConfig.mode === "normal" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-800 text-slate-500"}`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setCustomConfig(prev => ({ ...prev, mode: "hardcode" }))}
                  className={`flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all ${customConfig.mode === "hardcode" ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "bg-slate-800 text-slate-500"}`}
                >
                  Hardcore
                </button>
                <button
                  onClick={() => setCustomConfig(prev => ({ ...prev, isAuto: !prev.isAuto }))}
                  className={`flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 ${customConfig.isAuto ? "bg-green-600 text-white shadow-lg shadow-green-500/20" : "bg-slate-800 text-slate-500"}`}
                >
                  <Cpu size={16} />
                  {t.auto}
                </button>
              </div>

              {/* Ball Selection */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{t.selectBalls}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "normal", color: "bg-red-500", label: t.ballNormal },
                    { id: "purple", color: "bg-purple-500", label: t.ballFast },
                    { id: "yellow", color: "bg-yellow-500", label: t.ballZicZac },
                    { id: "boost", color: "bg-blue-500", label: t.ballBooster },
                    { id: "grey", color: "bg-slate-400", label: t.ballShield },
                    { id: "snow", color: "bg-white", label: t.ballSnow },
                    { id: "orange", color: "bg-orange-500", label: t.ballBomb },
                    { id: "heal", color: "bg-green-500", label: t.ballHeal },
                  ].map((ball) => (
                    <button
                      key={ball.id}
                      onClick={() => setCustomConfig(prev => ({
                        ...prev,
                        balls: { ...prev.balls, [ball.id]: !prev.balls[ball.id as keyof typeof prev.balls] }
                      }))}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${customConfig.balls[ball.id as keyof typeof customConfig.balls] ? "bg-slate-800 border-white/20" : "bg-slate-900/50 border-transparent opacity-50"}`}
                    >
                      <div className={`w-4 h-4 rounded-full ${ball.color} shadow-sm`} />
                      <span className={`text-xs font-bold uppercase ${customConfig.balls[ball.id as keyof typeof customConfig.balls] ? "text-white" : "text-slate-500"}`}>{ball.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={startCustomGame}
              className="w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
            >
              <Play size={20} fill="currentColor" /> {t.startCustom}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openSettings && (
          <SettingsModal
            t={t}
            language={language}
            setLanguage={changeLanguage}
            isMuted={isMuted}
            toggleMute={toggleMute}
            particlesEnabled={particlesEnabled}
            toggleParticles={toggleParticles}
            trailsEnabled={trailsEnabled}
            toggleTrails={toggleTrails}
            animationsEnabled={animationsEnabled}
            toggleAnimations={toggleAnimations}
            onClose={() => setOpenSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openStats && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={animationsEnabled ? { type: "spring", damping: 25 } : { duration: 0 }}
            className="absolute inset-0 z-[80] bg-slate-900 p-8 flex flex-col border-t-4 border-emerald-600 rounded-t-[3rem]"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.statistics}</h3>
              <button onClick={() => setOpenStats(false)} className="text-slate-400 hover:text-white">
                <X size={32} />
              </button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto">
              
              {/* DEFAULT MODES */}
              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.defaultMode}</h4>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-2 uppercase tracking-widest border-b border-white/5 pb-2">
                  <span>{t.bestNormal}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-xl font-black tabular-nums">{bestScoreNormal}</span>
                    <button
                      onClick={() => {
                        if (!confirmResetNormal) {
                          setConfirmResetNormal(true)
                          setTimeout(() => setConfirmResetNormal(false), 3000)
                          return
                        }
                        localStorage.removeItem("my_game_best_normal")
                        setBestScoreNormal(0)
                        gameData.current.bestNormal = 0
                        setConfirmResetNormal(false)
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${confirmResetNormal ? "bg-red-600 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                    >
                      {confirmResetNormal ? <Trash2 size={14} /> : <RotateCcw size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-2 uppercase tracking-widest">
                  <span>{t.bestHardcore}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-xl font-black tabular-nums">{bestScoreHardcore}</span>
                    <button
                      onClick={() => {
                        if (!confirmResetHardcore) {
                          setConfirmResetHardcore(true)
                          setTimeout(() => setConfirmResetHardcore(false), 3000)
                          return
                        }
                        localStorage.removeItem("my_game_best_hardcore")
                        setBestScoreHardcore(0)
                        gameData.current.bestHardcore = 0
                        setConfirmResetHardcore(false)
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${confirmResetHardcore ? "bg-red-600 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                    >
                      {confirmResetHardcore ? <Trash2 size={14} /> : <RotateCcw size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* CLASSIC MODES */}
              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.classicMode}</h4>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-2 uppercase tracking-widest border-b border-white/5 pb-2">
                  <span>{t.bestNormal}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-xl font-black tabular-nums">{bestScoreClassicNormal}</span>
                    <button
                      onClick={() => {
                        if (!confirmResetClassicNormal) {
                          setConfirmResetClassicNormal(true)
                          setTimeout(() => setConfirmResetClassicNormal(false), 3000)
                          return
                        }
                        localStorage.removeItem("my_game_best_classic_normal")
                        setBestScoreClassicNormal(0)
                        gameData.current.bestClassicNormal = 0
                        setConfirmResetClassicNormal(false)
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${confirmResetClassicNormal ? "bg-red-600 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                    >
                      {confirmResetClassicNormal ? <Trash2 size={14} /> : <RotateCcw size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-2 uppercase tracking-widest">
                  <span>{t.bestHardcore}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 text-xl font-black tabular-nums">{bestScoreClassicHardcore}</span>
                    <button
                      onClick={() => {
                        if (!confirmResetClassicHardcore) {
                          setConfirmResetClassicHardcore(true)
                          setTimeout(() => setConfirmResetClassicHardcore(false), 3000)
                          return
                        }
                        localStorage.removeItem("my_game_best_classic_hardcore")
                        setBestScoreClassicHardcore(0)
                        gameData.current.bestClassicHardcore = 0
                        setConfirmResetClassicHardcore(false)
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${confirmResetClassicHardcore ? "bg-red-600 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                    >
                      {confirmResetClassicHardcore ? <Trash2 size={14} /> : <RotateCcw size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4 mt-4">
                <button
                  onClick={() => {
                    if (!confirmReset) {
                      setConfirmReset(true)
                      setTimeout(() => setConfirmReset(false), 3000)
                      return
                    }
                    localStorage.removeItem("my_game_best_normal")
                    localStorage.removeItem("my_game_best_hardcore")
                    localStorage.removeItem("my_game_best_classic_normal")
                    localStorage.removeItem("my_game_best_classic_hardcore")
                    setBestScoreNormal(0)
                    setBestScoreHardcore(0)
                    setBestScoreClassicNormal(0)
                    setBestScoreClassicHardcore(0)
                    gameData.current.bestNormal = 0
                    gameData.current.bestHardcore = 0
                    gameData.current.bestClassicNormal = 0
                    gameData.current.bestClassicHardcore = 0
                    setConfirmReset(false)
                  }}
                  className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 text-xs uppercase transition-all ${confirmReset ? "bg-red-600 text-white animate-pulse" : "bg-slate-800 text-red-400 hover:bg-slate-700"}`}
                >
                  {confirmReset ? t.confirmDeleteAll : t.clearAllRecords}
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {openGuide && (
        <motion.div
          variants={menuContainerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 z-[80] bg-slate-950/98 backdrop-blur-xl p-6 flex flex-col border-t-4 border-purple-500 rounded-t-[3rem] shadow-2xl"
        >
          {/* HEADER SECTION */}
          <motion.div variants={menuItemVariants} className="flex justify-between items-center mb-8 px-2">
            <div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none">{t.ballGuide}</h3>
              <p className="text-purple-500 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">{t.manualDatabase}</p>
            </div>
            <motion.button
              whileHover={animationsEnabled ? { scale: 1.1, rotate: 90 } : {}}
              whileTap={animationsEnabled ? { scale: 0.9 } : {}}
              onClick={() => setOpenGuide(false)}
              className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-700"
            >
              <X size={28} />
            </motion.button>
          </motion.div>

          {/* LIST CONTAINER */}
          <motion.div variants={menuItemVariants} className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">

            {/* NORMAL BALL */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group">
              <div className="w-14 h-14 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex-shrink-0 border-4 border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-red-500 font-black text-xl uppercase italic">{t.ballNormal}</h4>
                  <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold border border-red-500/20">{t.basic}</span>
                </div>
                <p className="text-slate-400 text-xs mb-3 italic">{t.ballNormalDesc}</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">0 {t.pts}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-green-400">{t.scorePlus1}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-yellow-500">{t.incrementalSpeed}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.allModes}</span></div>
                </div>
              </div>
            </div>

            {/* FAST BALL */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group border-l-4 border-l-purple-500">
              <div className="w-14 h-14 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] flex-shrink-0 border-4 border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-purple-400 font-black text-xl uppercase italic">{t.ballFast}</h4>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold border border-purple-500/20">{t.speed}</span>
                </div>
                <p className="text-slate-400 text-xs mb-3 italic">{t.ballFastDesc}</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">50 {t.pts}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-green-400">{t.scorePlus3}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-red-500">{t.lowReactionTime}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
                </div>
              </div>
            </div>

            {/* ZICZAC BALL */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group border-l-4 border-l-yellow-500">
              <div className="w-14 h-14 rounded-full bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] flex-shrink-0 border-4 border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-yellow-400 font-black text-xl uppercase italic">{t.ballZicZac}</h4>
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/20">{t.tricky}</span>
                </div>
                <p className="text-slate-400 text-xs mb-3 italic">{t.ballZicZacDesc}</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">100 {t.pts}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-green-400">{t.scorePlus10}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-red-500">{t.sharpAngles}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
                </div>
              </div>
            </div>

            {/* BOOSTER BALL */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group">
              <div className="w-14 h-14 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] flex-shrink-0 border-4 border-white/10 animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-blue-400 font-black text-xl uppercase italic">{t.ballBooster}</h4>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/20">{t.buff}</span>
                </div>
                <p className="text-slate-400 text-xs mb-3 italic">{t.ballBoosterDesc}</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">200 {t.pts}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-cyan-400">{t.paddleSize}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-green-500">{t.none}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
                </div>
              </div>
            </div>

            {/* SHIELD BALL */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group">
              <div className="w-14 h-14 rounded-full bg-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.5)] flex-shrink-0 border-4 border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-slate-300 font-black text-xl uppercase italic">{t.ballShield}</h4>
                  <span className="text-[10px] bg-slate-100/10 text-slate-300 px-2 py-0.5 rounded-full font-bold border border-slate-500/20">{t.defense}</span>
                </div>
                <p className="text-slate-400 text-xs mb-3 italic">{t.ballShieldDesc}</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">300 {t.pts}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-cyan-400">{t.armor}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-green-500">{t.none}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.allModes}</span></div>
                </div>
              </div>
            </div>

            {/* SNOW BALL */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group border-l-4 border-l-cyan-300">
              <div className="w-14 h-14 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.7)] flex-shrink-0 border-4 border-cyan-100/50" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-black text-xl uppercase italic">{t.ballSnow}</h4>
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold border border-white/30">{t.time}</span>
                </div>
                <p className="text-slate-400 text-xs mb-3 italic">{t.ballSnowDesc}</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">≥500 {t.pts}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-cyan-300">{t.freeze10s}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-yellow-500">{t.momentumLoss}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
                </div>
              </div>
            </div>

            {/* BOMB BALL */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group border-l-4 border-l-orange-500">
              <div className="w-14 h-14 rounded-full bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] flex-shrink-0 border-4 border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-orange-500 font-black text-xl uppercase italic">{t.ballBomb}</h4>
                  <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-bold border border-orange-500/20">{t.danger}</span>
                </div>
                <p className="text-slate-400 text-xs mb-3 italic">{t.ballBombDesc}</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">2 {t.pts}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-red-500">{t.lifeLoss}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-red-500">{t.extreme}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
                </div>
              </div>
            </div>

            {/* HEAL BALL */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group">
              <div className="w-14 h-14 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] flex-shrink-0 border-4 border-white/10" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-green-400 font-black text-xl uppercase italic">{t.ballHeal}</h4>
                  <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/20">{t.life}</span>
                </div>
                <p className="text-slate-400 text-xs mb-3 italic">{t.ballHealDesc}</p>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">150 {t.pts}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-green-400">{t.hpPlus}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-green-500">{t.harmless}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.normalAndClassic}</span></div>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

function GuideItem({ color, name, info }: { color: string; name: string; info: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-white/90 text-[11px] font-black uppercase tracking-tight">{name}</span>
      </div>
      <span className="text-slate-500 text-[10px] font-bold italic">{info}</span>
    </div>
  )
}
