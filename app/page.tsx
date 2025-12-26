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
  Palette,
  Music,
  RefreshCw,
  Undo2,
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
  const [snowLeft, setSnowLeft] = useState(0)
  const [snowActive, setSnowActive] = useState(false)
  const [language, setLanguage] = useState<"en" | "vi" | "es" | "ru">("en")
  const [skin, setSkin] = useState("default")
  const [openCustom, setOpenCustom] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)
  const [customConfig, setCustomConfig] = useState({
    mode: "normal" as "normal" | "hardcode",
    isAuto: false,
    balls: {
      normal: { enabled: true, score: 0, rate: 40 },
      purple: { enabled: true, score: 50, rate: 30 },
      yellow: { enabled: true, score: 100, rate: 15 },
      boost: { enabled: true, score: 200, rate: 3 },
      grey: { enabled: true, score: 300, rate: 2 },
      snow: { enabled: true, score: 500, rate: 3 },
      orange: { enabled: true, score: 2, rate: 2 },
      heal: { enabled: true, score: 150, rate: 5 },
    }
  })

  const [activeTab, setActiveTab] = useState<"home" | "guide" | "stats" | "skins" | "settings">("home")
  const [direction, setDirection] = useState(0)

  const [configHistory, setConfigHistory] = useState<typeof customConfig[]>([])
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [sfxVolume, setSfxVolume] = useState(0.5)
  const [bgMenuEnabled, setBgMenuEnabled] = useState(true)
  const [sensitivity, setSensitivity] = useState(0)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)

  // Intro modal: show on first page load / reload until user hits Start
  const [showIntro, setShowIntro] = useState(true)
  const [introStep, setIntroStep] = useState(0)

  const isMobile = useIsMobile()

  const gameData = useRef({
    score: 0,
    lives: 5,
    combo: 0,
    isAuto: false,
    isCustom: false,
    customBallConfig: {} as Record<string, { enabled: boolean; score: number; rate: number }>,
    allowedBalls: [] as string[],
    isClassic: false,
    gameMode: "normal" as "normal" | "hardcode",
    playerX: 160,
    targetPlayerX: 160,
    sensitivity: 0,
    playerWidth: 80,
    targetWidth: 80,
    isBoosted: false,
    bestNormal: 0,
    bestHardcore: 0,
    bestClassicNormal: 0,
    bestClassicHardcore: 0,
    isMuted: false,
    sfxVolume: 0.5,
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
    skin: "default",
  })

  const particles = useRef<Particle[]>([])
  const trails = useRef<Trail[]>([])
  const audioRefs = useRef<any>(null)
  const currentBgmRef = useRef<HTMLAudioElement | null>(null)
  const snowIntervalRef = useRef<number | null>(null)

  const t = TRANSLATIONS[language]

  const changeLanguage = (lang: "en" | "vi" | "es" | "ru") => {
    playClick()
    setLanguage(lang)
    localStorage.setItem("game_language", lang)
  }

  const changeSkin = (newSkin: string) => {
    playClick()
    setSkin(newSkin)
    gameData.current.skin = newSkin
    localStorage.setItem("game_skin", newSkin)
  }

  const changeMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setMusicVolume(v)
    if (currentBgmRef.current) {
      currentBgmRef.current.volume = v
    }
    if (audioRefs.current?.pause_bg) {
      audioRefs.current.pause_bg.volume = v
    }

    const menu = audioRefs.current?.bg_menu
    // If menu BGM is currently playing, fade it to the new volume (do not restart)
    if (menu && currentBgmRef.current === menu && !gameData.current.isMuted) {
      fadeAudio(menu, v, 300)
    } else if (menu && gameState === "start" && !showIntro && !gameData.current.isMuted) {
      // If menu exists but isn't playing (e.g., first time or previously stopped), start it from the beginning
      try { menu.pause(); menu.currentTime = 0 } catch (e) {}
      currentBgmRef.current = menu
      fadeAudio(menu, v, 300)
    }

    localStorage.setItem("game_music_volume", String(v))
  }

  const changeSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setSfxVolume(v)
    gameData.current.sfxVolume = v
    localStorage.setItem("game_sfx_volume", String(v))
  }

  const toggleBgMenu = () => {
    const newState = !bgMenuEnabled
    playClick()
    setBgMenuEnabled(newState)
    localStorage.setItem("game_bg_menu_enabled", String(newState))
  }

  const changeSensitivity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setSensitivity(v)
    gameData.current.sensitivity = v
    localStorage.setItem("game_sensitivity", String(v))
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

  // --- Audio Helper: Fade In / Fade Out ---
  const fadeAudio = (audio: HTMLAudioElement, targetVol: number, duration = 800, onComplete?: () => void) => {
    if (!audio) return
    // Clear previous fade interval if stored on the audio object
    if ((audio as any).fadeInterval) clearInterval((audio as any).fadeInterval)

    const startVol = audio.volume
    const startTime = Date.now()
    
    if (targetVol > 0) {
      audio.volume = startVol // Start from current (usually 0 if fading in)
      audio.play().catch(() => {})
    }

    (audio as any).fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Linear interpolation
      const newVol = startVol + (targetVol - startVol) * progress
      audio.volume = Math.max(0, Math.min(newVol, 1))

      if (progress >= 1) {
        clearInterval((audio as any).fadeInterval)
        if (targetVol === 0) {
          audio.pause()
          audio.currentTime = 0
        }
        if (onComplete) onComplete()
      }
    }, 50)
  }

  // Helper: stop menu BGM with fade and reset to start (global scope)
  const stopMenuBgm = () => {
    if (!audioRefs.current || !audioRefs.current.bg_menu) return
    const menu = audioRefs.current.bg_menu
    fadeAudio(menu, 0, 500, () => {
      try { menu.pause(); menu.currentTime = 0 } catch (e) {}
      if (currentBgmRef.current === menu) currentBgmRef.current = null
    })
  }

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
      audio.volume = gameData.current.sfxVolume
      audio.currentTime = 0
      audio.play().catch(() => { })
    }
  }

  const playClick = () => playSound("click")

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
    // Pause Game Music
    if (currentBgmRef.current) {
      currentBgmRef.current.pause()
    }
    // Pause Bomb Fall Sound
    if (audioRefs.current?.bomb_fall) {
      audioRefs.current.bomb_fall.pause()
    }
    // Play Pause Music
    if (audioRefs.current?.pause_bg && !gameData.current.isMuted) {
      audioRefs.current.pause_bg.volume = musicVolume
      audioRefs.current.pause_bg.play().catch(() => {})
    }
  }

  const resumeGame = () => {
    playClick()
    // Resume Game Music
    if (currentBgmRef.current && !gameData.current.isMuted) {
      currentBgmRef.current.volume = musicVolume
      currentBgmRef.current.play().catch(() => {})
    }
    // Stop Pause Music
    if (audioRefs.current?.pause_bg) {
      audioRefs.current.pause_bg.pause()
      audioRefs.current.pause_bg.currentTime = 0
    }

    const resumeBombSound = () => {
      const hasBombs = gameData.current.bombs.length > 0 || gameData.current.ball.type === "orange"
      if (hasBombs && audioRefs.current?.bomb_fall && !gameData.current.isMuted) {
        audioRefs.current.bomb_fall.play().catch(() => {})
      }
    }

    // If autoplay is enabled, resume immediately
    if (gameData.current.isAuto) {
      setGameState("running")
      resumeBombSound()
      return
    }
    // Start a short countdown to resume (preserve gameData)
    runCountdown(false, () => {
      setGameState("running")
      resumeBombSound()
    })
  }

  const handleExitRequest = () => {
    playClick()
    if (!confirmExit) {
      setConfirmExit(true)
      setTimeout(() => setConfirmExit(false), 3000) // Reset sau 3s nếu ko nhấn lại
      return
    }
    // Thực hiện thoát
    // Stop Game Music
    fadeAudio(currentBgmRef.current, 0, 500)

    // Stop Pause Music
    if (audioRefs.current?.pause_bg) {
      fadeAudio(audioRefs.current.pause_bg, 0, 500)
    }

    // Stop Bomb Sound
    if (audioRefs.current?.bomb_fall) {
      audioRefs.current.bomb_fall.pause()
      audioRefs.current.bomb_fall.currentTime = 0
    }

    setGameState("start")
    setConfirmExit(false)
  }

  const toggleAutoMode = () => {
    playClick()
    gameData.current.isAuto = !gameData.current.isAuto
    setIsAuto(gameData.current.isAuto)
    if (typeof window !== "undefined" && window.navigator.vibrate) window.navigator.vibrate(50)
  }

  const toggleMute = () => {
    const newState = !isMuted
    if (!newState) playClick() // Play click when unmuting
    setIsMuted(newState)
    gameData.current.isMuted = newState
    localStorage.setItem("game_muted", String(newState))

    if (newState) {
      // Mute all
      if (currentBgmRef.current) currentBgmRef.current.pause()
      if (audioRefs.current?.pause_bg) audioRefs.current.pause_bg.pause()
      if (audioRefs.current?.bg_menu) audioRefs.current.bg_menu.pause()
    } else {
      // Unmute
      if (gameState === "running" && currentBgmRef.current) {
        currentBgmRef.current.volume = musicVolume
        currentBgmRef.current.play().catch(() => {})
      } else if (gameState === "paused" && audioRefs.current?.pause_bg) {
        audioRefs.current.pause_bg.volume = musicVolume
        audioRefs.current.pause_bg.play().catch(() => {})
      } else if (gameState === "start" && audioRefs.current?.bg_menu && bgMenuEnabled) {
        audioRefs.current.bg_menu.volume = musicVolume
        audioRefs.current.bg_menu.play().catch(() => {})
      }
    }
  }

  const toggleParticles = () => {
    const newState = !particlesEnabled
    playClick()
    setParticlesEnabled(newState)
    gameData.current.particlesEnabled = newState
    localStorage.setItem("game_particles", String(newState))
  }

  const toggleTrails = () => {
    playClick()
    const newState = !trailsEnabled
    setTrailsEnabled(newState)
    gameData.current.trailsEnabled = newState
    localStorage.setItem("game_trails", String(newState))
  }

  const toggleAnimations = () => {
    playClick()
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
      const config = gameData.current.customBallConfig
      const currentScore = gameData.current.score
      
      // Filter eligible balls based on score threshold and enabled status
      const eligible = Object.entries(config).filter(([_, cfg]) => cfg.enabled && currentScore >= cfg.score)
      
      if (eligible.length > 0) {
        // Calculate total weight
        const totalWeight = eligible.reduce((sum, [_, cfg]) => sum + cfg.rate, 0)
        
        if (totalWeight <= 0) {
          // Fallback to equal probability if rates are 0
          b.type = eligible[Math.floor(Math.random() * eligible.length)][0] as any
        } else {
          let r = Math.random() * totalWeight
          for (const [type, cfg] of eligible) {
            if (r < cfg.rate) {
              b.type = type as any
              break
            }
            r -= cfg.rate
          }
        }
      } else {
        // Fallback if no balls are eligible (e.g. score too low)
        // Try to find any enabled ball regardless of score
        const anyEnabled = Object.entries(config).filter(([_, cfg]) => cfg.enabled)
        if (anyEnabled.length > 0) {
           b.type = anyEnabled[Math.floor(Math.random() * anyEnabled.length)][0] as any
        } else {
           b.type = "normal"
        }
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

    // Ensure bomb (orange) has consistent size/texture across modes
    b.radius = b.type === "orange" ? 12 : 10

    // Bomb Spawn Logic (Simultaneous)
    // Allow simultaneous bomb spawns in custom mode only if "orange" is enabled in the custom config
    const canSpawnSimultaneousBombs = !gameData.current.isClassic && (!gameData.current.isCustom || (gameData.current.allowedBalls && gameData.current.allowedBalls.includes("orange")))
    if (canSpawnSimultaneousBombs && score > 50 && Math.random() < 0.2) {
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
    // Ensure menu BGM stops fully when entering any game mode
    stopMenuBgm()

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
        customBallConfig: {},
        allowedBalls: [],
        isClassic: isClassic,
        playerX: 160,
        targetPlayerX: 160,
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
      setActiveTab("home")
      setDirection(-1)
      setShowNewBest(false)
      particles.current = []
      trails.current = []
      resetBall()

      // Start Game Music (Fade In)
      let bgm = audioRefs.current?.bg_game_default
      if (isAuto) bgm = audioRefs.current?.bg_game_auto
      else if (mode === "hardcode") bgm = audioRefs.current?.bg_game_hardcode
      currentBgmRef.current = bgm
      if (bgm) bgm.volume = 0
      fadeAudio(bgm, musicVolume, 2000)
    })
  }

  const startCustomGame = () => {
    const isAutoCustom = customConfig.isAuto
    const mode = customConfig.mode
    const allowed = Object.entries(customConfig.balls)
      .filter(([_, cfg]) => cfg.enabled)
      .map(([type]) => type)
    
    if (allowed.length === 0) {
      setCustomError(t.selectAtLeastOneBall)
      return
    }

    const totalRate = Object.values(customConfig.balls)
      .filter(b => b.enabled)
      .reduce((acc, b) => acc + b.rate, 0)

    if (totalRate !== 100) {
      setCustomError(t.totalRateError)
      return
    }

    // Ensure menu BGM stops when starting custom game
    stopMenuBgm()

    setGameMode(mode)
    
    runCountdown(isAutoCustom, () => {
      gameData.current = {
        ...gameData.current,
        score: 0,
        lives: mode === "hardcode" ? 1 : 5,
        combo: 0,
        gameMode: mode,
        isClassic: false,
        isCustom: true,
        customBallConfig: JSON.parse(JSON.stringify(customConfig.balls)),
        allowedBalls: allowed,
        playerX: 160,
        targetPlayerX: 160,
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
      setShowNewBest(false)
      particles.current = []
      trails.current = []
      resetBall()

      // Start Game Music (Fade In)
      const bgm = audioRefs.current?.bg_game_custom
      currentBgmRef.current = bgm
      if (bgm) bgm.volume = 0
      fadeAudio(bgm, musicVolume, 2000)
    })
  }

  const startAutoGame = () => {
    // Ensure menu BGM stops when starting auto game
    stopMenuBgm()

    gameData.current = {
      ...gameData.current,
      score: 0,
      lives: gameMode === "hardcode" ? 1 : 5, // 1 life for Hardcode
      combo: 0,
      gameMode: gameMode,
      isCustom: false,
      customBallConfig: {},
      allowedBalls: [],
      isClassic: isClassic,
      playerX: 160,
      targetPlayerX: 160,
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
  }

  useEffect(() => {
    const loadAudio = (src: string) => {
      const audio = new Audio(src)
      audio.preload = "auto"
      return audio
    }

    audioRefs.current = {
      // SFX Sounds
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
      // Background Musics
      bg_game_default: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bg_game_default.mp3"),
      bg_game_hardcode: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bg_game_hardcode.mp3"),
      bg_game_auto: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bg_game_auto.mp3"),
      bg_game_custom: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bg_game_custom.mp3"),
      // Main Menu Background
      bg_menu: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/menu_bg.mp3"),
      pause_bg: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/pause_music.mp3"),
      // UI Sounds
      count: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/count.mp3"),
      go: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/go.mp3"),
      kjacs: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/kjacs.mp3"),
      click: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/click2.mp3"),
      combo: [
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c1.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c2.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c3.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c4.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c5.mp3"),
        loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c6.mp3"),
      ],
    }

    // Loop BGMs
    if (audioRefs.current.bg_game_default) audioRefs.current.bg_game_default.loop = true
    if (audioRefs.current.bg_game_hardcode) audioRefs.current.bg_game_hardcode.loop = true
    if (audioRefs.current.bg_game_auto) audioRefs.current.bg_game_auto.loop = true
    if (audioRefs.current.bg_game_custom) audioRefs.current.bg_game_custom.loop = true
    if (audioRefs.current.bg_menu) audioRefs.current.bg_menu.loop = true
    if (audioRefs.current.pause_bg) audioRefs.current.pause_bg.loop = true

    const savedMute = localStorage.getItem("game_muted") === "true"
    setIsMuted(savedMute)
    gameData.current.isMuted = savedMute

    const savedMusicVol = localStorage.getItem("game_music_volume")
    if (savedMusicVol) {
      const v = parseFloat(savedMusicVol)
      setMusicVolume(v)
    }

    const savedSfxVol = localStorage.getItem("game_sfx_volume")
    if (savedSfxVol) {
      const v = parseFloat(savedSfxVol)
      setSfxVolume(v)
      gameData.current.sfxVolume = v
    }

    const savedBgMenu = localStorage.getItem("game_bg_menu_enabled")
    if (savedBgMenu !== null) {
      setBgMenuEnabled(savedBgMenu === "true")
    }

    const savedSensitivity = localStorage.getItem("game_sensitivity")
    if (savedSensitivity) {
      const s = parseFloat(savedSensitivity)
      setSensitivity(s)
      gameData.current.sensitivity = s
    }

    // Load Custom Config
    const savedCustomConfig = localStorage.getItem("game_custom_config")
    if (savedCustomConfig) {
      try {
        const parsed = JSON.parse(savedCustomConfig)
        setCustomConfig(prev => ({
          ...prev,
          ...parsed,
          balls: {
            ...prev.balls,
            ...(parsed.balls || {})
          }
        }))
      } catch (e) {
        console.error("Error loading custom config", e)
      }
    }
    setIsConfigLoaded(true)

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

    const savedSkin = localStorage.getItem("game_skin") || "default"
    setSkin(savedSkin)
    gameData.current.skin = savedSkin

    document.title = "Catch Master - Power by V0"
  }, [])

  // Menu Background Music: play when on main menu (gameState === "start") but not during the Intro
  useEffect(() => {
    if (!audioRefs.current) return
    const menuBgm = audioRefs.current.bg_menu
    if (!menuBgm) return

    if (gameState === "start" && !showIntro && bgMenuEnabled) {
      // Ensure music plays from beginning each time we enter menu
      try { menuBgm.currentTime = 0 } catch (e) {}
      currentBgmRef.current = menuBgm
      if (!gameData.current.isMuted) fadeAudio(menuBgm, musicVolume, 1000)
    } else {
      if (currentBgmRef.current === menuBgm) {
        // Fade out then fully stop & reset so next menu entry starts from the beginning
        fadeAudio(menuBgm, 0, 500, () => {
          try { menuBgm.pause(); menuBgm.currentTime = 0 } catch (e) {}
          if (currentBgmRef.current === menuBgm) currentBgmRef.current = null
        })
      }
    }
  }, [gameState, showIntro, bgMenuEnabled])

  // Intro effect: advance the intro steps and ensure menu music is paused/reset while intro is active
  useEffect(() => {
    if (showIntro) {
      if (audioRefs.current?.bg_menu) {
        try { audioRefs.current.bg_menu.pause(); audioRefs.current.bg_menu.currentTime = 0 } catch (e) {}
        if (currentBgmRef.current === audioRefs.current.bg_menu) currentBgmRef.current = null
      }

      setIntroStep(0)
      const t1 = window.setTimeout(() => setIntroStep(1), 700)
      const t2 = window.setTimeout(() => setIntroStep(2), 1400)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [showIntro])

  // Persist custom config separately (so it doesn't interfere with intro timings)
  useEffect(() => {
    if (isConfigLoaded) {
      localStorage.setItem("game_custom_config", JSON.stringify(customConfig))
    }
  }, [customConfig, isConfigLoaded])

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
      const targetX = mouseX - gameData.current.playerWidth / 2
      gameData.current.targetPlayerX = targetX
      
      if (gameData.current.sensitivity === 0) {
        gameData.current.playerX = targetX
      }
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
        // --- FIX: Shield Interaction ---
        if (gameData.current.hasShield) {
          gameData.current.hasShield = false
          playSound("shield_breaking")
          createParticles(bx, by, "#94a3b8", "shard", true)
          gameData.current.combo = 0
          setComboCount(0)
          return
        }

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
            
            // Stop Game Music (Fade Out)
            fadeAudio(currentBgmRef.current, 0, 1500)
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

            // Stop Game Music (Fade Out)
            fadeAudio(currentBgmRef.current, 0, 1500)
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

      // --- Manual Movement Smoothing ---
      if (!gameData.current.isAuto && canvas.getAttribute("data-state") === "running" && !gameData.current.isDying) {
        if (gameData.current.sensitivity > 0) {
          const factor = 1 / (gameData.current.sensitivity * 0.5 + 1)
          gameData.current.playerX += (gameData.current.targetPlayerX - gameData.current.playerX) * factor
        } else if (gameData.current.sensitivity < 0) {
          // Negative: Spring/Overshoot effect (Snappy)
          const factor = 1 + (Math.abs(gameData.current.sensitivity) * 0.05)
          gameData.current.playerX += (gameData.current.targetPlayerX - gameData.current.playerX) * factor
        } else {
          // Ensure sync if sensitivity is 0 (redundant but safe)
          gameData.current.playerX = gameData.current.targetPlayerX
        }
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
          if (b.type === "orange") {
            resetBall()
            if (gameData.current.bombs.length === 0) stopSound("bomb_fall")
          } else if (["normal", "purple", "yellow"].includes(b.type)) {
            if (gameData.current.hasShield) {
              gameData.current.hasShield = false
              playSound("shield_breaking")
              createParticles(b.x, canvas.height - 6, "#94a3b8", "shard", true)
              gameData.current.combo = 0
              setComboCount(0)
              resetBall()
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

                // Stop Game Music (Fade Out)
                fadeAudio(currentBgmRef.current, 0, 1500)
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

      // Helper: draw a ball with consistent texture (used for main ball and bombs)
      const drawBall = (x: number, y: number, radius: number, type: string) => {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        if (type === "orange") {
          // radial highlight for bomb texture to keep it consistent whether it's single or simultaneous
          const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius)
          grad.addColorStop(0, "#fff7ed")
          grad.addColorStop(0.4, "#ffd6a8")
          grad.addColorStop(1, ballColors.orange)
          ctx.fillStyle = grad
          ctx.fill()
          ctx.lineWidth = 1.5
          ctx.strokeStyle = "#f97316"
          ctx.stroke()
        } else {
          ctx.fillStyle = ballColors[type] || ballColors.normal
          ctx.fill()
        }
        ctx.closePath()
      }

      // Render Bombs
      gameData.current.bombs.forEach(bomb => {
        drawBall(bomb.x, bomb.y, bomb.radius, "orange")
      })

      ctx.globalAlpha = 1
      
      // --- PADDLE RENDERING WITH SKINS ---
      const currentSkin = gameData.current.skin || "default"
      let paddleColor = "#3b82f6"
      let shadowColor = "transparent"
      let shadowBlur = 0

      switch (currentSkin) {
        case "emerald": paddleColor = "#10b981"; break
        case "neon": paddleColor = "#d946ef"; shadowColor = "#d946ef"; shadowBlur = 15; break
        case "ice": paddleColor = "#06b6d4"; shadowColor = "#cffafe"; shadowBlur = 10; break
        case "cyber": paddleColor = "#84cc16"; break
        case "inferno": paddleColor = "#ea580c"; shadowColor = "#f97316"; shadowBlur = 15; break
        case "void": paddleColor = "#4c1d95"; shadowColor = "#8b5cf6"; shadowBlur = 10; break
        case "galaxy": paddleColor = "#4338ca"; break
        case "diamond": paddleColor = "#a5f3fc"; shadowColor = "#22d3ee"; shadowBlur = 10; break
        case "iron": paddleColor = "#94a3b8"; break
        case "gold": paddleColor = "#facc15"; shadowColor = "#fde047"; shadowBlur = 10; break
        case "copper": paddleColor = "#fb923c"; break
        case "wooden": paddleColor = "#92400e"; break
        case "ruby": paddleColor = "#dc2626"; shadowColor = "#ef4444"; shadowBlur = 10; break
        case "sapphire": paddleColor = "#1d4ed8"; shadowColor = "#3b82f6"; shadowBlur = 10; break
        case "platinum": paddleColor = "#cbd5e1"; shadowColor = "#e2e8f0"; shadowBlur = 10; break
        case "leaves": paddleColor = "#16a34a"; break
        case "water": paddleColor = "#0ea5e9"; shadowColor = "#38bdf8"; shadowBlur = 10; break
        default: paddleColor = "#3b82f6"; break
      }

      // Boost Effect Override (Flashing white when ending)
      if (gameData.current.isBoosted) {
        if (gameData.current.boostTimeLeft <= 2 && Math.floor(Date.now() / 100) % 2 === 0) {
          paddleColor = "#ffffff"
        }
      }

      ctx.save()
      if (shadowBlur > 0) {
        ctx.shadowColor = shadowColor
        ctx.shadowBlur = shadowBlur
      }

      // Gradient for specific skins
      if (currentSkin === "inferno" && !gameData.current.isBoosted) {
        const grad = ctx.createLinearGradient(gameData.current.playerX, 460, gameData.current.playerX, 475)
        grad.addColorStop(0, "#f97316"); grad.addColorStop(1, "#9a3412")
        paddleColor = grad as any
      } else if (currentSkin === "galaxy" && !gameData.current.isBoosted) {
        const grad = ctx.createLinearGradient(gameData.current.playerX, 460, gameData.current.playerX, 475)
        grad.addColorStop(0, "#4338ca"); grad.addColorStop(1, "#1e1b4b")
        paddleColor = grad as any
      }

      ctx.fillStyle = paddleColor
      ctx.beginPath()
      ctx.roundRect(gameData.current.playerX, 460, gameData.current.playerWidth, 15, 8)
      ctx.fill()
      ctx.restore()

      // Draw main ball using the shared helper for consistent texture
      drawBall(b.x, b.y, b.radius, b.type)

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

      // Flashing warning when main ball is orange and no bombs present (single bomb ball)
      if (b.type === "orange" && gameData.current.bombs.length === 0) {
        const tWarn = Date.now()
        const alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tWarn / 200))
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.font = "bold 20px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.shadowColor = "rgba(249,115,22,0.7)"
        ctx.shadowBlur = 10
        ctx.fillStyle = "#fff7ed"
        ctx.fillText("! BOMB !", canvas.width / 2, 8)
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

  const tabVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 20 : -20, scale: 0.98 }),
    visible: { 
      opacity: 1, x: 0, scale: 1,
      transition: animationsEnabled ? { type: "spring", stiffness: 300, damping: 25 } : { duration: 0 }
    },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 20 : -20, scale: 0.98, transition: { duration: animationsEnabled ? 0.15 : 0 } }),
  }

  const getTotalRate = () => Object.values(customConfig.balls).filter(b => b.enabled).reduce((acc, b) => acc + b.rate, 0)

  const saveHistory = () => {
    setConfigHistory(prev => [...prev, JSON.parse(JSON.stringify(customConfig))])
  }

  const handleUndo = () => {
    if (configHistory.length === 0) return
    playClick()
    const previous = configHistory[configHistory.length - 1]
    setCustomConfig(previous)
    setConfigHistory(prev => prev.slice(0, -1))
  }

  const handleReset = () => {
    playClick()
    saveHistory()
    setCustomConfig({
      mode: "normal",
      isAuto: false,
      balls: {
        normal: { enabled: true, score: 0, rate: 40 },
        purple: { enabled: true, score: 50, rate: 30 },
        yellow: { enabled: true, score: 100, rate: 15 },
        boost: { enabled: true, score: 200, rate: 3 },
        grey: { enabled: true, score: 300, rate: 2 },
        snow: { enabled: true, score: 500, rate: 3 },
        orange: { enabled: true, score: 2, rate: 2 },
        heal: { enabled: true, score: 150, rate: 5 },
      }
    })
  }

  const autoBalanceRates = () => {
    saveHistory()
    const enabledKeys = Object.keys(customConfig.balls).filter(k => customConfig.balls[k as keyof typeof customConfig.balls].enabled)
    const count = enabledKeys.length
    if (count === 0) return

    const share = Math.floor(100 / count)
    let remainder = 100 - (share * count)
    
    setCustomConfig(prev => {
      const newBalls = { ...prev.balls }
      enabledKeys.forEach(k => {
        const extra = remainder > 0 ? 1 : 0
        newBalls[k as keyof typeof newBalls] = { ...newBalls[k as keyof typeof newBalls], rate: share + extra }
        if (remainder > 0) remainder--
      })
      return { ...prev, balls: newBalls }
    })
  }

  const toggleBall = (id: string) => {
    playClick()
    saveHistory()
    setCustomConfig(prev => {
      const isEnabled = !prev.balls[id as keyof typeof prev.balls].enabled
      const newBalls = { 
        ...prev.balls, 
        [id]: { ...prev.balls[id as keyof typeof prev.balls], enabled: isEnabled } 
      }
      
      // Auto balance logic on toggle
      const enabledKeys = Object.keys(newBalls).filter(k => newBalls[k as keyof typeof newBalls].enabled)
      const count = enabledKeys.length
      if (count > 0) {
        const share = Math.floor(100 / count)
        let remainder = 100 - (share * count)
        enabledKeys.forEach(k => {
          const extra = remainder > 0 ? 1 : 0
          newBalls[k as keyof typeof newBalls].rate = share + extra
          if (remainder > 0) remainder--
        })
      }
      
      return { ...prev, balls: newBalls }
    })
    setCustomError(null)
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
            {!isAuto && !gameData.current.isCustom && (
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t.best}</span>
                <span className="text-xl font-black text-emerald-400 italic tabular-nums leading-none">
                  {isClassic 
                    ? (gameMode === "hardcode" ? bestScoreClassicHardcore : bestScoreClassicNormal)
                    : (gameMode === "hardcode" ? bestScoreHardcore : bestScoreNormal)}
                </span>
              </div>
            )}

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
              onClick={() => {
                playClick()
                pauseGame()
              }}
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

                {/* Settings Button (Replaces Quick Sliders) */}
                <button
                  onClick={() => {
                    playClick()
                    setOpenSettings(true)
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all"
                >
                  <Settings size={18} />
                  <span className="uppercase tracking-widest text-xs">{t.settings}</span>
                </button>
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

        { /* Intro Modal overlay */ }
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/90 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
              {introStep === 0 && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-white">
                  <h3 className="text-4xl font-black">MeoTN Gaming</h3>
                </motion.div>
              )}
              {introStep === 1 && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-white">
                  <h3 className="text-3xl font-bold">Build by V0</h3>
                </motion.div>
              )}
              {introStep === 2 && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-white">
                  <h1 className="text-5xl font-black mb-6">Catch Master</h1>
                  <button onClick={() => {
                      playClick();
                      setShowIntro(false);
                      // start menu music from the beginning when leaving intro
                      const menu = audioRefs.current?.bg_menu
                      if (menu && !gameData.current.isMuted) {
                        try { menu.pause(); menu.currentTime = 0 } catch (e) {}
                        currentBgmRef.current = menu
                        fadeAudio(menu, musicVolume, 1000)
                      }
                    }}
                    className="px-10 py-4 rounded-2xl font-black text-xl bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg">
                    Start
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {gameState !== "running" && gameState !== "countdown" && gameState !== "paused" && !openCustom && (
          <motion.div
            variants={menuContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            <AnimatePresence mode="wait" custom={direction}>
            {gameState === "start" && activeTab === "home" && (
              <motion.div key="home" custom={direction} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto custom-scrollbar">
              <motion.div 
                variants={menuItemVariants} 
                initial="hidden" 
                animate="visible" 
                className="w-full flex flex-col items-center" 
                key="start"
              >
                <motion.div variants={menuItemVariants} className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 shrink-0">
                    <Zap size={32} className="text-white fill-white" />
                  </div>
                  <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter text-left leading-none">Catch<br/>Master</h2>
                </motion.div>
                
                {/* PLAY BUTTON */}
                <motion.button
                  variants={menuItemVariants}
                  onClick={() => {
                    playClick()
                    startCountdown(isAuto, gameMode)
                  }}
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
                  onClick={() => {
                    playClick()
                    setOpenCustom(true)
                  }}
                  className="w-full py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all mb-6 bg-slate-800 text-slate-300 border border-white/5 hover:bg-slate-700 hover:text-white"
                >
                  <Edit3 size={20} /> {t.custom}
                </motion.button>

                {/* OPTIONS ROW */}
                <motion.div variants={menuItemVariants} className="flex gap-4 w-full mb-8">
                  <button
                    onClick={() => {
                      playClick()
                      setIsAuto(!isAuto)
                    }}
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
                    onClick={() => {
                      playClick()
                      setIsClassic(!isClassic)
                    }}
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
                    onClick={() => {
                      playClick()
                      setGameMode(gameMode === "normal" ? "hardcode" : "normal")
                    }}
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
                <motion.div variants={menuItemVariants} className="text-slate-600 text-[10px] font-bold uppercase tracking-widest opacity-40">
                  v1.0.1
                </motion.div>
              </motion.div>
              </motion.div>
            )}

            {gameState === "over" && (
              <motion.div key="over" custom={direction} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <motion.div 
                variants={menuItemVariants} 
                initial="hidden" 
                animate="visible" 
                className="flex flex-col items-center" 
                key="over"
              >
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
                    onClick={() => {
                      playClick()
                      setGameState("start")
                      setActiveTab("home")
                      setDirection(-1)
                    }}
                    className="px-10 py-4 bg-slate-800 text-white font-black rounded-full flex items-center gap-3 border border-white/10 hover:bg-slate-700 transition-all"
                  >
                    <Home size={24} /> {t.home}
                  </motion.button>
                  <motion.button
                    variants={menuItemVariants}
                    onClick={() => {
                      playClick()
                      setGameState("start")
                      setActiveTab("settings")
                      setDirection(1)
                    }}
                    className="p-4 bg-slate-800 text-white rounded-full border border-white/10"
                  >
                    <Settings size={24} />
                  </motion.button>
                </motion.div>
              </motion.div>
              </motion.div>
            )}

            {/* --- TAB CONTENT: GUIDE --- */}
            {gameState === "start" && activeTab === "guide" && (
              <motion.div key="guide" custom={direction} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none">{t.ballGuide}</h3>
                    <p className="text-purple-500 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">{t.manualDatabase}</p>
                  </div>
                </div>
                <div className="space-y-4 pb-4">
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
                    <div className="w-14 h-14 flex-shrink-0">
                      <svg width="56" height="56" viewBox="0 0 56 56" className="rounded-full" aria-hidden>
                        <defs>
                          <radialGradient id="snowGuideGrad" cx="30%" cy="25%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="60%" stopColor="#e6f9ff" />
                            <stop offset="100%" stopColor="#e6fbff" />
                          </radialGradient>
                        </defs>
                        <circle cx="28" cy="28" r="24" fill="url(#snowGuideGrad)" stroke="#cfeffd" strokeWidth="2" />
                        <g fill="#ffffff" opacity="0.95">
                          <path d="M28 16 L30 24 L28 32 L26 24 Z" />
                        </g>
                      </svg>
                    </div>"
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
                    <div className="w-14 h-14 flex-shrink-0">
                      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
                        <defs>
                          <radialGradient id="bombGuideGrad" cx="35%" cy="25%">
                            <stop offset="0%" stopColor="#fff7ed" />
                            <stop offset="40%" stopColor="#ffd6a8" />
                            <stop offset="100%" stopColor="#f97316" />
                          </radialGradient>
                        </defs>
                        <circle cx="28" cy="28" r="24" fill="url(#bombGuideGrad)" stroke="#f97316" strokeWidth="1.5" />
                        <rect x="36" y="10" width="8" height="6" rx="1" fill="#374151" />
                        <rect x="41" y="6" width="3" height="6" rx="1" fill="#374151" />
                      </svg>
                    </div>
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
                </div>
              </motion.div>
            )}

            {/* --- TAB CONTENT: STATS --- */}
            {gameState === "start" && activeTab === "stats" && (
              <motion.div key="stats" custom={direction} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.statistics}</h3>
                </div>
                <div className="space-y-4">
                  {/* DEFAULT MODES */}
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t.defaultMode}</h4>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-2 uppercase tracking-widest border-b border-white/5 pb-2">
                      <span>{t.bestNormal}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 text-xl font-black tabular-nums">{bestScoreNormal}</span>
                        <button
                          onClick={() => {
                            playClick()
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
                            playClick()
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
                            playClick()
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
                            playClick()
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
                        playClick()
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

            {/* --- TAB CONTENT: SKINS --- */}
            {gameState === "start" && activeTab === "skins" && (
              <motion.div key="skins" custom={direction} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.skins}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 pb-4">
                  {[
                    { id: "default", name: "Default", class: "bg-blue-500" },
                    { id: "emerald", name: "Emerald", class: "bg-emerald-500" },
                    { id: "neon", name: "Neon", class: "bg-fuchsia-500 shadow-[0_0_15px_#d946ef]" },
                    { id: "ice", name: "Ice", class: "bg-cyan-500 shadow-[0_0_10px_#cffafe]" },
                    { id: "cyber", name: "Cyber", class: "bg-lime-500" },
                    { id: "inferno", name: "Inferno", class: "bg-gradient-to-b from-orange-500 to-orange-800 shadow-[0_0_15px_#f97316]" },
                    { id: "void", name: "Void", class: "bg-violet-900 shadow-[0_0_10px_#8b5cf6]" },
                    { id: "galaxy", name: "Galaxy", class: "bg-gradient-to-b from-indigo-700 to-indigo-950" },
                    { id: "diamond", name: "Diamond", class: "bg-cyan-200 shadow-[0_0_10px_#22d3ee]" },
                    { id: "iron", name: "Iron", class: "bg-slate-400" },
                    { id: "gold", name: "Gold", class: "bg-yellow-400 shadow-[0_0_10px_#fde047]" },
                    { id: "copper", name: "Copper", class: "bg-orange-400" },
                    { id: "wooden", name: "Wooden", class: "bg-amber-800" },
                    { id: "ruby", name: "Ruby", class: "bg-red-600 shadow-[0_0_10px_#ef4444]" },
                    { id: "sapphire", name: "Sapphire", class: "bg-blue-700 shadow-[0_0_10px_#3b82f6]" },
                    { id: "platinum", name: "Platinum", class: "bg-slate-300 shadow-[0_0_10px_#e2e8f0]" },
                    { id: "leaves", name: "Leaves", class: "bg-green-600" },
                    { id: "water", name: "Water", class: "bg-sky-500 shadow-[0_0_10px_#38bdf8]" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => changeSkin(s.id)}
                      className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${
                        skin === s.id 
                          ? "bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/20" 
                          : "bg-slate-900/50 border-white/5 hover:bg-slate-800 hover:border-white/10"
                      }`}
                    >
                      <div className={`w-16 h-4 rounded-full ${s.class}`} />
                      <span className={`text-xs font-black uppercase tracking-wider ${skin === s.id ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
                        {s.name}
                      </span>
                      {skin === s.id && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* --- TAB CONTENT: SETTINGS --- */}
            {gameState === "start" && activeTab === "settings" && (
              <motion.div key="settings" custom={direction} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 overflow-hidden">
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
                  playClick={playClick}
                  toggleAnimations={toggleAnimations}
                  onClose={() => {
                    setDirection(-1)
                    setActiveTab("home")
                  }}
                  bgMenuEnabled={bgMenuEnabled}
                  toggleBgMenu={toggleBgMenu}
                  musicVolume={musicVolume}
                  setMusicVolume={changeMusicVolume}
                  sfxVolume={sfxVolume}
                  setSfxVolume={changeSfxVolume}
                  sensitivity={sensitivity}
                  setSensitivity={changeSensitivity}
                  embed={true}
                />
              </motion.div>
            )}
            </AnimatePresence>

            {/* --- BOTTOM TAB BAR --- */}
            {gameState === "start" && (
              <div className="h-20 bg-slate-950 border-t border-white/5 flex items-center px-2 shrink-0 z-40">
                {[
                  { id: "home", icon: Home, label: t.home },
                  { id: "guide", icon: Info, label: t.guide },
                  { id: "stats", icon: BarChart3, label: t.stats },
                  { id: "skins", icon: Palette, label: t.skins },
                  { id: "settings", icon: Settings, label: t.settings },
                ].map((tab, index, arr) => (
                  <button
                    key={tab.id}
                    onClick={() => { 
                      playClick(); 
                      const currentIndex = arr.findIndex((t) => t.id === activeTab)
                      setDirection(index > currentIndex ? 1 : -1)
                      setActiveTab(tab.id as any) 
                    }}
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors relative ${activeTab === tab.id ? "text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === tab.id ? "opacity-100" : "opacity-60"}`}>{tab.label}</span>
                    {activeTab === tab.id && <motion.div layoutId="tab-indicator" transition={{ duration: animationsEnabled ? 0.3 : 0 }} className="absolute -top-[1px] w-8 h-[2px] bg-blue-400 rounded-full" />}
                  </button>
                ))}
              </div>
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
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={animationsEnabled ? { duration: 0.5 } : { duration: 0 }}
            className="absolute inset-0 z-[75] pointer-events-none"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={animationsEnabled ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={animationsEnabled ? { duration: 3, repeat: Infinity } : { duration: 0 }}
              className="absolute inset-0"
              style={{ 
                backgroundColor: 'rgba(219, 234, 254, 0.15)',
                boxShadow: 'inset 0 0 100px rgba(255, 255, 255, 0.15)'
              }}
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
              <button onClick={() => {
                playClick()
                setOpenCustom(false)
                setCustomError(null)
              }} className="text-slate-400 hover:text-white">
                <X size={32} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Mode & Auto Selection */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-2">
                <button
                  onClick={() => {
                    playClick()
                    setCustomConfig(prev => ({ ...prev, mode: "normal" }))
                  }}
                  className={`flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all ${customConfig.mode === "normal" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-800 text-slate-500"}`}
                >
                  Normal
                </button>
                <button
                  onClick={() => {
                    playClick()
                    setCustomConfig(prev => ({ ...prev, mode: "hardcode" }))
                  }}
                  className={`flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all ${customConfig.mode === "hardcode" ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "bg-slate-800 text-slate-500"}`}
                >
                  Hardcore
                </button>
                <button
                  onClick={() => {
                    playClick()
                    setCustomConfig(prev => ({ ...prev, isAuto: !prev.isAuto }))
                  }}
                  className={`flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 ${customConfig.isAuto ? "bg-green-600 text-white shadow-lg shadow-green-500/20" : "bg-slate-800 text-slate-500"}`}
                >
                  <Cpu size={16} />
                  {t.auto}
                </button>
              </div>

              {/* Ball Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.selectBalls}</h4>  
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button onClick={handleUndo} disabled={configHistory.length === 0} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${configHistory.length === 0 ? "bg-slate-800 text-slate-600 border-transparent" : "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700 hover:text-white"}`}>
                    <Undo2 size={14} /> {t.undo}
                  </button>
                  <button onClick={handleReset} className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700 hover:text-white transition-all">
                    <RotateCcw size={14} /> {t.reset}
                  </button>
                  <button 
                    onClick={() => { playClick(); autoBalanceRates(); }}
                    className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 transition-all"
                  >
                    <RefreshCw size={14} /> {t.autoBalance}
                  </button>
                </div>
                <div className="space-y-2">
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
                    <div
                      key={ball.id}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${customConfig.balls[ball.id as keyof typeof customConfig.balls].enabled ? "bg-slate-800 border-white/20" : "bg-slate-900/50 border-transparent opacity-50"}`}
                    >
                      <button onClick={() => toggleBall(ball.id)} className="flex items-center gap-3 flex-1">
                        <div className={`w-4 h-4 rounded-full ${ball.color} shadow-sm shrink-0`} />
                        <span className={`text-xs font-bold uppercase truncate ${customConfig.balls[ball.id as keyof typeof customConfig.balls].enabled ? "text-white" : "text-slate-500"}`}>{ball.label}</span>
                      </button>
                      
                      {customConfig.balls[ball.id as keyof typeof customConfig.balls].enabled && (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <label className="text-[8px] text-slate-500 font-bold uppercase">{t.score}</label>
                            <input 
                              type="number" 
                              min="0" 
                              max="1000"
                              value={customConfig.balls[ball.id as keyof typeof customConfig.balls].score}
                              onChange={(e) => {
                                saveHistory()
                                const val = Math.min(1000, Math.max(0, parseInt(e.target.value) || 0))
                                setCustomConfig(prev => ({
                                  ...prev,
                                  balls: { ...prev.balls, [ball.id]: { ...prev.balls[ball.id as keyof typeof prev.balls], score: val } }
                                }))
                              }}
                              className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs font-mono text-right text-white focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div className="flex flex-col items-end">
                            <label className="text-[8px] text-slate-500 font-bold uppercase">{t.rate}</label>
                            <input 
                              type="number" 
                              min="0" 
                              max="100"
                              value={customConfig.balls[ball.id as keyof typeof customConfig.balls].rate}
                              onChange={(e) => {
                                saveHistory()
                                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                setCustomConfig(prev => ({
                                  ...prev,
                                  balls: { ...prev.balls, [ball.id]: { ...prev.balls[ball.id as keyof typeof prev.balls], rate: val } }
                                }))
                              }}
                              className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs font-mono text-right text-yellow-400 focus:border-yellow-500 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-end">
                   <span className={`text-[10px] font-bold uppercase tracking-wider ${getTotalRate() === 100 ? "text-green-400" : "text-red-400"}`}>
                     {t.totalRate}: {getTotalRate()}%
                   </span>
                </div>
              </div>
            </div>

            {customError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-200 text-xs font-bold animate-pulse">
                <AlertCircle size={16} className="text-red-500" />
                {customError}
              </div>
            )}

            <button
              onClick={() => {
                playClick()
                startCustomGame()
              }}
              disabled={getTotalRate() !== 100}
              className={`w-full py-4 mt-4 font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-transform ${
                getTotalRate() === 100 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30 active:scale-95" 
                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
              }`}
            >
              <Play size={20} fill="currentColor" /> {t.startCustom}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openSettings && ( // Keep this for Pause Menu access
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
            playClick={playClick}
            toggleAnimations={toggleAnimations}
            onClose={() => setOpenSettings(false)}
            bgMenuEnabled={bgMenuEnabled}
            toggleBgMenu={toggleBgMenu}
            musicVolume={musicVolume}
            setMusicVolume={changeMusicVolume}
            sfxVolume={sfxVolume}
            setSfxVolume={changeSfxVolume}
            sensitivity={sensitivity}
            setSensitivity={changeSensitivity}
          />
        )}
      </AnimatePresence>

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
