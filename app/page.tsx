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
  Zap,
} from "lucide-react"
import { TRANSLATIONS } from "./translations"
import { PixiParticleSystem } from "../lib/pixiParticleSystem"
import { initializePixiJS, cleanupPixiJS } from "../lib/pixiSetup"
import { audioRateManager } from "../lib/audioPlaybackRateManager"
import { swManager } from "../lib/serviceWorkerManager"
import SettingsModal from "./TabModal/SettingsModal"
import BallGuide from "./TabModal/BallGuide"
import StatsModal from "./TabModal/StatsModal"
import HomeModal from "./TabModal/HomeModal"
import CustomGameModal, { CustomConfig } from "./ModeModal/CustomGameModal"
import PauseModal from "./GameModal/PauseModal"
import GameOverModal from "./GameModal/GameOverModal"
import QuickPlayModal from "./ModeModal/QuickPlayModal"
import DevModeModal from "./DevModal/DevModeModal"
import OfflineGame from "./offlineGame"
import { spawnBall } from "./MainGameLogic"
import { isSuddenDeathMiss } from "./GameModal/SuddenDeathGameModal"
import { getHiddenBallAlpha } from "./GameModal/HiddenBallModal"
import { getBlankObstacleProps } from "./GameModal/BlankModal"
import { getInitialVerticalState } from "./GameModal/ReverseGameModal"
import { getScoreKey, initializeScores, getScoreMultiplier } from "./ScoreManager"
import type { Difficulty, GameType, HistoryEntry } from "./ScoreManager"
import { runAutoplayLogic } from "./AutoplayLogic"
import { resolveBallCollisions } from "./CollisionLogic"

// --- Update: Obfuscation Helpers for Score Security ---
const SECRET_SALT = "MEO_SECRET_KEY_2024_PWA_SECURE";
const obfuscate = (str: string) => {
  return btoa(str.split('').map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length))
  ).join(''));
};
const deobfuscate = (str: string) => {
  try {
    const decoded = atob(str);
    return decoded.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length))
    ).join('');
  } catch (e) { return null; }
};

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

interface Shockwave {
  x: number
  y: number
  w: number
  h: number
  radius: number
  alpha: number
  color: string
  borderRadius?: number // Thêm thuộc tính này để hỗ trợ bo góc cho shockwave hình chữ nhật
}

