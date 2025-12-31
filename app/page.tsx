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
  Star,
  Sparkles,
  Wind,
  Pause,
  AlertCircle,
  Info,
  Film,
  RotateCcw,
  Heart,
  BarChart3,
  Bug,
  ExternalLink,
  Palette,
  Music,
  EyeOff,
  Square,
  ArrowUpCircle,
} from "lucide-react"
import { TRANSLATIONS } from "./translations"
import SettingsModal from "./TabModal/SettingsModal"
import BallGuide from "./TabModal/BallGuide"
import StatsModal from "./TabModal/StatsModal"
import HomeModal from "./TabModal/HomeModal"
import CustomGameModal, { CustomConfig } from "./ModeModal/CustomGameModal"
import PauseModal from "./GameModal/PauseModal"
import GameOverModal from "./GameModal/GameOverModal"
import QuickPlayModal from "./ModeModal/QuickPlayModal"
import DevModeModal from "./DevModal/DevModeModal"
import { spawnBall } from "./MainGameLogic"
import { isSuddenDeathMiss } from "./GameModal/SuddenDeathGameModal"
import { getHiddenBallAlpha } from "./GameModal/HiddenBallModal"
import { getBlankObstacleProps } from "./GameModal/BlankModal"
import { getInitialVerticalState } from "./GameModal/ReverseGameModal"
import { getScoreKey, initializeScores, getScoreMultiplier } from "./ScoreManager"
import type { Difficulty, GameType, HistoryEntry } from "./ScoreManager"

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
  const [bestScores, setBestScores] = useState<Record<string, number>>(initializeScores())
  const bestScoresRef = useRef<Record<string, number>>(bestScores)
  const [recentScores, setRecentScores] = useState<HistoryEntry[]>([])
  const [isNewBestRecord, setIsNewBestRecord] = useState(false)
  const [newBestRank, setNewBestRank] = useState<number | null>(null)

  useEffect(() => {
    bestScoresRef.current = bestScores
  }, [bestScores])

  const [gameState, setGameState] = useState<"start" | "countdown" | "running" | "paused" | "over" | "dev_paused">("start")
  const [countdown, setCountdown] = useState<number | string>(3)
  const [comboCount, setComboCount] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [showNewBest, setShowNewBest] = useState(false)
  const [isAuto, setIsAuto] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isClassic, setIsClassic] = useState(false)
  const [particlesEnabled, setParticlesEnabled] = useState(true)
  const [trailsEnabled, setTrailsEnabled] = useState(true)
  const [animationLevel, setAnimationLevel] = useState<"full" | "min" | "none">("full")
  const [openSettings, setOpenSettings] = useState(false)
  const [openStats, setOpenStats] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [isFlashRed, setIsFlashRed] = useState(false)
  const [isFlashWhite, setIsFlashWhite] = useState(false)
  const [gameMode, setGameMode] = useState<"normal" | "hardcode" | "sudden_death">("normal")
  const [snowLeft, setSnowLeft] = useState(0)
  const [snowActive, setSnowActive] = useState(false)
  const [language, setLanguage] = useState<"en" | "vi" | "es" | "ru">("en")
  const [skin, setSkin] = useState("default")
  const [openCustom, setOpenCustom] = useState(false)
  const [openQuickPlay, setOpenQuickPlay] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isBlank, setIsBlank] = useState(false)
  const [isReverse, setIsReverse] = useState(false)
  const [isReverseControl, setIsReverseControl] = useState(false)
  const [isMirror, setIsMirror] = useState(false)
  const [isInvisible, setIsInvisible] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)
  const [customConfig, setCustomConfig] = useState<CustomConfig>({
    isClassic: false,
    difficulty: "normal",
    isAuto: false,
    isHidden: false,
    isBlank: false,
    isReverse: false,
    isReverseControl: false,
    isMirror: false,
    isInvisible: false,
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

  const [configHistory, setConfigHistory] = useState<CustomConfig[]>([])
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [sfxVolume, setSfxVolume] = useState(0.5)
  const [bgMenuEnabled, setBgMenuEnabled] = useState(true)
  const [sensitivity, setSensitivity] = useState(0)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [showDevToast, setShowDevToast] = useState(false)
  const [showDevMenu, setShowDevMenu] = useState(false)
  const [debugUI, setDebugUI] = useState(false)
  const [debugHitboxPlay, setDebugHitboxPlay] = useState(false)

  // Intro modal: show on first page load / reload until user hits Start
  const [showIntro, setShowIntro] = useState(true)
  const [introStep, setIntroStep] = useState(0)

  const isMobile = useIsMobile()

  const [bestScoreIndex, setBestScoreIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setBestScoreIndex((prev) => prev + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Load persisted best scores and migrate old keys if present
  useEffect(() => {
    const loaded = initializeScores()

    Object.keys(loaded).forEach(k => {
      const v = localStorage.getItem(k)
      if (v !== null) {
        const n = Number.parseInt(v, 10)
        if (!Number.isNaN(n)) loaded[k] = n
      }
    })

    // Legacy keys migration
    const legacyMappings = [
      { old: "my_game_best_normal", difficulty: "normal", gameType: "default" },
      { old: "my_game_best_hardcore", difficulty: "hardcode", gameType: "default" },
      { old: "my_game_best_classic_normal", difficulty: "normal", gameType: "classic" },
      { old: "my_game_best_classic_hardcore", difficulty: "hardcode", gameType: "classic" },
    ]

    legacyMappings.forEach(({ old, difficulty, gameType }) => {
      const val = localStorage.getItem(old)
      if (val !== null) {
        const n = Number.parseInt(val, 10)
        if (!Number.isNaN(n)) {
          const newKey = getScoreKey(difficulty as Difficulty, gameType as GameType, { isHidden: false, isBlank: false, isReverse: false })
          if ((loaded[newKey] || 0) < n) {
            loaded[newKey] = n
            localStorage.setItem(newKey, String(n))
          }
        }
        localStorage.removeItem(old)
      }
    })

    setBestScores(loaded)

    const savedHistory = localStorage.getItem("game_recent_history")
    if (savedHistory) {
      try {
        setRecentScores(JSON.parse(savedHistory))
      } catch (e) { console.error("Failed to load history", e) }
    }
  }, [])

  const gameData = useRef({
    score: 0,
    lives: 5,
    combo: 0,
    isAuto: false,
    isCustom: false,
    customBallConfig: {} as Record<string, { enabled: boolean; score: number; rate: number }>,
    allowedBalls: [] as string[],
    isClassic: false,
    isHidden: false,
    isBlank: false,
    isReverse: false,
    isReverseControl: false,
    isMirror: false,
    isInvisible: false,
    gameMode: "normal" as "normal" | "hardcode" | "sudden_death",
    playerX: 210,
    targetPlayerX: 210,
    sensitivity: 0,
    playerWidth: 80,
    targetWidth: 80,
    isBoosted: false,
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
    ball: { x: 250, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal" as any, sinTime: 0 },
    bombs: [] as { x: number; y: number; radius: number; speed: number }[],
    isDying: false,
    deathX: 0,
    deathY: 0,
    skin: "default",
  })

  const debugFlags = useRef({ hitbox: false })

  useEffect(() => {
    debugFlags.current.hitbox = debugHitboxPlay
  }, [debugHitboxPlay])

  // Save score only when Game Over
  useEffect(() => {
    if (gameState === "over") {
      const { score, isAuto, isCustom, gameMode, isClassic, isHidden, isBlank, isReverse, isReverseControl, isMirror, isInvisible } = gameData.current

      let newEntry: HistoryEntry | undefined

      // Save History for Quick Play (Non-Auto, Non-Custom)
      if (!isAuto && !isCustom) {
        newEntry = {
          score: Math.floor(score),
          timestamp: Date.now(),
          difficulty: gameMode,
          gameType: isClassic ? "classic" : "default",
          modifiers: { isHidden: !!isHidden, isBlank: !!isBlank, isReverse: !!isReverse },
          funny: { isReverseControl, isMirror, isInvisible }
        }
        
        const entryToSave = newEntry
        setRecentScores(prev => {
          const all = [entryToSave, ...prev]

          // 1. Tìm Top 5 của mỗi chế độ để bảo vệ (không bị xóa do đầy)
          const classic = all.filter(x => x.gameType === 'classic')
          const def = all.filter(x => x.gameType !== 'classic')

          const topClassic = [...classic].sort((a, b) => b.score - a.score).slice(0, 5)
          const topDefault = [...def].sort((a, b) => b.score - a.score).slice(0, 5)
          const protectedSet = new Set([...topClassic, ...topDefault])

          // 2. Lấy 20 trận gần nhất
          const recent20 = all.slice(0, 20)

          // 3. Gộp: Giữ lại nếu nằm trong 20 trận gần nhất HOẶC nằm trong Top 5
          const result = all.filter(x => recent20.includes(x) || protectedSet.has(x))
          result.sort((a, b) => b.timestamp - a.timestamp)

          localStorage.setItem("game_recent_history", JSON.stringify(result))
          return result
        })
      }

      if (!isAuto && !isCustom && newEntry) {
        const currentDiff = gameMode
        const currentType = isClassic ? "classic" : "default"
        const currentMods = {
          isHidden: !!isHidden,
          isBlank: !!isBlank,
          isReverse: !!isReverse,
        }

        const scoreKey = getScoreKey(currentDiff as any, currentType as any, currentMods)
        const currentBest = bestScoresRef.current[scoreKey] ?? 0
        const currentScore = Math.floor(score)
        let nextBestScores = bestScoresRef.current

        if (currentScore > currentBest) {
          setIsNewBestRecord(true)
          nextBestScores = { ...bestScoresRef.current, [scoreKey]: currentScore }
          setBestScores(nextBestScores)
          bestScoresRef.current = nextBestScores
          localStorage.setItem(scoreKey, String(currentScore))
        }

        // --- Calculate Top 5 Rank ---
        // 1. Get all Best Scores for current mode (Classic/Default)
        const relevantBests = Object.entries(nextBestScores)
          .filter(([k]) => {
            const s = k.replace(/^best_score_/, "")
            let diff = ""
            let type = ""
            if (s.startsWith("sudden_death_")) {
              diff = "sudden_death"
              type = s.replace("sudden_death_", "").split("_")[0]
            } else {
              const parts = s.split("_")
              diff = parts[0]
              type = parts[1]
            }
            return diff === currentDiff && (isClassic ? type === "classic" : type !== "classic")
          })
          .map(([k, v]) => {
            // Parse key to get details for deduplication
            const s = k.replace(/^best_score_/, "")
            let difficulty = ""
            let modifierParts: string[] = []
            if (s.startsWith("sudden_death_")) {
              difficulty = "sudden_death"
              const rest = s.replace("sudden_death_", "")
              modifierParts = rest.split("_").slice(1)
            } else {
              const parts = s.split("_")
              difficulty = parts[0]
              modifierParts = parts.slice(2)
            }
            return {
              value: v,
              difficulty,
              modifiers: {
                isHidden: modifierParts.includes('h'),
                isBlank: modifierParts.includes('b'),
                isReverse: modifierParts.includes('r'),
              }
            }
          })

        // 2. Get all Recent Scores for current mode (using the updated list)
        // We need to use the 'updated' list from the setRecentScores callback, but we can't access it here easily.
        // However, we know we just added 'newEntry' to 'recentScores'.
        const updatedRecents = [newEntry, ...recentScores].slice(0, 10)
        
        const relevantRecents = updatedRecents
          .filter(r => r.difficulty === currentDiff && (isClassic ? r.gameType === "classic" : r.gameType !== "classic"))
          .map(r => ({
            value: r.score,
            difficulty: r.difficulty,
            modifiers: r.modifiers,
            // We ignore 'funny' here because we already returned early if isFunny is true
          }))

        // 3. Filter duplicates (Remove Bests that are already in Recents)
        const uniqueBests = relevantBests.filter(b => {
          return !relevantRecents.some(r => 
            r.value === b.value && 
            r.difficulty === b.difficulty &&
            r.modifiers.isHidden === b.modifiers.isHidden &&
            r.modifiers.isBlank === b.modifiers.isBlank &&
            r.modifiers.isReverse === b.modifiers.isReverse
          )
        })

        // 4. Combine and Sort
        const allScores = [...uniqueBests.map(b => b.value), ...relevantRecents.map(r => r.value)]
          .sort((a, b) => b - a)

        // 5. Find Rank
        const rank = allScores.indexOf(currentScore) + 1
        if (rank > 0 && rank <= 5) {
          setNewBestRank(rank)
        } else {
          setNewBestRank(null)
        }

      } else {
        setIsNewBestRecord(false)
        setNewBestRank(null)
      }
    }
  }, [gameState])

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
      try { menu.pause(); menu.currentTime = 0 } catch (e) { }
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

  // --- Keyboard Shortcuts (PC) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Escape") {
        if (gameState === "running") {
          playClick()
          pauseGame()
        } else if (gameState === "paused") {
          // Only resume if not in settings or confirming exit
          if (!openSettings && !confirmExit) {
            resumeGame()
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, openSettings, confirmExit])

  // --- Audio Helper: Fade In / Fade Out ---
  const fadeAudio = (audio: HTMLAudioElement, targetVol: number, duration = 800, onComplete?: () => void) => {
    if (!audio) return
    // Clear previous fade interval if stored on the audio object
    if ((audio as any).fadeInterval) clearInterval((audio as any).fadeInterval)

    const startVol = audio.volume
    const startTime = Date.now()

    if (targetVol > 0) {
      audio.volume = startVol // Start from current (usually 0 if fading in)
      audio.play().catch(() => { })
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
      try { menu.pause(); menu.currentTime = 0 } catch (e) { }
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

  const stopSound = (name: string) => {
    if (audioRefs.current && audioRefs.current[name]) {
      audioRefs.current[name].pause()
      audioRefs.current[name].currentTime = 0
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
      audioRefs.current.pause_bg.play().catch(() => { })
    }
  }

  const resumeGame = () => {
    playClick()
    // Resume Game Music
    if (currentBgmRef.current && !gameData.current.isMuted) {
      currentBgmRef.current.volume = musicVolume
      currentBgmRef.current.play().catch(() => { })
    }
    // Stop Pause Music
    if (audioRefs.current?.pause_bg) {
      audioRefs.current.pause_bg.pause()
      audioRefs.current.pause_bg.currentTime = 0
    }

    const resumeBombSound = () => {
      const hasBombs = gameData.current.bombs.length > 0 || gameData.current.ball.type === "orange"
      if (hasBombs && audioRefs.current?.bomb_fall && !gameData.current.isMuted) {
        audioRefs.current.bomb_fall.play().catch(() => { })
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

    // Reset Snow Effect
    if (snowIntervalRef.current) {
      clearInterval(snowIntervalRef.current)
      snowIntervalRef.current = null
    }
    setSnowLeft(0)
    setSnowActive(false)
    gameData.current.isSnowSlowed = false
    gameData.current.timeScale = 1
    gameData.current.targetTimeScale = 1

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
        currentBgmRef.current.play().catch(() => { })
      } else if (gameState === "paused" && audioRefs.current?.pause_bg) {
        audioRefs.current.pause_bg.volume = musicVolume
        audioRefs.current.pause_bg.play().catch(() => { })
      } else if (gameState === "start" && audioRefs.current?.bg_menu && bgMenuEnabled) {
        audioRefs.current.bg_menu.volume = musicVolume
        audioRefs.current.bg_menu.play().catch(() => { })
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

  const changeAnimationLevel = (level: "full" | "min" | "none") => {
    playClick()
    setAnimationLevel(level)
    localStorage.setItem("game_animation_level", level)
  }

  const resetBall = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (gameData.current.lives <= 0 || gameData.current.isDying) return

    // Sử dụng logic từ MainGameLogic để tạo bóng mới
    const result = spawnBall(gameData.current, canvas.width, canvas.height)

    // Cập nhật trạng thái bóng hiện tại
    Object.assign(gameData.current.ball, result.ball)

    // Thêm bom nếu có
    if (result.newBomb) {
      gameData.current.bombs.push(result.newBomb)
      playSound("bomb_fall")
    }

    // Phát âm thanh nếu cần (ví dụ: bóng cam rơi)
    if (result.soundToPlay) {
      playSound(result.soundToPlay)
    }
  }

  const startCountdown = (mode: "normal" | "hardcode" | "sudden_death", isClassicMode: boolean, isAutoMode: boolean) => {
    // Ensure menu BGM stops fully when entering any game mode
    stopMenuBgm()

    // Update startCountdown to accept and set game mode, then run countdown
    setGameMode(mode)
    setIsClassic(isClassicMode)
    setIsNewBestRecord(false)
    setNewBestRank(null)
    setIsAuto(isAutoMode)
    // These are now part of the quick play modal, so we use their state directly
    // setIsReverse(isReverse)
    // setIsHidden(isHidden) 
    // setIsBlank(isBlank)

    runCountdown(isAutoMode, () => {
      gameData.current = {
        ...gameData.current,
        score: 0,
        lives: (mode === "hardcode" || mode === "sudden_death") ? 1 : 5, // 1 life for Hardcode & Sudden Death
        combo: 0,
        gameMode: mode,
        isCustom: false,
        customBallConfig: {},
        allowedBalls: [],
        isClassic: isClassicMode,
        isHidden: isHidden,
        isBlank: isBlank,
        isReverse: isReverse,
        isReverseControl: isReverseControl,
        isMirror: isMirror,
        isInvisible: isInvisible,
        playerX: 210,
        targetPlayerX: 210,
        playerWidth: 80,
        targetWidth: 80,
        isBoosted: false,
        isMuted: false,
        sfxVolume: 0.5,
        boostTimeLeft: 0,
        snowTimeLeft: 0,
        isSnowSlowed: false,
        timeScale: 1,
        hasPlayedNewBest: false,
        hasShield: false,
        ball: { x: 250, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal", sinTime: 0 },
        bombs: [],
        isDying: false,
        deathX: 0,
        deathY: 0,
        isAuto: isAutoMode,
      }
      if (snowIntervalRef.current) {
        clearInterval(snowIntervalRef.current)
        snowIntervalRef.current = null
      }
      setSnowLeft(0)
      setSnowActive(false)
      setIsAuto(isAutoMode)
      setIsClassic(isClassicMode)
      // No need to set state here, it's already managed
      // setIsHidden(isHidden)
      // setIsBlank(isBlank)
      setScore(0)
      setLives((mode === "hardcode" || mode === "sudden_death") ? 1 : 5)
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
      if (isAutoMode) bgm = audioRefs.current?.bg_game_auto
      else if (mode === "hardcode" || mode === "sudden_death") bgm = audioRefs.current?.bg_game_hardcode
      currentBgmRef.current = bgm
      if (bgm) bgm.volume = 0
      fadeAudio(bgm, musicVolume, 2000)
    })
  }

  const startCustomGame = () => {
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

    setIsNewBestRecord(false)
    setNewBestRank(null)
    // Đóng modal trước khi bắt đầu đếm ngược
    setOpenCustom(false)

    runCountdown(customConfig.isAuto, () => {
      const difficulty = customConfig.difficulty
      const lives = (difficulty === "hardcode" || difficulty === "sudden_death") ? 1 : 5

      gameData.current = {
        ...gameData.current,
        score: 0,
        lives: lives,
        combo: 0,
        gameMode: difficulty,
        isClassic: customConfig.isClassic,
        isCustom: true,
        customBallConfig: JSON.parse(JSON.stringify(customConfig.balls)),
        allowedBalls: allowed,
        isReverse: customConfig.isReverse,
        isReverseControl: customConfig.isReverseControl,
        isMirror: customConfig.isMirror,
        isInvisible: customConfig.isInvisible,
        playerX: 210,
        isHidden: customConfig.isHidden,
        isBlank: customConfig.isBlank,
        targetPlayerX: 210,
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
        ball: { x: 250, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal", sinTime: 0 },
        bombs: [],
        isDying: false,
        deathX: 0,
        deathY: 0,
        isAuto: customConfig.isAuto,
      }
      if (snowIntervalRef.current) {
        clearInterval(snowIntervalRef.current)
        snowIntervalRef.current = null
      }
      setSnowLeft(0)
      setSnowActive(false)
      setIsAuto(customConfig.isAuto)
      setIsClassic(customConfig.isClassic)
      setIsHidden(customConfig.isHidden)
      setIsBlank(customConfig.isBlank)
      setIsReverse(customConfig.isReverse)
      setIsReverseControl(customConfig.isReverseControl)
      setIsMirror(customConfig.isMirror)
      setIsInvisible(customConfig.isInvisible)
      setScore(0)
      setLives(lives)
      setComboCount(0)
      setGameState("running")
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

    setIsNewBestRecord(false)
    setNewBestRank(null)
    gameData.current = {
      ...gameData.current,
      score: 0,
      lives: (gameMode === "hardcode" || gameMode === "sudden_death") ? 1 : 5,
      combo: 0,
      gameMode: gameMode,
      isCustom: false,
      customBallConfig: {},
      allowedBalls: [],
      isClassic: isClassic,
      isHidden: isHidden,
      isBlank: isBlank,
      isReverse: isReverse,
      isReverseControl: isReverseControl,
      isMirror: isMirror,
      isInvisible: isInvisible,
      playerX: 210,
      targetPlayerX: 210,
      playerWidth: 80,
      targetWidth: 80,
      isBoosted: false,
      boostTimeLeft: 0,
      snowTimeLeft: 0,
      isSnowSlowed: false,
      timeScale: 1,
      hasPlayedNewBest: false,
      hasShield: false,
      ball: { x: 250, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal", sinTime: 0 },
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
    setLives((gameMode === "hardcode" || gameMode === "sudden_death") ? 1 : 5)
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
      score_count: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/score_count.mp3"),
      game_over_new_best: loadAudio("https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/game_over_new_best.mp3"),
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
    if (audioRefs.current.score_count) audioRefs.current.score_count.loop = true

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

    const savedQuickPlayConfig = localStorage.getItem("game_quickplay_config")
    if (savedQuickPlayConfig) {
      try {
        const parsed = JSON.parse(savedQuickPlayConfig)
        setGameMode(parsed.gameMode || "normal")
        setIsClassic(parsed.isClassic || false)
        setIsHidden(parsed.isHidden || false)
        setIsBlank(parsed.isBlank || false)
        setIsAuto(parsed.isAuto || false)
        setIsReverse(parsed.isReverse || false)
        setIsReverseControl(parsed.isReverseControl || false)
        setIsMirror(parsed.isMirror || false)
        setIsInvisible(parsed.isInvisible || false)
      } catch (e) {
        console.error("Error loading quick play config", e)
      }
    }

    const savedParticles = localStorage.getItem("game_particles") !== "false"
    setParticlesEnabled(savedParticles)
    gameData.current.particlesEnabled = savedParticles
    const savedTrails = localStorage.getItem("game_trails") !== "false";
    const savedAnimLevel = localStorage.getItem("game_animation_level");
    if (savedAnimLevel === "full" || savedAnimLevel === "min" || savedAnimLevel === "none") {
      setAnimationLevel(savedAnimLevel);
    }
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
      try { menuBgm.currentTime = 0 } catch (e) { }
      currentBgmRef.current = menuBgm
      if (!gameData.current.isMuted) fadeAudio(menuBgm, musicVolume, 1000)
    } else {
      if (currentBgmRef.current === menuBgm) {
        // Fade out then fully stop & reset so next menu entry starts from the beginning
        fadeAudio(menuBgm, 0, 500, () => {
          try { menuBgm.pause(); menuBgm.currentTime = 0 } catch (e) { }
          if (currentBgmRef.current === menuBgm) currentBgmRef.current = null
        })
      }
    }
  }, [gameState, showIntro, bgMenuEnabled])

  // Intro effect: advance the intro steps and ensure menu music is paused/reset while intro is active
  useEffect(() => {
    if (showIntro) {
      if (audioRefs.current?.bg_menu) {
        try { audioRefs.current.bg_menu.pause(); audioRefs.current.bg_menu.currentTime = 0 } catch (e) { }
        if (currentBgmRef.current === audioRefs.current.bg_menu) currentBgmRef.current = null
      }

      setIntroStep(0)
      const t1 = window.setTimeout(() => setIntroStep(1), 1000)
      const t2 = window.setTimeout(() => setIntroStep(2), 2000)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [showIntro])

  // Persist custom config and quick play settings separately (so it doesn't interfere with intro timings)
  useEffect(() => {
    if (isConfigLoaded) {
      localStorage.setItem("game_custom_config", JSON.stringify(customConfig))
      localStorage.setItem("game_quickplay_config", JSON.stringify({
        gameMode,
        isClassic,
        isAuto,
        isHidden,
        isBlank,
        isReverse,
        isReverseControl,
        isMirror,
        isInvisible,
      }))
    }
  }, [customConfig, gameMode, isClassic, isAuto, isHidden, isBlank, isReverse, isConfigLoaded])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let boostInterval: any

    const clearSnow = () => {
      gameData.current.timeScale = 1
      gameData.current.isSnowSlowed = false
      gameData.current.snowTimeLeft = 0
      if (snowIntervalRef.current) {
        clearInterval(snowIntervalRef.current)
        snowIntervalRef.current = null
      }
      setSnowActive(false)
      setSnowLeft(0)
    }

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
      let mouseX = (clientX - rect.left) * scaleX
      if (gameData.current.isReverseControl) {
        mouseX = canvas.width - mouseX
      }
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

      const isReverse = gameData.current.isReverse
      const gravityDirection = isReverse ? -1 : 1
      const logicPaddleY = isReverse ? 90 : canvas.height - 90
      const visualPaddleY = gameData.current.isMirror 
        ? (isReverse ? canvas.height - 90 : 90) 
        : logicPaddleY

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

        if (gameData.current.gameMode === "hardcode" || gameData.current.gameMode === "sudden_death") {

          // 1. Stop falling sound immediately
          stopSound("bomb_fall");

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
            clearSnow()
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
            clearSnow()
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
        const ts = gameData.current.timeScale || 1

        // 1. Predict Ball Position
        const timeToHit = Math.abs(logicPaddleY - b.y) / (b.speed * ts)
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
            const dynamicAmplitude = b.speed * 3
            predictedX += Math.sin(futureSinTime) * dynamicAmplitude
          }
        }

        // 2. Identify Danger Zones
        const pWidth = gameData.current.playerWidth
        const safetyMargin = 15
        
        // Hard Zones: Immediate threats (cannot cross)
        const hardZones: { min: number; max: number }[] = []
        // Soft Zones: Future threats (can cross but don't stop)
        const softZones: { min: number; max: number }[] = []

        const addZone = (zones: any[], x: number, r: number) => {
          const safeDist = pWidth / 2 + r + safetyMargin
          zones.push({ min: x - safeDist, max: x + safeDist })
        }

        // Main ball is a threat if orange
        if (b.type === "orange") {
          const distY = isReverse ? (b.y - logicPaddleY) : (logicPaddleY - b.y)
          // Orange ball is always treated as Hard Zone if it's falling towards us
          if (distY < 400 && distY > -50) addZone(hardZones, predictedX, b.radius)
          else addZone(softZones, predictedX, b.radius)
        }

        // Falling bombs
        gameData.current.bombs.forEach(bomb => {
          const distY = isReverse ? (bomb.y - logicPaddleY) : (logicPaddleY - bomb.y)
          // If bomb is close (e.g. < 250px), it's a Hard Zone
          if (distY < 250 && distY > -50) {
            addZone(hardZones, bomb.x, bomb.radius)
          } else {
            addZone(softZones, bomb.x, bomb.radius)
          }
        })

        // Merge Hard Zones
        hardZones.sort((a, b) => a.min - b.min)
        const mergedHardZones: { min: number; max: number }[] = []
        if (hardZones.length > 0) {
          let current = hardZones[0]
          for (let i = 1; i < hardZones.length; i++) {
            const next = hardZones[i]
            if (current.max >= next.min) {
              current.max = Math.max(current.max, next.max)
            } else {
              mergedHardZones.push(current)
              current = next
            }
          }
          mergedHardZones.push(current)
        }

        // Merge Soft Zones
        softZones.sort((a, b) => a.min - b.min)
        const mergedSoftZones: { min: number; max: number }[] = []
        if (softZones.length > 0) {
          let current = softZones[0]
          for (let i = 1; i < softZones.length; i++) {
            const next = softZones[i]
            if (current.max >= next.min) {
              current.max = Math.max(current.max, next.max)
            } else {
              mergedSoftZones.push(current)
              current = next
            }
          }
          mergedSoftZones.push(current)
        }

        // 3. Calculate Safe Intervals (from Hard Zones)
        const validMin = pWidth / 2
        const validMax = canvas.width - pWidth / 2
        const safeIntervals: { min: number; max: number }[] = []

        let cursor = validMin
        mergedHardZones.forEach(z => {
          if (z.min > cursor) {
            safeIntervals.push({ min: cursor, max: z.min })
          }
          cursor = Math.max(cursor, z.max)
        })
        if (cursor < validMax) {
          safeIntervals.push({ min: cursor, max: validMax })
        }

        // 4. Determine Target
        const currentCenter = gameData.current.playerX + pWidth / 2
        let targetCenter = currentCenter

        // Find best interval (closest to current position to ensure reachability)
        let bestInterval = null
        let minDistToInterval = Infinity

        if (safeIntervals.length > 0) {
          for (const interval of safeIntervals) {
            if (currentCenter >= interval.min && currentCenter <= interval.max) {
              bestInterval = interval
              break
            }
            const dist = currentCenter < interval.min ? interval.min - currentCenter : currentCenter - interval.max
            if (dist < minDistToInterval) {
              minDistToInterval = dist
              bestInterval = interval
            }
          }
        }

        if (bestInterval) {
          // Initial Target: Ball or Current
          let desiredX = (b.type !== "orange") ? predictedX : currentCenter
          
          // Clamp to Hard Safe Interval
          targetCenter = Math.max(bestInterval.min, Math.min(desiredX, bestInterval.max))
          
          // Avoid Soft Zones (Don't stop under a high bomb)
          for (const sz of mergedSoftZones) {
             if (targetCenter > sz.min && targetCenter < sz.max) {
               // We are inside a soft zone.
               const dLeft = Math.abs(targetCenter - sz.min)
               const dRight = Math.abs(targetCenter - sz.max)
               
               // If ball is safe and outside this soft zone, try to move towards it
               let escapeX = dLeft < dRight ? sz.min : sz.max
               if (b.type !== "orange") {
                  if (predictedX < sz.min) escapeX = sz.min
                  else if (predictedX > sz.max) escapeX = sz.max
               }
               
               // Clamp escapeX to bestInterval
               escapeX = Math.max(bestInterval.min, Math.min(escapeX, bestInterval.max))
               targetCenter = escapeX
             }
          }
        }

        // 5. Move
        const targetX = targetCenter - pWidth / 2

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
        const prevBallY = b.y;
        const ts = gameData.current.timeScale || 1
        b.y += b.speed * ts * gravityDirection
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
          bomb.y += bomb.speed * ts * gravityDirection

          // Check collision with player
          const isInsideX = bomb.x >= gameData.current.playerX && bomb.x <= gameData.current.playerX + gameData.current.playerWidth
          const isHitY = isReverse
            ? bomb.y - bomb.radius <= logicPaddleY + 15 && bomb.y - bomb.radius > logicPaddleY - 15
            : bomb.y + bomb.radius >= logicPaddleY && bomb.y + bomb.radius < logicPaddleY + 30

          if (isInsideX && isHitY) {
            handleBombHit(bomb.x, bomb.y)
            gameData.current.bombs.splice(i, 1)
            if (gameData.current.bombs.length === 0 && gameData.current.ball.type !== "orange") {
              stopSound("bomb_fall")
            }
            continue
          }

          // Remove if out of bounds
          if ((!isReverse && bomb.y > canvas.height) || (isReverse && bomb.y < 0)) {
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
        const isHitY = isReverse
          ? b.y - b.radius <= logicPaddleY + 15 && prevBallY >= logicPaddleY
          : b.y + b.radius >= logicPaddleY && prevBallY <= logicPaddleY + 15
        if (isInsideX && isHitY) {
          const isCenter =
            Math.abs(b.x - (gameData.current.playerX + gameData.current.playerWidth / 2)) <
            (gameData.current.playerWidth * 0.3) / 2

          // --- PHẦN XỬ LÝ LOẠI BÓNG (Giữ nguyên logic của bạn) ---
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

          // --- PHẦN TÍNH ĐIỂM ---
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

          // Apply Multiplier
          const currentDiff = gameData.current.gameMode;
          const currentType = gameData.current.isClassic ? "classic" : "default";
          const currentMods = {
            isHidden: !!gameData.current.isHidden,
            isBlank: !!gameData.current.isBlank,
            isReverse: !!gameData.current.isReverse
          };
          const isFunny = gameData.current.isReverseControl || gameData.current.isMirror || gameData.current.isInvisible;
          
          const multiplier = getScoreMultiplier(currentDiff, currentType, currentMods, isFunny);
          
          gameData.current.score += scoreAdd * multiplier

          // --- FIX LỖI RESET/SAI KEY TẠI ĐÂY ---

          // 1. Tạo Key nhất quán (Không ép kiểu sudden_death về hardcode nữa)
          const scoreKey = getScoreKey(currentDiff as any, currentType as any, currentMods);

          // 2. Lấy currentBest chuẩn từ state (đã load khi bắt đầu game)
          const currentBest = bestScoresRef.current[scoreKey] ?? 0;

          // 3. Kiểm tra điều kiện lưu (Không lưu nếu Auto hoặc Custom)
          const currentScoreInt = Math.floor(gameData.current.score);

          // Removed in-game "New Best" notification as requested to focus on Top 5 at Game Over

          setScore(currentScoreInt)
          resetBall()
        }

        if ((!isReverse && b.y > canvas.height) || (isReverse && b.y < -b.radius)) {
          if (b.type === "orange") {
            resetBall()
            if (gameData.current.bombs.length === 0) stopSound("bomb_fall")
          } else if (gameData.current.gameMode === "sudden_death") {
            // --- SUDDEN DEATH LOGIC ---
            // Miss ANY ball (except bomb) = Instant Death
            if (isSuddenDeathMiss(b.type)) {
              gameData.current.lives = 0
              setLives(0)
              playSound("miss")
              setIsFlashRed(true)
              setTimeout(() => setIsFlashRed(false), 150)
              createParticles(b.x, isReverse ? 6 : canvas.height - 6, "#ef4444", "miss", true)

              setGameState("over")
              clearSnow()
              stopSound("bomb_fall")
              playSound("gameover")
              fadeAudio(currentBgmRef.current, 0, 1500)

              resetBall()
            } else {
              // Should not happen if isSuddenDeathMiss covers all non-orange, but safe fallback
              resetBall()
            }
          } else if (["normal", "purple", "yellow"].includes(b.type)) {
            if (gameData.current.hasShield) {
              gameData.current.hasShield = false
              playSound("shield_breaking")
              createParticles(b.x, isReverse ? 6 : canvas.height - 6, "#94a3b8", "shard", true)
              gameData.current.combo = 0
              setComboCount(0)
              resetBall()
            } else {
              gameData.current.lives--
              setLives(gameData.current.lives)
              playSound("miss");
              setIsFlashRed(true)
              setTimeout(() => setIsFlashRed(false), 150)
              createParticles(b.x, isReverse ? 6 : canvas.height - 6, "#ef4444", "miss", true)
              gameData.current.combo = 0
              setComboCount(0)
              if (gameData.current.lives <= 0) {
                setGameState("over")
                // Ensure snow effect cleaned up on game over
                clearSnow()
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
        ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
        ctx.fillRect(0, isReverse ? 0 : canvas.height - 12, canvas.width, 12)
        ctx.restore()
      }

      if (gameData.current.trailsEnabled) {
        trails.current.forEach((t, i) => {
          t.alpha -= 0.05 // Trail decay
        })
      }

      if (gameData.current.particlesEnabled) {
        particles.current.forEach((p, i) => {
          if (p.type === "absorb") {
            const tX = gameData.current.playerX + gameData.current.playerWidth / 2
            p.x += (tX - p.x) * 0.15
            p.y += (visualPaddleY - p.y) * 0.15
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

      if (!gameData.current.isInvisible) {
      ctx.save()
      if (shadowBlur > 0) {
        ctx.shadowColor = shadowColor
        ctx.shadowBlur = shadowBlur
      }

      // Gradient for specific skins
      if (currentSkin === "inferno" && !gameData.current.isBoosted) {
        const grad = ctx.createLinearGradient(gameData.current.playerX, visualPaddleY, gameData.current.playerX, visualPaddleY + 15)
        grad.addColorStop(0, "#f97316"); grad.addColorStop(1, "#9a3412")
        paddleColor = grad as any
      } else if (currentSkin === "galaxy" && !gameData.current.isBoosted) {
        const grad = ctx.createLinearGradient(gameData.current.playerX, visualPaddleY, gameData.current.playerX, visualPaddleY + 15)
        grad.addColorStop(0, "#4338ca"); grad.addColorStop(1, "#1e1b4b")
        paddleColor = grad as any
      }

      ctx.fillStyle = paddleColor
      ctx.beginPath()
      ctx.roundRect(gameData.current.playerX, visualPaddleY, gameData.current.playerWidth, 15, 8)
      ctx.fill()
      ctx.restore()
      }

      // --- HIDDEN & BLANK LOGIC ---
      // 1. Vẽ vệt bóng và quả bóng trước
      // if (gameData.current.trailsEnabled) {
      //   trails.current.forEach((t, i) => {
      //     const hiddenAlpha = getHiddenBallAlpha(t.y, paddleY, gameData.current.isHidden)
      //     const finalAlpha = Math.max(0, t.alpha) * hiddenAlpha
      //     if (finalAlpha > 0) {
      //       ctx.globalAlpha = finalAlpha
      //       ctx.fillStyle = ballColors[b.type]
      //       ctx.beginPath()
      //       ctx.arc(t.x, t.y, b.radius * (i / 8), 0, Math.PI * 2)
      //       ctx.fill()
      //     }
      //   })
      // }

      const ballAlpha = getHiddenBallAlpha(b.y, logicPaddleY, canvas.height, gameData.current.isHidden, isReverse)
      if (ballAlpha > 0) {
        ctx.save()
        ctx.globalAlpha = ballAlpha
        drawBall(b.x, b.y, b.radius, b.type)
        ctx.restore()
      }

      // 2. Vẽ vật cản của chế độ "Blank" đè lên trên cùng
      const obstacleProps = getBlankObstacleProps(logicPaddleY, canvas.width, gameData.current.isBlank, isReverse)
      if (obstacleProps) {
        ctx.globalAlpha = 1 // Ensure obstacle is fully opaque
        ctx.fillStyle = 'rgb(10, 10, 20)'
        ctx.fillRect(obstacleProps.x, obstacleProps.y, obstacleProps.width, obstacleProps.height)
      }

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
        ctx.textBaseline = "middle"
        ctx.shadowColor = "rgba(249,115,22,0.7)"
        ctx.shadowBlur = 10
        ctx.fillStyle = "#fff7ed"
        const warnY = gameData.current.isReverse ? canvas.height - 180 : 180
        ctx.fillText("! BOMB !", canvas.width / 2, warnY)
        ctx.restore()
      }

      // --- DEBUG HITBOXES ---
      if (debugFlags.current.hitbox) {
        ctx.save()
        ctx.lineWidth = 1
        ctx.strokeStyle = "#ef4444" // Red
        ctx.fillStyle = "#ef4444"
        ctx.font = "10px monospace"

        // Paddle Hitbox (Logic)
        ctx.strokeRect(gameData.current.playerX, logicPaddleY, gameData.current.playerWidth, 15)
        ctx.fillText(`Paddle: ${gameData.current.playerX.toFixed(0)}`, gameData.current.playerX, logicPaddleY - 5)

        // Ball Hitbox
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillText(`B: ${b.x.toFixed(0)},${b.y.toFixed(0)}`, b.x + 12, b.y)

        // Bombs Hitbox
        gameData.current.bombs.forEach((bomb) => {
          ctx.beginPath()
          ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2)
          ctx.stroke()
        })
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
      transition: animationLevel === 'full'
        ? { type: "spring", stiffness: 450, damping: 28, staggerChildren: 0.06 }
        : { duration: 0 }
    },
    exit: { opacity: 0, scale: 0.96, y: -12, transition: { duration: animationLevel === 'full' ? 0.25 : 0 } },
  }

  const menuItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: animationLevel === 'full' ? { type: "spring", stiffness: 500, damping: 30 } : { duration: 0 } },
    exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: animationLevel === 'full' ? 0.18 : 0 } },
  }

  const guideVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: animationLevel === 'full' ? { type: "spring", stiffness: 360, damping: 28 } : { duration: 0 } },
    exit: { opacity: 0, y: -18, scale: 0.985, transition: { duration: animationLevel === 'full' ? 0.28 : 0, ease: "easeInOut" } },
  }

  const tabVariants = {
    hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 20 : -20, scale: 0.98 }),
    visible: {
      opacity: 1, x: 0, scale: 1,
      transition: animationLevel === 'full' ? { type: "spring", stiffness: 300, damping: 25 } : { duration: 0 }
    },
    exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 20 : -20, scale: 0.98, transition: { duration: animationLevel === 'full' ? 0.15 : 0 } }),
  }

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center overflow-hidden touch-none font-sans select-none md:p-4">
      {animationLevel === 'none' && (
        <style>{`
          .transition-all, .transition-colors, .transition-transform, .transition-opacity, .animate-pulse, .animate-spin {
            transition: none !important;
            animation: none !important;
          }
        `}</style>
      )}

      <DevModeModal
        devMode={devMode}
        setDevMode={setDevMode}
        showDevToast={showDevToast}
        setShowDevToast={setShowDevToast}
        showDevMenu={showDevMenu}
        setShowDevMenu={setShowDevMenu}
        debugHitboxPlay={debugHitboxPlay}
        setDebugHitboxPlay={setDebugHitboxPlay}
        debugUI={debugUI}
        setDebugUI={setDebugUI}
        gameState={gameState}
        setGameState={setGameState}
        score={score}
        setScore={setScore}
        gameData={gameData}
        currentBgmRef={currentBgmRef}
      />

      <AnimatePresence>
        {isFlashRed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={animationLevel !== 'none' ? undefined : { duration: 0 }}
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
            transition={animationLevel !== 'none' ? undefined : { duration: 0 }}
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
            transition={animationLevel !== 'none' ? undefined : { duration: 0 }}
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
            transition={animationLevel !== 'none' ? undefined : { duration: 0 }}
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
        className={`relative w-full md:max-w-[500px] md:max-h-[90vh] h-[calc(100vh-80px)] md:h-auto md:aspect-[5/7] rounded-none md:rounded-[2.5rem] overflow-auto md:overflow-hidden shadow-2xl border-0 md:border-[10px] transition-all duration-300 ${isFlashRed ? "md:border-red-600" : "md:border-slate-800"} bg-slate-900 flex items-center justify-center`}
      >
        <canvas
          ref={canvasRef}
          data-state={gameState}
          width="500"
          height="700"
          className="block cursor-none max-w-full max-h-full w-auto h-auto"
          style={{
            aspectRatio: "500/700",
          }}
        />

        {(gameState === "running" || gameState === "paused") && (
          <div className={`absolute left-0 right-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur-sm ${isReverse
            ? "bottom-0 bg-gradient-to-t from-black/60 to-transparent"
            : "top-0 bg-gradient-to-b from-black/60 to-transparent"
            }`}>
            <div className="flex items-center gap-6">
              {/* Score */}
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t.score}</span>
                <span className="text-xl font-black text-yellow-400 italic tabular-nums leading-none">{score}</span>
              </div>

              {/* Best Score */}
              {!isAuto && !gameData.current.isCustom && !isReverseControl && !isMirror && !isInvisible && (
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{t.best}</span>
                  {(() => {
                    const entries = Object.entries(bestScores)
                    const filtered = entries.filter(([k]) => {
                      if (!k.startsWith("best_score_")) return false
                      const s = k.replace(/^best_score_/, "")
                      let diff = ""
                      let type = ""
                      if (s.startsWith("sudden_death_")) {
                        diff = "sudden_death"
                        type = s.replace("sudden_death_", "").split("_")[0]
                      } else {
                        const parts = s.split("_")
                        diff = parts[0]
                        type = parts[1]
                      }
                      return diff === gameMode && (isClassic ? type === "classic" : type !== "classic")
                    })
                    
                    const top5 = filtered.sort((a, b) => b[1] - a[1]).slice(0, 5)
                    
                    if (top5.length === 0) return <span className="text-xl font-black text-slate-400 italic tabular-nums leading-none">0</span>

                    const current = top5[bestScoreIndex % top5.length]
                    const [key, value] = current
                    const rank = (bestScoreIndex % top5.length) + 1
                    
                    return (
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-black text-slate-400 italic tabular-nums leading-none">#{rank}: {value}</span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Lives */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t.lives}</span>
              {(gameMode === "hardcode" || gameMode === "sudden_death") ? (
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

        {/* MÀN HÌNH TẠM DỪNG CẢI TIẾN */}
        {gameState === "paused" && (
          <PauseModal
            t={t}
            animationsEnabled={animationLevel !== 'none'}
            isMobile={isMobile}
            score={score}
            confirmExit={confirmExit}
            toggleAutoMode={toggleAutoMode}
            playClick={playClick}
            setOpenSettings={setOpenSettings}
            resumeGame={resumeGame}
            handleExitRequest={handleExitRequest}
          />
        )}

        {gameState === "countdown" && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={animationLevel !== 'none' ? undefined : { duration: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm"
          >
            <span className="text-white font-black text-9xl italic drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
              {countdown}
            </span>
          </motion.div>
        )}

        { /* Intro Modal overlay */}
        <AnimatePresence>
        {showIntro && (
          <motion.div 
            key="intro-modal"
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-[100] bg-slate-950 flex items-center justify-center p-8"
          >
            <div className="max-w-md w-full text-center h-64 flex flex-col items-center justify-center relative">
              <AnimatePresence mode="wait">
              {introStep === 0 && (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 1.1, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.5, ease: "backOut" }}
                  className="absolute"
                >
                  <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 tracking-tighter">
                    MeoTN Gaming
                  </h3>
                </motion.div>
              )}
              {introStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 1.1, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.5, ease: "backOut" }}
                  className="absolute"
                >
                  <h3 className="text-3xl font-bold text-slate-400">
                    Build by <span className="text-white font-black">V0</span>
                  </h3>
                </motion.div>
              )}
              {introStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(20px)" }} 
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="flex flex-col items-center gap-8 z-10"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full animate-pulse" />
                    <h1 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-2xl relative">
                      Catch Master
                    </h1>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playClick();
                      setShowIntro(false);
                      const menu = audioRefs.current?.bg_menu
                      if (menu && !gameData.current.isMuted) {
                        try { menu.pause(); menu.currentTime = 0 } catch (e) { }
                        currentBgmRef.current = menu
                        fadeAudio(menu, musicVolume, 1000)
                      }
                    }}
                    className="px-12 py-4 rounded-2xl font-black text-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-3"
                  >
                    <Play size={24} fill="currentColor" />
                    START
                  </motion.button>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {gameState !== "running" && gameState !== "countdown" && gameState !== "paused" && (
          <motion.div
            variants={menuContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            <AnimatePresence mode="wait" custom={direction}>
              {gameState === "start" && activeTab === "home" && (
                <HomeModal
                  key="home"
                  t={t}
                  direction={direction}
                  variants={tabVariants}
                  menuItemVariants={menuItemVariants}
                  playClick={playClick}
                  setOpenQuickPlay={setOpenQuickPlay}
                  setOpenCustom={setOpenCustom}
                />
              )}

              {gameState === "over" && (
                <GameOverModal
                  t={t}
                  score={score}
                  direction={direction}
                  tabVariants={tabVariants}
                  menuItemVariants={menuItemVariants}
                  animationLevel={animationLevel}
                  playClick={playClick}
                  isNewBest={isNewBestRecord}
                  newBestRank={newBestRank}
                  playSound={playSound}
                  stopSound={stopSound}
                  onHome={() => {
                    setGameState("start")
                    setActiveTab("home")
                    setDirection(-1)
                    setSnowActive(false)
                    setSnowLeft(0)
                  }}
                  onSettings={() => {
                    setGameState("start")
                    setActiveTab("settings")
                    setDirection(1)
                    setSnowActive(false)
                    setSnowLeft(0)
                  }}
                />
              )}

              {/* --- TAB CONTENT: GUIDE --- */}
              {gameState === "start" && activeTab === "guide" && (
                <BallGuide key="guide" t={t} direction={direction} variants={tabVariants} />
              )}

              {/* --- TAB CONTENT: STATS --- */}
              {gameState === "start" && activeTab === "stats" && (
                <StatsModal
                  key="stats"
                  t={t}
                  direction={direction}
                  variants={tabVariants}
                  bestScores={bestScores}
                  setBestScores={setBestScores}
                  playClick={playClick}
                  recentScores={recentScores}
                  setRecentScores={setRecentScores}
                  animationLevel={animationLevel}
                />
              )}

              {/* --- TAB CONTENT: SKINS --- */}
              {gameState === "start" && activeTab === "skins" && (
                <motion.div key="skins" custom={direction} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center p-6 pb-4 shrink-0 z-10 border-b border-white/5">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.skins}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
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
                        className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${skin === s.id
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
                    animationLevel={animationLevel}
                    setAnimationLevel={changeAnimationLevel}
                    playClick={playClick}
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
                    {activeTab === tab.id && <motion.div layoutId="tab-indicator" transition={{ duration: animationLevel === 'full' ? 0.3 : 0 }} className="absolute -top-[1px] w-8 h-[2px] bg-blue-400 rounded-full" />}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {isAuto && gameState === "running" && (
        <div className={`absolute left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md transition-all duration-300 z-30 ${isReverse ? "bottom-36" : "top-36"}`}>
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
            transition={animationLevel !== 'none' ? { duration: 0.5 } : { duration: 0 }}
            className="absolute inset-0 z-[75] pointer-events-none"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={animationLevel !== 'none' ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={animationLevel !== 'none' ? { duration: 3, repeat: Infinity } : { duration: 0 }}
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
        {openQuickPlay && (
          <QuickPlayModal
            t={t}
            onClose={() => setOpenQuickPlay(false)}
            onPlay={(mode, isClassic, isAuto) => {
              setOpenQuickPlay(false)
              startCountdown(mode, isClassic, isAuto)
            }}
            playClick={playClick}
            animationLevel={animationLevel}
            gameMode={gameMode}
            setGameMode={setGameMode}
            isClassic={isClassic}
            setIsClassic={setIsClassic}
            isAuto={isAuto}
            setIsAuto={setIsAuto}
            isHidden={isHidden}
            setIsHidden={setIsHidden}
            isBlank={isBlank}
            setIsBlank={setIsBlank}
            isReverse={isReverse}
            setIsReverse={setIsReverse}
            isReverseControl={isReverseControl}
            setIsReverseControl={setIsReverseControl}
            isMirror={isMirror}
            setIsMirror={setIsMirror}
            isInvisible={isInvisible}
            setIsInvisible={setIsInvisible}
            bestScores={bestScores}
            recentScores={recentScores}
          />
        )}
        {openCustom && (
          <CustomGameModal
            t={t}
            customConfig={customConfig}
            setCustomConfig={setCustomConfig}
            customError={customError}
            setCustomError={setCustomError}
            setOpenCustom={setOpenCustom}
            startCustomGame={startCustomGame}
            playClick={playClick}
            animationsEnabled={animationLevel === 'full'}
            configHistory={configHistory}
            setConfigHistory={setConfigHistory}
          />
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
            animationLevel={animationLevel}
            setAnimationLevel={changeAnimationLevel}
            playClick={playClick}
            onClose={() => setOpenSettings(false)}
            bgMenuEnabled={bgMenuEnabled}
            toggleBgMenu={toggleBgMenu}
            musicVolume={musicVolume}
            setMusicVolume={changeMusicVolume}
            sfxVolume={sfxVolume}
            setSfxVolume={changeSfxVolume}
            sensitivity={sensitivity}
            setSensitivity={changeSensitivity}
            hideSystem={true}
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