// --- Audio Utility: Web Audio API Clink Generator ---
let audioCtx: AudioContext | null = null;
const playClinkSfx = (volume: number) => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    // Tần số cao tạo tiếng "clink" kim loại
    osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.05 * volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) { /* Silent fail if audio context blocked */ }
};

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
  const [particlesEnabled, setParticlesEnabled] = useState(true)
  const [showFPS, setShowFPS] = useState(false)
  const [shockwavesEnabled, setShockwavesEnabled] = useState(true)
  const [cameraShakeEnabled, setCameraShakeEnabled] = useState(true)
  const [trailsEnabled, setTrailsEnabled] = useState(true)
  const [animationLevel, setAnimationLevel] = useState<"full" | "min" | "none">("full")
  const [openSettings, setOpenSettings] = useState(false)
  const [openSettingsFromPause, setOpenSettingsFromPause] = useState(false)
  const [freezeEffect, setFreezeEffect] = useState<"spread" | "simple" | "none">("spread")
  const [openStats, setOpenStats] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [isFlashRed, setIsFlashRed] = useState(false)
  const [isFlashWhite, setIsFlashWhite] = useState(false)
  const [gameMode, setGameMode] = useState<"normal" | "hardcode" | "sudden_death">("normal")
  const [snowLeft, setSnowLeft] = useState(0)
  const [snowActive, setSnowActive] = useState(false)
  const [snowContactPoint, setSnowContactPoint] = useState({ x: 50, y: 50 })
  const [language, setLanguage] = useState<"en" | "vi" | "es" | "ru">("en")
  const [skin, setSkin] = useState("default")
  const [background, setBackground] = useState("default")
  const [skinTab, setSkinTab] = useState<"skins" | "backgrounds">("skins")
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
  const [menuMusicVolume, setMenuMusicVolume] = useState(0.5)
  const [gameMusicVolume, setGameMusicVolume] = useState(0.5)
  const [sfxVolume, setSfxVolume] = useState(0.5)
  const [bgMenuEnabled, setBgMenuEnabled] = useState(true)
  const [gameMusicEnabled, setGameMusicEnabled] = useState(true)
  const [sfxEnabled, setSfxEnabled] = useState(true)
  const [sensitivity, setSensitivity] = useState(0)
  const [baseGameSpeed, setBaseGameSpeed] = useState(100) // 1.0x speed (100-500 = 1.0x-5.0x)
  const [rawInput, setRawInput] = useState(false)
  const [maxFPS, setMaxFPS] = useState(60) // 60 default, -1 = unlimited
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const fpsRef = useRef(0)
  const logicTimeRef = useRef(0)
  const [fpsDisplay, setFpsDisplay] = useState(0)
  const [logicDisplay, setLogicDisplay] = useState(0)
  const [gameSpeedDisplay, setGameSpeedDisplay] = useState(1.0)
  const [musicSpeedDisplay, setMusicSpeedDisplay] = useState(1.0)
  const [showDevToast, setShowDevToast] = useState(false)
  const [showDevMenu, setShowDevMenu] = useState(false)
  const [debugUI, setDebugUI] = useState(false)
  const [debugHitboxPlay, setDebugHitboxPlay] = useState(false)

  // Intro modal: show on first page load / reload until user hits Start
  const [showIntro, setShowIntro] = useState(true)
  const [introStep, setIntroStep] = useState(0)
  const [introLoadingProgress, setIntroLoadingProgress] = useState(0)

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
      if (v) {
        // Try to decrypt; if fails, fallback to legacy number parsing (migration)
        const decrypted = deobfuscate(v);
        const scoreVal = decrypted !== null ? Number.parseInt(decrypted, 10) : Number.parseInt(v, 10);
        
        if (!Number.isNaN(scoreVal)) {
          loaded[k] = scoreVal;
        }
      }
    })

    // Legacy keys migration
    const legacyMappings = [
      { old: "my_game_best_normal", difficulty: "normal", gameType: "default" },
      { old: "my_game_best_hardcore", difficulty: "hardcode", gameType: "default" },
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

    const savedHistory = localStorage.getItem("game_recent_history")
    if (savedHistory) {
      try {
        // Decrypt history JSON
        const decrypted = deobfuscate(savedHistory);
        const parsed = JSON.parse(decrypted || savedHistory);
        setRecentScores(parsed)

        if (Array.isArray(parsed)) {
          parsed.forEach((h: any) => {
            const key = getScoreKey(h.difficulty, h.gameType, h.modifiers)
            if ((loaded[key] || 0) < h.score) {
              loaded[key] = h.score
              localStorage.setItem(key, String(h.score))
            }
          })
        }
      } catch (e) { console.error("Failed to load history", e) }
    }
    setBestScores(loaded)
  }, [])

  const gameData = useRef({
    score: 0,
    lives: 5,
    combo: 0,
    isAuto: false,
    isCustom: false,
    customBallConfig: {} as Record<string, { enabled: boolean; score: number; rate: number }>,
    allowedBalls: [] as string[],
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
    baseGameSpeed: 1.0,
    rawInput: false,
    maxFPS: 60,
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
    shockwavesEnabled: true,
    cameraShakeEnabled: true,
    trailsEnabled: true,
    ball: { x: 250, y: -50, radius: 10, speed: 3.5, dx: 2, type: "normal" as any, sinTime: 0 },
    bombs: [] as { x: number; y: number; radius: number; speed: number }[],
    isDying: false,
    deathX: 0,
    deathY: 0,
    skin: "default",
    background: "default",
    bombImmunityTimeLeft: 0,
    aiDebug: {
      predictedX: 0,
      targetCenter: 0,
      hardZones: [] as { min: number; max: number }[],
      softZones: [] as { min: number; max: number }[],
    },
    pixiParticleSystem: null as any,
  })

  const debugFlags = useRef({ hitbox: false })
  const shockwaves = useRef<Shockwave[]>([])
  const shakeTime = useRef(0)
  const shakeIntensity = useRef(0)

  useEffect(() => {
    debugFlags.current.hitbox = debugHitboxPlay
  }, [debugHitboxPlay])

  // Save score only when Game Over
  useEffect(() => {
    if (gameState === "over") {
      // Fix: Đảm bảo dừng âm thanh bom rơi khi trạng thái chuyển sang Game Over
      stopSound("bomb_fall")

      const { score, isAuto, isCustom, gameMode, isHidden, isBlank, isReverse, isReverseControl, isMirror, isInvisible } = gameData.current

      // Update 2: Don't save anything if score is 0
      if (Math.floor(score) <= 0) {
        setIsNewBestRecord(false)
        setNewBestRank(null)
        return
      }

      let newEntry: HistoryEntry | undefined

      // Save History for Quick Play (Non-Auto, Non-Custom)
      if (!isAuto && !isCustom) {
        newEntry = {
          score: Math.floor(score),
          timestamp: Date.now(),
          difficulty: gameMode,
          gameType: "default",
          modifiers: { isHidden: !!isHidden, isBlank: !!isBlank, isReverse: !!isReverse },
          funny: { isReverseControl, isMirror, isInvisible }
        }
        
        const entryToSave = newEntry
        setRecentScores(prev => {
          const all = [entryToSave, ...prev]

          // 1. Find Top 5 to protect (not removed due to full)
          const topDefault = [...all].sort((a, b) => b.score - a.score).slice(0, 5)
          const protectedSet = new Set([...topDefault])

          // 2. Lấy 20 trận gần nhất
          const recent20 = all.slice(0, 20)

          // 3. Gộp: Gi��� lại nếu nằm trong 20 trận gần nhất HOẶC nằm trong Top 5
          const result = all.filter(x => recent20.includes(x) || protectedSet.has(x))
          result.sort((a, b) => b.timestamp - a.timestamp)

          localStorage.setItem("game_recent_history", JSON.stringify(result))
          return result
        })
      }

      if (!isAuto && !isCustom && newEntry) {
        const currentDiff = gameMode
        const currentType = "default"
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
          localStorage.setItem(scoreKey, obfuscate(String(currentScore)))
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
            return diff === currentDiff && type !== "classic"
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
          .filter(r => r.difficulty === currentDiff && r.gameType !== "classic")
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

  const changeBackground = (bg: string) => {
    playClick()
    setBackground(bg)
    gameData.current.background = bg
    localStorage.setItem("game_background", bg)
  }

  const changeMenuMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setMenuMusicVolume(v)

    const menu = audioRefs.current?.bg_menu
    // If menu BGM is currently playing, fade it to the new volume
    if (menu && currentBgmRef.current === menu && !gameData.current.isMuted && bgMenuEnabled) {
      fadeAudio(menu, v, 300)
    } else if (menu && gameState === "start" && !showIntro && !gameData.current.isMuted && bgMenuEnabled) {
      // If menu exists but isn't playing, start it from the beginning
      try { menu.pause(); menu.currentTime = 0 } catch (e) { }
      currentBgmRef.current = menu
      fadeAudio(menu, v, 300)
    }

    localStorage.setItem("game_menu_music_volume", String(v))
  }

  const changeGameMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setGameMusicVolume(v)
    
    // Update game BGM volume
    if (currentBgmRef.current && currentBgmRef.current !== audioRefs.current?.bg_menu) {
      currentBgmRef.current.volume = v
    }
    
    // Update pause BGM volume
    if (audioRefs.current?.pause_bg) {
      audioRefs.current.pause_bg.volume = v
    }

    localStorage.setItem("game_game_music_volume", String(v))
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

  const changeBaseGameSpeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setBaseGameSpeed(v)
    gameData.current.baseGameSpeed = v / 100 // Convert to multiplier (e.g., 100 -> 1.0x)
    localStorage.setItem("game_baseGameSpeed", String(v))
  }

  const toggleRawInput = () => {
    const newState = !rawInput
    setRawInput(newState)
    gameData.current.rawInput = newState
    localStorage.setItem("game_rawInput", String(newState))
  }

  const changeMaxFPS = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = parseFloat(e.target.value)
    if (v === 240) v = -1 // Treat the maximum value as Unlimited
    setMaxFPS(v)
    gameData.current.maxFPS = v // Update game logic immediately
    localStorage.setItem("game_maxFPS", String(v))
  }

  const handleClearCache = async () => {
    try {
      await swManager.clearCache()
      console.log("[v0] Cache refreshed, requesting restart...")
      // Update 3: Immediate hard refresh
      window.location.reload()
    } catch (error) {
      console.error("[v0] Cache clear error:", error)
      alert("Failed to clear cache. Please try again.")
    }
  }

  // --- Keyboard Shortcuts (PC) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle closing Quick Play or Custom Game modals with Escape
      if (e.code === "Escape") {
        if (openQuickPlay) {
          playClick()
          setOpenQuickPlay(false)
          return
        }
        if (openCustom) {
          playClick()
          setOpenCustom(false)
          setCustomError(null)
          return
        }
      }

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
  }, [gameState, openSettings, confirmExit, openQuickPlay, openCustom])

  // Tự động tạm dừng game khi người dùng chuyển tab hoặc focus ra ngoài (PC/Unfocused)
  useEffect(() => {
    const handleAutoPause = () => {
      if (gameState === "running") {
        pauseGame()
      }
    }
    const handleVisibility = () => {
      if (document.hidden) handleAutoPause()
    }
    window.addEventListener("blur", handleAutoPause)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("blur", handleAutoPause)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [gameState])

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
    if (!audioRefs.current || gameData.current.isMuted || !sfxEnabled) return
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
      audioRefs.current.pause_bg.volume = gameMusicVolume
      audioRefs.current.pause_bg.play().catch(() => { })
    }
  }

  const resumeGame = () => {
    playClick()
    // Resume Game Music
    if (currentBgmRef.current && !gameData.current.isMuted && gameMusicEnabled) {
      currentBgmRef.current.volume = gameMusicVolume
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
        currentBgmRef.current.volume = gameMusicVolume
        currentBgmRef.current.play().catch(() => { })
      } else if (gameState === "paused" && audioRefs.current?.pause_bg) {
        audioRefs.current.pause_bg.volume = gameMusicVolume
        audioRefs.current.pause_bg.play().catch(() => { })
      } else if (gameState === "start" && audioRefs.current?.bg_menu && bgMenuEnabled) {
        audioRefs.current.bg_menu.volume = menuMusicVolume
        audioRefs.current.bg_menu.play().catch(() => { })
      }
    }
  }

  useEffect(() => {
    if (gameState === "running" && currentBgmRef.current && currentBgmRef.current !== audioRefs.current?.bg_menu) {
      if (!gameMusicEnabled || isMuted) {
        currentBgmRef.current.pause()
      } else {
        currentBgmRef.current.play().catch(() => {})
      }
    }
  }, [gameMusicEnabled, isMuted, gameState])

  const toggleParticles = () => {
    const newState = !particlesEnabled
    playClick()
    setParticlesEnabled(newState)
    gameData.current.particlesEnabled = newState
    localStorage.setItem("game_particles", String(newState))
  }

  const toggleGameMusic = () => {
    const newState = !gameMusicEnabled
    playClick()
    setGameMusicEnabled(newState)
    localStorage.setItem("game_music_enabled", String(newState))
  }

  const toggleSfx = () => {
    const newState = !sfxEnabled
    if (newState) playClick()
    setSfxEnabled(newState)
    localStorage.setItem("game_sfx_enabled", String(newState))
  }

  const toggleFPS = () => {
    const newState = !showFPS
    playClick()
    setShowFPS(newState)
    localStorage.setItem("game_show_fps", String(newState))
  }

  const toggleTrails = () => {
    playClick()
    const newState = !trailsEnabled
    setTrailsEnabled(newState)
    gameData.current.trailsEnabled = newState
    localStorage.setItem("game_trails", String(newState))
  }

  const toggleShockwaves = () => {
    const newState = !shockwavesEnabled
    playClick()
    setShockwavesEnabled(newState)
    gameData.current.shockwavesEnabled = newState
    localStorage.setItem("game_shockwaves", String(newState))
  }

  const toggleCameraShake = () => {
    const newState = !cameraShakeEnabled
    playClick()
    setCameraShakeEnabled(newState)
    gameData.current.cameraShakeEnabled = newState
    localStorage.setItem("game_camera_shake", String(newState))
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

    // Thêm mảng bom nếu có
    if (result.newBombs && result.newBombs.length > 0) {
      gameData.current.bombs.push(...result.newBombs)
      playSound("bomb_fall")
    }

    // Phát âm thanh nếu cần (ví dụ: bóng cam rơi)
    if (result.soundToPlay) {
      playSound(result.soundToPlay)
    }
  }

  const startCountdown = (mode: "normal" | "hardcode" | "sudden_death", isAutoMode: boolean) => {
    // Đảm bảo dừng nhạc menu khi bắt đầu vào game
    stopMenuBgm()
    setGameMode(mode)
    setCountdown(3)
    setGameState("countdown")
    gameData.current = {
      ...gameData.current,
      baseGameSpeed: baseGameSpeed / 100,
      gameMode: mode,
      isAuto: isAutoMode,
      combo: 0,
      playerX: 210,
      targetPlayerX: 210,
      playerWidth: 80,
      targetWidth: 80,
      score: 0,
      lives: 5,
      isBoosted: false,
      boostTimeLeft: 0,
      snowTimeLeft: 0,
      isSnowSlowed: false,
      isDying: false,
      deathX: 0,
      deathY: 0,
      hasPlayedNewBest: false,
      hasShield: false,
      bombImmunityTimeLeft: 0,
    }
    setIsNewBestRecord(false)
      shockwaves.current = []
    setNewBestRank(null)
    setIsAuto(isAutoMode)
    // These are now part of the quick play modal, so we use their state directly
    // setIsReverse(isReverse)
    // setIsHidden(isHidden) 
    // setIsBlank(isBlank)

    runCountdown(isAutoMode, () => {
      gameData.current = {
        ...gameData.current,
        baseGameSpeed: baseGameSpeed / 100,
        score: 0,
        lives: (mode === "hardcode" || mode === "sudden_death") ? 1 : 5, // 1 life for Hardcode & Sudden Death
        combo: 0,
        gameMode: mode,
        isCustom: false,
        customBallConfig: {},
        allowedBalls: [],
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
        bombImmunityTimeLeft: 0,
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
      // No need to set state here, it's already managed
      // setIsHidden(isHidden)
      // setIsBlank(isBlank)
      setScore(0)
      setLives((mode === "hardcode" || mode === "sudden_death") ? 1 : 5)
      setComboCount(0)
      setGameState("running")
      setActiveTab("home")
      shockwaves.current = []
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

      if (bgm && !gameData.current.isMuted && gameMusicEnabled) {
        bgm.volume = 0
        // Register BGM for playback rate management
        audioRateManager.registerAudioElement("bgm", bgm)
        audioRateManager.reset() // Reset to 1.0x at game start
        fadeAudio(bgm, gameMusicVolume, 2000)
      } else if (bgm) {
        audioRateManager.registerAudioElement("bgm", bgm)
      }
    })
  }

  const startCustomGame = () => {
    if (customConfig.balls) {
      const enabled = Object.keys(customConfig.balls).filter(
        k => customConfig.balls[k as keyof typeof customConfig.balls].enabled
      )
      if (enabled.length === 0) {
        setCustomError("At least one ball must be enabled!")
        return
      }
    }

    // Đảm bảo dừng nhạc menu khi bắt đầu vào game tùy chỉnh
    stopMenuBgm()

    setGameMode(customConfig.difficulty)
    setOpenCustom(false)
    setCountdown(3)
    setGameState("countdown")

    const currentSpeedMultiplier = baseGameSpeed / 100;

    runCountdown(customConfig.isAuto, () => {
      // Khởi tạo toàn bộ dữ liệu khi bắt đầu chạy logic game
      gameData.current = {
        ...gameData.current,
        gameMode: customConfig.difficulty,
        baseGameSpeed: currentSpeedMultiplier,
        isAuto: customConfig.isAuto,
        isCustom: true,
        customBallConfig: customConfig.balls,
        allowedBalls: Object.keys(customConfig.balls).filter(
          (k) => customConfig.balls[k as keyof typeof customConfig.balls].enabled,
        ),
        isHidden: customConfig.isHidden,
        isBlank: customConfig.isBlank,
        isReverse: customConfig.isReverse,
        isReverseControl: customConfig.isReverseControl,
        isMirror: customConfig.isMirror,
        isInvisible: customConfig.isInvisible,
        combo: 0,
        playerX: 210,
        targetPlayerX: 210,
        playerWidth: 80,
        targetWidth: 80,
        score: 0,
        lives: customConfig.difficulty === "hardcode" || customConfig.difficulty === "sudden_death" ? 1 : 5,
        isBoosted: false,
        boostTimeLeft: 0,
        snowTimeLeft: 0,
        isSnowSlowed: false,
        isDying: false,
        deathX: 0,
        deathY: 0,
        hasPlayedNewBest: false,
        hasShield: false,
        bombImmunityTimeLeft: 0,
        ball: { x: 250, y: -50, radius: 10, speed: 1.5 * currentSpeedMultiplier, dx: 2, type: "normal", sinTime: 0 },
        bombs: [],
      }

      setIsHidden(customConfig.isHidden)
      setIsBlank(customConfig.isBlank)
      setIsReverse(customConfig.isReverse)
      setIsReverseControl(customConfig.isReverseControl)
      setIsMirror(customConfig.isMirror)
      setIsInvisible(customConfig.isInvisible)
      setScore(0)
      setLives(customConfig.difficulty === "hardcode" || customConfig.difficulty === "sudden_death" ? 1 : 5)
      setComboCount(0)
      setGameState("running")
      shockwaves.current = []
      setShowNewBest(false)
      particles.current = []
      trails.current = []
      resetBall()

      // Bắt đầu nhạc game
      const bgm = audioRefs.current?.bg_game_custom
      currentBgmRef.current = bgm
      if (bgm) {
        bgm.volume = 0
        audioRateManager.registerAudioElement("bgm", bgm)
        audioRateManager.reset() // Reset tốc độ nhạc về 1.0x
        fadeAudio(bgm, gameMusicVolume, 2000)
      }
    })
  }

  const startAutoGame = () => {
    // Ensure menu BGM stops when starting auto game
    stopMenuBgm()

    setIsNewBestRecord(false)
    setNewBestRank(null)
    gameData.current = {
      ...gameData.current,
      baseGameSpeed: baseGameSpeed / 100,
      score: 0,
      lives: (gameMode === "hardcode" || gameMode === "sudden_death") ? 1 : 5,
      combo: 0,
      gameMode: gameMode,
      isCustom: false,
      customBallConfig: {},
      allowedBalls: [],
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
    shockwaves.current = []
    setGameState("running")
  }

  useEffect(() => {
    const audioSources: any = {
      catch: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/catch.mp3",
      miss: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/miss.mp3",
      heal: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/heal.mp3",
      boost: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/boost.mp3",
      boost_end: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/boost_end.mp3",
      newbest: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/newbest.mp3",
      shield: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/shield.mp3",
      shield_breaking: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/shield_breaking.mp3",
      snow: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/snow_start.mp3",
      snow_end: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/snow_end.mp3",
      bomb: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bomb.mp3",
      critical_bomb: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/critical_bomb.mp3",
      bomb_fall: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bomb_fall_loop.mp3",
      score_count: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/score_count.mp3",
      game_over_new_best: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/game_over_new_best.mp3",
      bg_game_default: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bg_game_default.mp3",
      bg_game_hardcode: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bg_game_hardcode.mp3",
      bg_game_auto: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bg_game_auto.mp3",
      bg_game_custom: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/bg_game_custom.mp3",
      bg_menu: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/menu_bg.mp3",
      pause_bg: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/pause_music.mp3",
      count: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/count.mp3",
      go: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/go.mp3",
      kjacs: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/kjacs.mp3",
      click: "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/click2.mp3",
      combo: [
        "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c1.mp3",
        "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c2.mp3",
        "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c3.mp3",
        "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c4.mp3",
        "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c5.mp3",
        "https://an4sdmu4yskbqrq6.public.blob.vercel-storage.com/c6.mp3",
      ],
    }

    const totalAssets = Object.keys(audioSources).length - 1 + audioSources.combo.length
    let loadedAssetsCount = 0

    const onAssetLoaded = () => {
      loadedAssetsCount++
      const progress = (loadedAssetsCount / totalAssets) * 100
      setIntroLoadingProgress(progress)
    }

    const loadAudio = (src: string) => {
      const audio = new Audio(src)
      audio.preload = "auto"
      const handleLoad = () => {
        audio.removeEventListener("canplaythrough", handleLoad)
        audio.removeEventListener("error", handleLoad)
        onAssetLoaded()
      }
      audio.addEventListener("canplaythrough", handleLoad)
      audio.addEventListener("error", handleLoad)
      return audio
    }

    const loadedRefs: any = {}
    for (const [key, src] of Object.entries(audioSources)) {
      if (Array.isArray(src)) {
        loadedRefs[key] = src.map((s: string) => loadAudio(s))
      } else {
        loadedRefs[key] = loadAudio(src as string)
      }
    }

    audioRefs.current = loadedRefs

    // Loop BGMs
    if (loadedRefs.bg_game_default) loadedRefs.bg_game_default.loop = true
    if (loadedRefs.bg_game_hardcode) loadedRefs.bg_game_hardcode.loop = true
    if (loadedRefs.bg_game_auto) loadedRefs.bg_game_auto.loop = true
    if (loadedRefs.bg_game_custom) loadedRefs.bg_game_custom.loop = true
    if (loadedRefs.bg_menu) loadedRefs.bg_menu.loop = true
    if (loadedRefs.pause_bg) loadedRefs.pause_bg.loop = true
    if (loadedRefs.score_count) loadedRefs.score_count.loop = true

    const savedMute = localStorage.getItem("game_muted") === "true"
    setIsMuted(savedMute)
    gameData.current.isMuted = savedMute

    const savedMenuMusicVol = localStorage.getItem("game_menu_music_volume")
    if (savedMenuMusicVol) {
      const v = parseFloat(savedMenuMusicVol)
      setMenuMusicVolume(v)
    }

    const savedGameMusicVol = localStorage.getItem("game_game_music_volume")
    if (savedGameMusicVol) {
      const v = parseFloat(savedGameMusicVol)
      setGameMusicVolume(v)
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

    const savedGameMusicEnabled = localStorage.getItem("game_music_enabled")
    if (savedGameMusicEnabled !== null) {
      setGameMusicEnabled(savedGameMusicEnabled === "true")
    }

    const savedSfxEnabled = localStorage.getItem("game_sfx_enabled")
    if (savedSfxEnabled !== null) {
      setSfxEnabled(savedSfxEnabled === "true")
    }

    const savedSensitivity = localStorage.getItem("game_sensitivity")
    if (savedSensitivity) {
      const s = parseFloat(savedSensitivity)
      setSensitivity(s)
      gameData.current.sensitivity = s
    }

    const savedBaseGameSpeed = localStorage.getItem("game_baseGameSpeed")
    if (savedBaseGameSpeed) {
      const bgs = Math.max(100, parseFloat(savedBaseGameSpeed)) // Clamp to min 1.0x
      setBaseGameSpeed(bgs)
      gameData.current.baseGameSpeed = bgs / 100
    }

    const savedRawInput = localStorage.getItem("game_rawInput")
    if (savedRawInput !== null) {
      setRawInput(savedRawInput === "true")
      gameData.current.rawInput = savedRawInput === "true"
    }

    const savedMaxFPS = localStorage.getItem("game_maxFPS")
    if (savedMaxFPS) {
      const mfps = parseFloat(savedMaxFPS)
      setMaxFPS(mfps)
      gameData.current.maxFPS = mfps
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
    const savedShowFPS = localStorage.getItem("game_show_fps") === "true";
    setShowFPS(savedShowFPS);
    const savedAnimLevel = localStorage.getItem("game_animation_level");
    if (savedAnimLevel === "full" || savedAnimLevel === "min" || savedAnimLevel === "none") {
      setAnimationLevel(savedAnimLevel);
    }
    
    const savedFreezeEffect = localStorage.getItem("game_freeze_effect")
    if (savedFreezeEffect === "spread" || savedFreezeEffect === "simple") {
      setFreezeEffect(savedFreezeEffect)
    }

    setTrailsEnabled(savedTrails)

    const savedLang = localStorage.getItem("game_language")
    if (savedLang === "en" || savedLang === "vi" || savedLang === "es" || savedLang === "ru") {
      setLanguage(savedLang)
    } else if (typeof navigator !== "undefined" && navigator.language.startsWith("vi")) {
      setLanguage("vi")
    }

    const savedShockwaves = localStorage.getItem("game_shockwaves") !== "false"
    setShockwavesEnabled(savedShockwaves)
    gameData.current.shockwavesEnabled = savedShockwaves

    const savedCameraShake = localStorage.getItem("game_camera_shake") !== "false"
    setCameraShakeEnabled(savedCameraShake)
    gameData.current.cameraShakeEnabled = savedCameraShake

    gameData.current.trailsEnabled = savedTrails

    const savedSkin = localStorage.getItem("game_skin") || "default"
    setSkin(savedSkin)
    gameData.current.skin = savedSkin

    const savedBg = localStorage.getItem("game_background") || "default"
    setBackground(savedBg)
    gameData.current.background = savedBg

    document.title = "Catch Master - Power by V0"

    // Register Service Worker for asset caching
    if (typeof window !== "undefined") {
      swManager.register().catch((err) => {
        console.error("[v0] Service Worker registration error:", err)
      })
    }
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
      if (!gameData.current.isMuted) fadeAudio(menuBgm, menuMusicVolume, 1000)
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
      const t1 = window.setTimeout(() => {
        setIntroStep(1)
      }, 1000)
      
      return () => clearTimeout(t1)
    }
  }, [showIntro])

  // Pointer Lock for Raw Input
  useEffect(() => {
    const handleCanvasClick = () => {
      if (gameData.current.rawInput && gameState === "running" && !isMobile) {
        canvasRef.current?.requestPointerLock()
      }
    }
    const canvas = canvasRef.current
    canvas?.addEventListener("click", handleCanvasClick)
    return () => {
      canvas?.removeEventListener("click", handleCanvasClick)
      // Release lock if disabled
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock()
      }
    }
  }, [gameState, rawInput, isMobile])

  // Separate effect to handle completion of loading
  useEffect(() => {
    if (showIntro && introLoadingProgress === 100 && introStep >= 1) {
      const timer = setTimeout(() => {
        setIntroStep(2)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [showIntro, introLoadingProgress, introStep])

  // Persist custom config and quick play settings separately (so it doesn't interfere with intro timings)
  useEffect(() => {
    if (isConfigLoaded) {
      localStorage.setItem("game_custom_config", JSON.stringify(customConfig))
      localStorage.setItem("game_quickplay_config", JSON.stringify({
        gameMode,
        isAuto,
        isHidden,
        isBlank,
        isReverse,
        isReverseControl,
        isMirror,
        isInvisible,
      }))
    }
  }, [customConfig, gameMode, isAuto, isHidden, isBlank, isReverse, isConfigLoaded])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize PixiJS for enhanced particles
    initializePixiJS(canvas)

    // Initialize audio playback rate manager
    audioRateManager.reset()

    if (currentBgmRef.current) {
      audioRateManager.registerAudioElement("bgm", currentBgmRef.current)
    }
    if (audioRefs.current?.bg_menu) {
      audioRateManager.registerAudioElement("bg_menu", audioRefs.current.bg_menu)
    }
    if (audioRefs.current?.pause_bg) {
      audioRateManager.registerAudioElement("pause_bg", audioRefs.current.pause_bg)
    }

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

    // Initialize PixiJS particle system if not already done
    if (!gameData.current.pixiParticleSystem && (window as any).pixiApp) {
      gameData.current.pixiParticleSystem = new PixiParticleSystem((window as any).pixiApp)
    }

    const createParticles = (
      x: number,
      y: number,
      color: string,
      type: "explode" | "absorb" | "firework" | "shard" | "miss",
      intense: boolean,
      targetX?: number,
      targetY?: number,
    ) => {
      if (!gameData.current.particlesEnabled) return
      
      // Use PixiJS particle system if available, otherwise fall back to canvas
      if (gameData.current.pixiParticleSystem) {
        gameData.current.pixiParticleSystem.createParticles(x, y, color, type, intense, targetX, targetY)
      } else {
        // Fallback to original canvas-based particles
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
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (canvas.getAttribute("data-state") !== "running" || gameData.current.isAuto || gameData.current.isDying) return
      
      if (!("touches" in e) && gameData.current.rawInput && document.pointerLockElement === canvas) {
        // Raw Input Logic using Movement Delta
        const movementX = (e as MouseEvent).movementX
        // Sensitivity scale for raw input (default 1.0 + adjustment)
        const rawSens = 1 + (gameData.current.sensitivity * 0.1)
        gameData.current.targetPlayerX += movementX * rawSens
      } else {
        // Normal Mouse/Touch Logic
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        let mouseX = (clientX - rect.left) * scaleX
        
        if (gameData.current.isReverseControl) {
          mouseX = canvas.width - mouseX
        }
        gameData.current.targetPlayerX = mouseX - gameData.current.playerWidth / 2
      }

      if (gameData.current.sensitivity === 0 && !gameData.current.rawInput) {
        gameData.current.playerX = targetX
      }
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("touchmove", handleMove, { passive: false })

    // Universal FPS timing
    let lastFrameTime = performance.now()
    let lastLogicTime = performance.now()
    let lastStatsUpdate = 0

    const getFrameDelay = () => {
      const maxFpsValue = gameData.current.maxFPS
      if (maxFpsValue === -1) return 0 // Unlimited FPS
      return 1000 / maxFpsValue // Convert FPS to milliseconds
    }

    const update = (currentTime: number) => {
      // Frame rate limiting
      const frameDelay = getFrameDelay()
      if (frameDelay > 0 && currentTime - lastFrameTime < frameDelay) {
        requestRef.current = requestAnimationFrame(update)
        return // Skip this frame to maintain target FPS
      }

      const logicStartTime = performance.now()
      fpsRef.current = 1000 / (currentTime - lastFrameTime)
      
      const deltaTime = (currentTime - lastLogicTime) / (1000 / 60) // Normalize to 60 FPS (1.0 = 16.6ms)
      lastLogicTime = currentTime
      lastFrameTime = currentTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // --- CAMERA SHAKE UPDATE ---
      let shakeX = 0, shakeY = 0
      if (shakeTime.current > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity.current
        shakeY = (Math.random() - 0.5) * shakeIntensity.current
        shakeTime.current -= deltaTime
      }
      ctx.save()
      ctx.translate(shakeX, shakeY)

      // --- RENDER CUSTOM BACKGROUND ---
      const curBg = gameData.current.background || "default"
      if (curBg === "grid") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)"
        ctx.lineWidth = 1
        for (let i = 0; i < canvas.width; i += 40) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke()
        }
        for (let i = 0; i < canvas.height; i += 40) {
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke()
        }
      } else if (curBg === "dots") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)"
        for (let x = 20; x < canvas.width; x += 40) {
          for (let y = 20; y < canvas.height; y += 40) {
            ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill()
          }
        }
      } else if (curBg === "scanlines") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.025)"
        for (let i = 0; i < canvas.height; i += 4) {
          ctx.fillRect(0, i, canvas.width, 1)
        }
      } else if (curBg === "hexagons") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
        ctx.lineWidth = 1
        const r = 25
        const h = r * Math.sin(Math.PI / 3)
        for (let y = 0; y < canvas.height + r; y += h * 2) {
          for (let x = 0; x < canvas.width + r; x += r * 3) {
            // Vẽ lục giác 1
            ctx.beginPath()
            for (let k = 0; k < 6; k++) {
              ctx.lineTo(x + r * Math.cos(k * Math.PI / 3), y + r * Math.sin(k * Math.PI / 3))
            }
            ctx.closePath(); ctx.stroke()
            // Vẽ lục giác 2 (offset)
            const x2 = x + r * 1.5, y2 = y + h
            ctx.beginPath()
            for (let k = 0; k < 6; k++) {
              ctx.lineTo(x2 + r * Math.cos(k * Math.PI / 3), y2 + r * Math.sin(k * Math.PI / 3))
            }
            ctx.closePath(); ctx.stroke()
          }
        }
      } else if (curBg === "vignette") {
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width * 0.2, canvas.width/2, canvas.height/2, canvas.width * 0.9)
        grad.addColorStop(0, "transparent")
        grad.addColorStop(1, "rgba(2, 6, 23, 0.7)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (curBg === "dynamic_stars") {
        const time = currentTime * 0.0005
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
        for (let i = 0; i < 40; i++) {
          const sx = ((Math.abs(Math.sin(i * 999.9)) * 1000) % 1) * canvas.width
          const speed = 10 + (i % 15)
          const sy = (((Math.abs(Math.cos(i * 555.5)) * 1000) % 1) * canvas.height + currentTime * speed * 0.01) % canvas.height
          ctx.beginPath(); ctx.arc(sx, sy, i % 3 === 0 ? 1.5 : 0.8, 0, Math.PI * 2); ctx.fill()
        }
      } else if (curBg === "dynamic_waves") {
        const time = currentTime * 0.001
        ctx.strokeStyle = "rgba(59, 130, 246, 0.08)"
        ctx.lineWidth = 3
        for (let j = 0; j < 4; j++) {
          ctx.beginPath()
          for (let i = 0; i < canvas.width; i += 10) {
            const waveY = (canvas.height / 2) + Math.sin(i * 0.005 + time + j) * 80 + (j * 40 - 80)
            if (i === 0) ctx.moveTo(i, waveY); else ctx.lineTo(i, waveY)
          }
          ctx.stroke()
        }
      } else if (curBg === "dynamic_rain") {
        ctx.strokeStyle = "rgba(34, 197, 94, 0.12)"
        ctx.lineWidth = 1
        for (let i = 0; i < 25; i++) {
          const x = ((Math.abs(Math.sin(i * 123.4)) * 1000) % 1) * canvas.width
          const speed = 25 + (i % 20) * 4
          const y = (currentTime * speed * 0.01) % (canvas.height + 100) - 50
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 50); ctx.stroke()
        }
      } else if (curBg === "dynamic_bubbles") {
        const time = currentTime * 0.001
        ctx.fillStyle = "rgba(59, 130, 246, 0.04)"
        for (let i = 0; i < 15; i++) {
          const x = ((Math.abs(Math.sin(i * 456.7)) * 1000) % 1) * canvas.width + Math.sin(time + i) * 25
          const speed = 5 + (i % 6)
          const y = canvas.height - ((currentTime * speed * 0.01) % (canvas.height + 120)) + 60
          const radius = 8 + (i % 18)
          ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill()
        }
      } else if (curBg === "dynamic_fireflies") {
        const time = currentTime * 0.001
        for (let i = 0; i < 12; i++) {
          const x = ((Math.abs(Math.sin(i * 321.0)) * 1000) % 1) * canvas.width + Math.cos(time * 0.4 + i) * 50
          const y = ((Math.abs(Math.cos(i * 654.3)) * 1000) % 1) * canvas.height + Math.sin(time * 0.6 + i) * 50
          const alpha = 0.05 + (0.5 + 0.5 * Math.sin(time + i)) * 0.15
          ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill()
        }
      }
      // NEW: Dynamic Aurora Glow for Menu Background
      else if (curBg === "dynamic_aurora") {
        const time = currentTime * 0.00005; // Very slow movement
        const colors = [
            "rgba(59, 130, 246, 0.08)", // blue
            "rgba(168, 85, 247, 0.08)", // purple
            "rgba(251, 191, 36, 0.08)", // yellow
            "rgba(239, 68, 68, 0.08)"   // red
        ];

        for (let i = 0; i < 4; i++) {
            const x = canvas.width / 2 + Math.sin(time * (i + 1) * 0.7) * (canvas.width * 0.3) + Math.cos(time * (i + 1) * 0.3) * (canvas.width * 0.2);
            const y = canvas.height / 2 + Math.cos(time * (i + 1) * 0.5) * (canvas.height * 0.3) + Math.sin(time * (i + 1) * 0.2) * (canvas.height * 0.2);
            const radius = canvas.width * (0.4 + 0.1 * Math.sin(time * (i + 1) * 0.9));

            ctx.save();
            ctx.filter = 'blur(30px)'; // Apply blur for glow effect
            const grad = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
            grad.addColorStop(0, colors[i]);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
      }

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

      const triggerCameraShake = (intensity: number, duration: number) => {
        if (!gameData.current.cameraShakeEnabled) return
        shakeIntensity.current = intensity
        shakeTime.current = duration
      }

      // --- PADDLE RENDERING HELPER ---
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

      const createShockwave = (x: number, y: number, color: string, width?: number, height?: number, borderRadius?: number) => {
        if (!gameData.current.shockwavesEnabled) return
        shockwaves.current.push({ x, y, w: width || gameData.current.playerWidth, h: height || 15, radius: 0, alpha: 0.6, color, borderRadius: borderRadius || 8 })
        
        // Nếu đang có combo, tạo thêm một vòng sóng thứ 2 lệch pha
        if (gameData.current.combo > 0 && !width) { // Chỉ tạo vòng thứ 2 cho shockwave paddle
          shockwaves.current.push({ x, y, w: gameData.current.playerWidth, h: 15, radius: -15, alpha: 0.35, color, borderRadius: borderRadius || 8 })
        }
      }

      // Helper for Bomb Hit
      const handleBombHit = (bx: number, by: number) => {
        // Check for immunity first
        if (gameData.current.bombImmunityTimeLeft > 0) return;

        // --- FIX: Shield Interaction ---
        if (gameData.current.hasShield) {
          gameData.current.hasShield = false
          createShockwave(0, isReverse ? 0 : canvas.height - 12, "#94a3b8", canvas.width, 12, 8) // Sóng xung kích khi khiên vỡ
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
          triggerCameraShake(15, 40)

          // OSU death music transition: slow down to 0.09x and fade out over 1.8s
          if (currentBgmRef.current) {
            audioRateManager.animatePlaybackRate(0.09, 1800)
            fadeAudio(currentBgmRef.current, 0, 1800)
          }

          // 5️⃣ Delay chỉ dành cho hình ảnh + game over
          setTimeout(() => {
            setIsFlashWhite(true)
            setTimeout(() => setIsFlashWhite(false), 800)
            setGameState("over")
            clearSnow()
          }, 1250)

        } else {
          // Normal mode
          playSound("bomb")
          gameData.current.lives = Math.max(0, gameData.current.lives - 1)
          setLives(gameData.current.lives)

          setIsFlashWhite(true)
          triggerCameraShake(10, 20)
          setTimeout(() => setIsFlashWhite(false), 150)

          createParticles(bx, by, "#f97316", "explode", true)

          // Grant 2 seconds of immunity in Normal Mode after being hit
          gameData.current.bombImmunityTimeLeft = 120; // 120 logic units = 2 seconds at 60fps

          if (gameData.current.lives <= 0) {
            // OSU death music transition
            if (currentBgmRef.current) {
              audioRateManager.animatePlaybackRate(0.09, 1800)
              fadeAudio(currentBgmRef.current, 0, 1800)
            }

            setGameState("over")
            clearSnow()
            stopSound("bomb_fall")
          }
        }

        gameData.current.combo = 0
        setComboCount(0)
      }

      const b = gameData.current.ball

      const widthDiff = gameData.current.targetWidth - gameData.current.playerWidth
      gameData.current.playerWidth += widthDiff * 0.1 * deltaTime

      // --- Bot / Prediction Logic ---
      const isAuto = gameData.current.isAuto
      const isDebug = debugFlags.current.hitbox

      if (canvas.getAttribute("data-state") === "running") {
        runAutoplayLogic(
          gameData.current,
          canvas.width,
          logicPaddleY,
          deltaTime,
          debugFlags.current.hitbox
        )
        
        // Thử nghiệm va chạm bóng rơi với nhau
        resolveBallCollisions(gameData.current, canvas.width, isReverse, () => {
          if (!gameData.current.isMuted) playClinkSfx(gameData.current.sfxVolume);
        });
      }

      // --- Manual Movement Smoothing ---
      if (!gameData.current.isAuto && canvas.getAttribute("data-state") === "running" && !gameData.current.isDying) {
        if (gameData.current.sensitivity > 0) {
          const factor = 1 / (gameData.current.sensitivity * 0.5 + 1)
          gameData.current.playerX += (gameData.current.targetPlayerX - gameData.current.playerX) * factor * deltaTime
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
        const smoothFactor = 0.1

        // Handle bomb immunity countdown
        if (gameData.current.bombImmunityTimeLeft > 0) {
          gameData.current.bombImmunityTimeLeft -= deltaTime;
        }

        gameData.current.timeScale +=
          (gameData.current.targetTimeScale - gameData.current.timeScale) * smoothFactor * deltaTime
        const prevBallY = b.y;
        const ts = gameData.current.timeScale || 1
        
        // Apply movement scaled by deltaTime
        b.y += b.speed * ts * gravityDirection * deltaTime
        
        if (b.type === "yellow") {
          b.sinTime += 0.15 * deltaTime
          const dynamicAmplitude = b.speed * 3 
          b.x += (b.dx * ts + Math.sin(b.sinTime) * dynamicAmplitude * ts) * deltaTime
        } else {
          b.x += b.dx * ts * deltaTime
        }

        if (b.x - b.radius < 0) {
          b.x = b.radius
          b.dx = Math.abs(b.dx) + 0.8
          // Mirror sine wave phase on bounce to ensure it moves away from left wall
          if (b.type === "yellow" && Math.sin(b.sinTime) < 0) {
            b.sinTime = -b.sinTime
          }
        } else if (b.x + b.radius > canvas.width) {
          b.x = canvas.width - b.radius
          b.dx = -Math.abs(b.dx) - 0.8
          // Mirror sine wave phase on bounce to ensure it moves away from right wall
          if (b.type === "yellow" && Math.sin(b.sinTime) > 0) {
            b.sinTime = -b.sinTime
          }
        }

        // Trail generation - logic simplified to work better with variable FPS
        // At high FPS we push more points, but we'll cap the history
        if (gameData.current.trailsEnabled) {
          trails.current.push({ x: b.x, y: b.y, alpha: 0.5 })
          if (trails.current.length > 8) trails.current.shift()
        } else trails.current = []

        // --- Update Bombs ---
        for (let i = gameData.current.bombs.length - 1; i >= 0; i--) {
          const bomb = gameData.current.bombs[i]
          bomb.y += bomb.speed * ts * gravityDirection * deltaTime

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
          if ((!isReverse && bomb.y > 700) || (isReverse && bomb.y < 0)) {
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
            vx: (Math.random() - 0.5) * 0.4 * deltaTime,
            vy: (Math.random() * 0.8 + 0.3) * deltaTime,
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
              setSnowContactPoint({ x: (b.x / 500) * 100, y: (b.y / 700) * 100 })
              setSnowActive(true)
              playSound("snow")
              createParticles(b.x, b.y, "#ffffff", "explode", true)

              // Calculate current base music rate based on score
              const currentScoreInt = Math.floor(gameData.current.score)
              const currentBaseRate = Math.min(currentScoreInt < 200 
                ? 1.0 + Math.floor(currentScoreInt / 40) * 0.01 
                : 1.05 + Math.floor((currentScoreInt - 200) / 50) * 0.01, 2.5)

              // Smoothly transition music speed to half of current rate over 1 second
              audioRateManager.animatePlaybackRate(currentBaseRate / 2, 1000)
              
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

                  // Smoothly transition music speed back to current score-based rate
                  const currentScoreInt = Math.floor(gameData.current.score)
                  const musicRate = Math.min(currentScoreInt < 200 
                    ? 1.0 + Math.floor(currentScoreInt / 40) * 0.01 
                    : 1.05 + Math.floor((currentScoreInt - 200) / 50) * 0.01, 2.5)
                  audioRateManager.animatePlaybackRate(musicRate, 1000)
                  
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
          } else {
            createParticles(b.x, b.y, ballColors[b.type], "explode", isCenter)
            // Hiệu ứng Shockwave theo màu skin hiện tại
            createShockwave(gameData.current.playerX, visualPaddleY, typeof paddleColor === 'string' ? paddleColor : "#3b82f6")
          }

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
          const currentType = "default";
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
          
          // Update music playback rate based on score increments:
          // +0.01 per 40 points up to 200, then +0.01 per 50 points
          const musicRate = Math.min(currentScoreInt < 200 
            ? 1.0 + Math.floor(currentScoreInt / 40) * 0.01 
            : 1.05 + Math.floor((currentScoreInt - 200) / 50) * 0.01, 2.5)

          // Chỉ cập nhật tốc độ nhạc theo điểm số nếu KHÔNG trong trạng thái đóng băng (Snow Slowed)
          if (!gameData.current.isSnowSlowed) {
            audioRateManager.updatePlaybackRate(musicRate)
          }
          
          resetBall()
        }

        if ((!isReverse && b.y > canvas.height) || (isReverse && b.y < -b.radius)) {
          if (b.type === "orange") {
            resetBall()
            if (gameData.current.bombs.length === 0) stopSound("bomb_fall")
          } else if (gameData.current.gameMode === "sudden_death") {
            // --- SUDDEN DEATH LOGIC ---
            // Miss ANY ball (except bomb) = Instant Death
            // FIX: Shield Interaction
            if (isSuddenDeathMiss(b.type)) {
              gameData.current.lives = 0
              setLives(0)
              playSound("miss")
              setIsFlashRed(true)
              setTimeout(() => setIsFlashRed(false), 150)
              createParticles(b.x, isReverse ? 6 : canvas.height - 6, "#ef4444", "miss", true)

              // OSU death music transition
              if (currentBgmRef.current) {
                audioRateManager.animatePlaybackRate(0.09, 1800)
                fadeAudio(currentBgmRef.current, 0, 1800)
              }

              setGameState("over")
              clearSnow()
              stopSound("bomb_fall")

              resetBall()
            } else {
              // Should not happen if isSuddenDeathMiss covers all non-orange, but safe fallback
              resetBall()
            }
          } else if (["normal", "purple", "yellow"].includes(b.type)) {
            if (gameData.current.hasShield) {
              gameData.current.hasShield = false
              createShockwave(0, isReverse ? 0 : canvas.height - 12, "#94a3b8", canvas.width, 12, 8) // Sóng xung kích khi khiên vỡ
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
                // OSU death music transition
                if (currentBgmRef.current) {
                  audioRateManager.animatePlaybackRate(0.09, 1800)
                  fadeAudio(currentBgmRef.current, 0, 1800)
                }

                setGameState("over")
                // Ensure snow effect cleaned up on game over
                clearSnow()
                stopSound("bomb_fall")
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

      if (gameData.current.particlesEnabled) {
        particles.current.forEach((p, i) => {
          if (p.type === "absorb") {
            const tX = gameData.current.playerX + gameData.current.playerWidth / 2
            p.x += (tX - p.x) * 0.15 * deltaTime
            p.y += (visualPaddleY - p.y) * 0.15 * deltaTime
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

      // Render Shockwaves
      shockwaves.current.forEach((sw, i) => {
        sw.radius += 4 * deltaTime
        sw.alpha -= 0.02 * deltaTime
        if (sw.alpha <= 0) shockwaves.current.splice(i, 1)
        else {
        const rw = sw.w + sw.radius * 2
        const rh = sw.h + sw.radius * 2
        const rr = 8 + sw.radius

        // Chỉ vẽ khi kích thước và bán kính góc không âm, sử dụng borderRadius từ shockwave object
        if (rw > 0 && rh > 0 && rr >= 0) {
          ctx.save()
          ctx.globalAlpha = sw.alpha
          ctx.strokeStyle = sw.color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.roundRect(sw.x - sw.radius, sw.y - sw.radius, rw, rh, sw.borderRadius || rr)
          ctx.stroke()
          ctx.restore()
        }
        }
      })

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
      // Boost Effect Override (Flashing white when ending)
      if (gameData.current.isBoosted) {
        if (gameData.current.boostTimeLeft <= 2 && Math.floor(Date.now() / 100) % 2 === 0) {
          paddleColor = "#ffffff"
        }
      }

      // Immunity Visual Effect (Golden border and flashing shadow)
      const isImmune = gameData.current.bombImmunityTimeLeft > 0;

      if (!gameData.current.isInvisible) {
      ctx.save()
      
      if (isImmune) {
        const flash = Math.floor(currentTime / 100) % 2 === 0;
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = flash ? 25 : 8;
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
      } else if (shadowBlur > 0) {
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

      if (isImmune) {
        ctx.stroke();
      }

      ctx.restore()
      }

      // --- HIDDEN & BLANK LOGIC ---
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

        // AI Prediction Visualization
        const ad = gameData.current.aiDebug
        if (ad) {
          // 1. Hard Zones (Danger)
          ctx.globalAlpha = 0.2
          ctx.fillStyle = "#ef4444"
          ad.hardZones.forEach((z) => ctx.fillRect(z.min, logicPaddleY - 10, z.max - z.min, 35))

          // 2. Soft Zones (Caution)
          ctx.fillStyle = "#f59e0b"
          ad.softZones.forEach((z) => ctx.fillRect(z.min, logicPaddleY - 5, z.max - z.min, 25))

          // 3. Predicted Landing
          ctx.globalAlpha = 0.8
          ctx.strokeStyle = "#ffffff"
          ctx.setLineDash([4, 4])
          ctx.beginPath(); ctx.moveTo(ad.predictedX, logicPaddleY - 100); ctx.lineTo(ad.predictedX, logicPaddleY + 20); ctx.stroke()
          ctx.setLineDash([])

          // 4. Target Point
          ctx.strokeStyle = "#a855f7"
          ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(ad.targetCenter, logicPaddleY + 7.5, 6, 0, Math.PI * 2); ctx.stroke()
        }

        ctx.globalAlpha = 1
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

      // --- PERFORMANCE OVERLAY ---
      logicTimeRef.current = performance.now() - logicStartTime

      if (currentTime - lastStatsUpdate > 500) {
        setFpsDisplay(Math.round(fpsRef.current))
        setLogicDisplay(logicTimeRef.current)
        setGameSpeedDisplay(gameData.current.timeScale)
        if (currentBgmRef.current) {
          setMusicSpeedDisplay(currentBgmRef.current.playbackRate)
        }
        lastStatsUpdate = currentTime
      }

      ctx.restore() // Phục hồi từ Camera Shake translate
      requestRef.current = requestAnimationFrame(update)
    }

    requestRef.current = requestAnimationFrame(update)
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
      cleanupPixiJS()
      audioRateManager.reset()
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
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center overflow-hidden touch-none font-sans select-none">
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
        setLives={setLives}
        setScore={setScore}
        gameData={gameData}
        currentBgmRef={currentBgmRef}
        maxFPS={maxFPS}
        fadeAudio={fadeAudio} // Pass fadeAudio function
        setMaxFPS={setMaxFPS}
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
      <div className={`relative w-full h-full transition-all duration-300 ${isFlashRed ? "bg-red-950/10" : "bg-slate-900"} flex items-center justify-center`}>
        
        {/* GAME AREA BOUNDARY (Logic 500x700) */}
        <div className="relative w-full max-w-[500px] h-full flex flex-col items-center justify-center border-x border-white/5 bg-slate-900/40 shadow-[0_0_100px_rgba(0,0,0,0.5)] z-10">
          <canvas
            ref={canvasRef}
            data-state={gameState}
            width="500"
            height="700"
            className="block cursor-none max-w-full max-h-full w-auto h-auto"
            style={{ aspectRatio: "500/700" }}
          />

          {/* Snow Overlay - Đã chuyển vào trong boundary để căn chỉnh tọa độ chính xác */}
          <AnimatePresence>
            {snowActive && freezeEffect !== "none" && (
              <motion.div
                initial={freezeEffect === "spread" ? { 
                  clipPath: `circle(0% at ${snowContactPoint.x}% ${snowContactPoint.y}%)`,
                  opacity: 0 
                } : {
                  opacity: 0
                }}
                animate={freezeEffect === "spread" ? { 
                  clipPath: `circle(150% at ${snowContactPoint.x}% ${snowContactPoint.y}%)`,
                  opacity: 1 
                } : {
                  opacity: 1
                }}
                exit={{ opacity: 0 }}
                transition={animationLevel !== 'none' ? { duration: 0.8, ease: "easeOut" } : { duration: 0 }}
                className="absolute inset-0 z-[15] pointer-events-none overflow-hidden"
              >
                <motion.div
                  initial={{ scale: 1 }}
                  animate={animationLevel !== 'none' ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  transition={animationLevel !== 'none' ? { duration: 3, repeat: Infinity } : { duration: 0 }}
                  className="absolute inset-0"
                  style={{
                    backgroundColor: 'rgba(219, 234, 254, 0.2)',
                    boxShadow: 'inset 0 0 120px rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(1px)'
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

        {(gameState === "running" || gameState === "paused") && (() => {
          const currentModeName = t[`diff${gameMode.charAt(0).toUpperCase() + gameMode.slice(1).replace(/_([a-z])/g, (m, c) => c.toUpperCase())}` as keyof typeof t] || gameMode;
          const activeEffects = [
            isHidden && t.miscHidden,
            isBlank && t.miscBlank,
            isReverse && t.miscReverse,
            isAuto && t.auto,
            snowActive && `${t.freeze}: ${snowLeft}s`,
            gameData.current.isBoosted && t.ballBooster
          ].filter(Boolean).join(" • ");

          return (
            <div className={`absolute left-4 right-4 z-20 flex flex-col gap-2 ${isReverse ? "bottom-6" : "top-6"}`}>
              {/* TOP HUD BAR (Based on update.png) */}
              <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex items-stretch gap-1.5 shadow-2xl">
                {/* SECTION: SCORE */}
                <div className="flex-1 bg-slate-800/40 rounded-xl border border-white/5 p-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">{t.score}</span>
                  <span className="text-xl font-black text-yellow-400 italic tabular-nums leading-none drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">{score}</span>
                </div>

                {/* SECTION: LIVES & MODE */}
                <div className="flex-[1.8] bg-slate-800/40 rounded-xl border border-white/5 p-2 flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">{t.life}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter italic">{currentModeName}</span>
                    <div className="flex gap-1">
                      {(gameMode === "hardcode" || gameMode === "sudden_death") ? (
                        <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                      ) : (
                        [...Array(5)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full border border-white/10 transition-colors ${i < lives ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "bg-slate-700/50"}`} />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION: PAUSE ICON */}
                <button
                  onClick={() => { playClick(); pauseGame(); }}
                  className="w-14 bg-slate-800/60 hover:bg-slate-700/80 rounded-xl border border-white/10 flex items-center justify-center transition-all active:scale-90 group"
                >
                  <Pause size={18} className="text-white/80 group-hover:text-white transition-colors fill-white/20 group-hover:fill-white/40" />
                </button>
              </div>

              {/* BOTTOM HUD BAR (Effects & Mode) */}
              <div className="bg-blue-600/15 backdrop-blur-md border border-blue-500/30 rounded-xl px-4 py-1.5 flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest italic flex items-center gap-2">
                  <Zap size={10} className="fill-blue-400 text-blue-400" />
                  {activeEffects || "SYSTEM OPERATIONAL"}
                  <Zap size={10} className="fill-blue-400 text-blue-400" />
                </span>
              </div>

              {/* PERFORMANCE OVERLAY (Small & Floating) */}
              {(showFPS || debugHitboxPlay) && (
                <div className="absolute top-full mt-2 left-0 flex flex-col gap-0.5 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/5">
                  <span className="text-[9px] font-bold text-emerald-500 leading-none">FPS: {fpsDisplay}</span>
                  {debugHitboxPlay && (
                    <>
                      <span className="text-[9px] font-bold text-yellow-500 leading-none uppercase">Logic: {logicDisplay.toFixed(2)}ms</span>
                      <span className="text-[9px] font-bold text-cyan-400 leading-none uppercase">G-Speed: {gameSpeedDisplay.toFixed(2)}x</span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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
        </div>
        {/* END GAME AREA BOUNDARY */}

        {/* MÀN HÌNH TẠM DỪNG CẢI TIẾN */}
        <AnimatePresence>
          {gameState === "paused" && (
          <PauseModal
            t={t}
              animationLevel={animationLevel}
            isMobile={isMobile}
            score={score}
            confirmExit={confirmExit}
            maxFPS={maxFPS}
            setMaxFPS={changeMaxFPS}
            toggleAutoMode={toggleAutoMode}
            playClick={playClick}
            setOpenSettings={setOpenSettings}
            setOpenSettingsFromPause={setOpenSettingsFromPause}
            resumeGame={resumeGame}
            handleExitRequest={handleExitRequest}
            openSettings={openSettings} // Pass openSettings state
          />
          )}
        </AnimatePresence>

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
            <div className="max-w-md w-full text-center flex flex-col items-center justify-center relative">
              {/* Loading bar */}
              {introStep < 2 && (
                <div className="absolute top-8 left-0 right-0 px-8">
                  <div className="bg-slate-800/50 h-1 rounded-full overflow-hidden border border-slate-700/50">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${introLoadingProgress}%` }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 shadow-lg shadow-blue-500/50"
                    />
                  </div>
                  <div className="mt-3 text-xs text-slate-400 font-mono">
                    {Math.round(introLoadingProgress)}%
                  </div>
                </div>
              )}

              <div className="h-80 flex flex-col items-center justify-center relative">
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
                        fadeAudio(menu, menuMusicVolume, 1000)
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
                  gameMode={gameData.current.gameMode}
                  isAuto={gameData.current.isAuto}
                  direction={direction}
                  tabVariants={tabVariants}
                  menuItemVariants={menuItemVariants}
                  animationLevel={animationLevel}
                  playClick={playClick}
                  isNewBest={isNewBestRecord}
                  newBestRank={newBestRank}
                  playSound={playSound}
                  stopSound={stopSound}
                  onRestart={() => {
                    playClick();
                    if (gameData.current.isCustom) {
                      startCustomGame();
                    } else {
                      startCountdown(gameMode, isAuto);
                    }
                  }}
                  onChangeMode={() => {
                    playClick();
                    const wasCustom = gameData.current.isCustom;
                    setGameState("start");
                    setActiveTab("home");
                    setDirection(-1);
                    setSnowActive(false);
                    setSnowLeft(0);
                    // Tự động mở lại Modal chọn mode tương ứng
                    if (wasCustom) setOpenCustom(true);
                    else setOpenQuickPlay(true);
                  }}
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
                    <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/5">
                      <button
                        onClick={() => { playClick(); setSkinTab("skins"); }}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          skinTab === "skins" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {t.skins}
                      </button>
                      <button
                        onClick={() => { playClick(); setSkinTab("backgrounds"); }}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          skinTab === "backgrounds" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {t.backgrounds}
                      </button>
                    </div>

                    {skinTab === "skins" ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
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
                    ) : (
                      <div className="space-y-6 pb-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                          <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-blue-200 leading-relaxed italic">{t.perfWarning}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { id: "default", name: t.bgSolid || "Solid Void", type: t.static, icon: "⬛" },
                            { id: "grid", name: t.bgGrid || "Blueprint", type: t.static, icon: "🌐" },
                            { id: "dots", name: t.bgDots || "Polka", type: t.static, icon: "░" },
                            { id: "scanlines", name: t.bgScanlines || "Retro CRT", type: t.static, icon: "📺" },
                            { id: "hexagons", name: t.bgHexagons || "Honeycomb", type: t.static, icon: "🐝" },
                            { id: "vignette", name: t.bgVignette || "Cinematic", type: t.static, icon: "🎬" },
                            { id: "dynamic_stars", name: t.bgStars || "Stardust", type: t.dynamic, icon: "✨" },
                            { id: "dynamic_waves", name: t.bgWaves || "Cyber Flow", type: t.dynamic, icon: "🌊" },
                            { id: "dynamic_rain", name: t.bgRain || "Digital Rain", type: t.dynamic, icon: "🌧️" },
                            { id: "dynamic_bubbles", name: t.bgBubbles || "Aura Rising", type: t.dynamic, icon: "🫧" },
                            { id: "dynamic_fireflies", name: t.bgFireflies || "Night Glow", type: t.dynamic, icon: "💡" },
                          ].map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => changeBackground(bg.id)}
                              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${background === bg.id
                                ? "bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/20"
                                : "bg-slate-900/50 border-white/5 hover:bg-slate-800 hover:border-white/10"
                                }`}
                            >
                              <span className="text-2xl mb-1">{bg.icon}</span>
                              <span className={`text-[10px] font-black uppercase tracking-wider ${background === bg.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                                {bg.name}
                              </span>
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{bg.type}</span>
                              {background === bg.id && (
                                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                    showFPS={showFPS}
                    toggleFPS={toggleFPS}
                    particlesEnabled={particlesEnabled}
                    toggleParticles={toggleParticles}
                    shockwavesEnabled={shockwavesEnabled}
                    toggleShockwaves={toggleShockwaves}
                    cameraShakeEnabled={cameraShakeEnabled}
                    toggleCameraShake={toggleCameraShake}
                    trailsEnabled={trailsEnabled}
                    toggleTrails={toggleTrails}
                    animationLevel={animationLevel}
                    setAnimationLevel={changeAnimationLevel}
                    playClick={playClick}
                    onClose={() => {
                      setDirection(-1)
                      setActiveTab("home")
                    }}
                    freezeEffect={freezeEffect as any}
                    setFreezeEffect={(effect: any) => {
                      playClick();
                      setFreezeEffect(effect);
                      localStorage.setItem("game_freeze_effect", effect);
                    }}
                    bgMenuEnabled={bgMenuEnabled}
                    toggleBgMenu={toggleBgMenu}
                    gameMusicEnabled={gameMusicEnabled}
                    toggleGameMusic={toggleGameMusic}
                    sfxEnabled={sfxEnabled}
                    toggleSfx={toggleSfx}
                    menuMusicVolume={menuMusicVolume}
                    setMenuMusicVolume={changeMenuMusicVolume}
                    gameMusicVolume={gameMusicVolume}
                    setGameMusicVolume={changeGameMusicVolume}
                    sfxVolume={sfxVolume}
                    setSfxVolume={changeSfxVolume}
                    sensitivity={sensitivity}
                    setSensitivity={changeSensitivity}
                    baseGameSpeed={baseGameSpeed}
                    setBaseGameSpeed={changeBaseGameSpeed}
                    rawInput={rawInput}
                    toggleRawInput={toggleRawInput}
                    maxFPS={maxFPS}
                    setMaxFPS={changeMaxFPS}
                    clearCache={handleClearCache}
                    gameState={gameState}
                    openSettingsFromPause={openSettingsFromPause}
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

      <AnimatePresence>
        {openQuickPlay && (
          <QuickPlayModal
            t={t}
            onClose={() => setOpenQuickPlay(false)}
            onPlay={(mode, isAuto) => {
              setOpenQuickPlay(false)
              startCountdown(mode, isAuto)
            }}
            playClick={playClick}
            animationLevel={animationLevel}
            gameMode={gameMode}
            setGameMode={setGameMode}
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
            showFPS={showFPS}
            toggleFPS={toggleFPS}
            particlesEnabled={particlesEnabled}
            toggleParticles={toggleParticles}
            shockwavesEnabled={shockwavesEnabled}
            toggleShockwaves={toggleShockwaves}
            cameraShakeEnabled={cameraShakeEnabled}
            toggleCameraShake={toggleCameraShake}
            trailsEnabled={trailsEnabled}
            toggleTrails={toggleTrails}
            animationLevel={animationLevel}
            setAnimationLevel={changeAnimationLevel}
            playClick={playClick}
            onClose={() => {
              setOpenSettings(false)
              setOpenSettingsFromPause(false)
            }}
            freezeEffect={freezeEffect as any}
            setFreezeEffect={(effect: any) => {
              playClick();
              setFreezeEffect(effect);
              localStorage.setItem("game_freeze_effect", effect);
            }}
            bgMenuEnabled={bgMenuEnabled}
            toggleBgMenu={toggleBgMenu}
            gameMusicEnabled={gameMusicEnabled}
            toggleGameMusic={toggleGameMusic}
            sfxEnabled={sfxEnabled}
            toggleSfx={toggleSfx}
            menuMusicVolume={menuMusicVolume}
            setMenuMusicVolume={changeMenuMusicVolume}
            gameMusicVolume={gameMusicVolume}
            setGameMusicVolume={changeGameMusicVolume}
            sfxVolume={sfxVolume}
            setSfxVolume={changeSfxVolume}
            sensitivity={sensitivity}
            setSensitivity={changeSensitivity}
            baseGameSpeed={baseGameSpeed}
            setBaseGameSpeed={changeBaseGameSpeed}
            rawInput={rawInput}
            toggleRawInput={toggleRawInput}
            maxFPS={maxFPS}
            setMaxFPS={changeMaxFPS}
            clearCache={handleClearCache}
            gameState={gameState}
            openSettingsFromPause={openSettingsFromPause}
            hideSystem={true}
          />
        )}
      </AnimatePresence>
        <OfflineGame />

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
