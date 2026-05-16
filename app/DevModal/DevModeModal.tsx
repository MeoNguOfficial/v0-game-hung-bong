"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bug, X, Lock, Activity, Music, Zap, Layers, Skull } from "lucide-react"
import { audioRateManager } from "../../lib/audioPlaybackRateManager"

interface DevModeModalProps {
  devMode: boolean
  setDevMode: (value: boolean) => void
  showDevToast: boolean
  setShowDevToast: (value: boolean) => void
  showDevMenu: boolean
  setShowDevMenu: React.Dispatch<React.SetStateAction<boolean>>
  debugHitboxPlay: boolean
  setDebugHitboxPlay: (value: boolean) => void
  debugUI: boolean
  setDebugUI: (value: boolean) => void
  gameState: string
  setGameState: (value: any) => void
  score: number
  setLives: (value: number) => void
  setScore: (value: number) => void
  gameData: React.MutableRefObject<any>
  currentBgmRef: React.MutableRefObject<HTMLAudioElement | null>
  maxFPS: number
  fadeAudio: (audio: HTMLAudioElement, targetVol: number, duration?: number, onComplete?: () => void) => void
  setMaxFPS: (value: number) => void
}

export default function DevModeModal({
  devMode,
  setDevMode,
  showDevToast,
  setShowDevToast,
  showDevMenu,
  setShowDevMenu,
  debugHitboxPlay,
  setDebugHitboxPlay,
  debugUI,
  setDebugUI,
  gameState,
  setGameState,
  score,
  setLives,
  setScore,
  gameData,
  currentBgmRef,
  maxFPS,
  fadeAudio,
  setMaxFPS,
}: DevModeModalProps) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showPassModal, setShowPassModal] = useState(false)
  const [passInput, setPassInput] = useState("")
  const [fps, setFps] = useState(0)

  // --- FPS Calculation logic ---
  useEffect(() => {
    if (!showDevMenu || !devMode) return
    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number

    const tick = () => {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)))
        frameCount = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [showDevMenu, devMode])

  const getMusicName = () => {
    const src = currentBgmRef.current?.src || ""
    if (!src) return "None"
    const parts = src.split("/")
    const fileName = parts[parts.length - 1].split(".")[0]
    return fileName || "Unknown"
  }

  const handleForceGameOver = () => {
    if (gameState !== "running" && gameState !== "dev_paused") return
    
    // Mimic death music slow down and trigger game over state
    audioRateManager.animatePlaybackRate(0.09, 1500)
    if (currentBgmRef.current) fadeAudio(currentBgmRef.current, 0, 1500) // Add fade out
    gameData.current.lives = 0
    setLives(0)
    setGameState("over")
  }

  // --- Anti-Right Click (PC) & Keyboard Shortcuts ---
  useEffect(() => {
    const keys = new Set<string>()

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code)

      // Block dev tools shortcuts if devMode is false
      if (!devMode) {
        const isF12 = e.key === "F12";
        const isCtrlShiftI = e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i");
        const isCtrlShiftC = e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c");
        const isCtrlShiftJ = e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j");
        const isCtrlU = e.ctrlKey && (e.key === "U" || e.key === "u");

        if (isF12 || isCtrlShiftI || isCtrlShiftC || isCtrlShiftJ || isCtrlU) {
          e.preventDefault();
          return;
        }
      }

      if (e.repeat) return

      const isDevCombo = keys.has("ControlLeft") && keys.has("Backquote")

      // Toggle DevMode if Left Control + Backquote (` or ~) are pressed
      if (isDevCombo) {
        if (!isAuthorized) {
          setShowPassModal(true)
          return
        }

        if (keys.has("ShiftLeft")) {
          if (devMode) setShowDevMenu((prev) => !prev)
        } else {
          const newMode = !devMode
          setDevMode(newMode)
          setShowDevToast(true)
          setTimeout(() => setShowDevToast(false), 2000)
          if (!newMode) setShowDevMenu(false)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code)
    }

    const handleContextMenu = (e: MouseEvent) => {
      if (!devMode) e.preventDefault()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("contextmenu", handleContextMenu)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [devMode, setDevMode, setShowDevMenu, setShowDevToast, isAuthorized])

  return (
    <>
      {/* Security Password Modal */}
      <AnimatePresence>
        {showPassModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-[320px]"
            >
              <div className="flex items-center gap-3 mb-4 text-blue-400">
                <Lock size={20} />
                <h3 className="text-white font-black uppercase tracking-tight">Dev Access</h3>
              </div>
              <input
                type="password"
                autoFocus
                placeholder="Password..."
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white mb-4 outline-none focus:border-blue-500 font-mono"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && passInput === "MeoTN@") {
                    setIsAuthorized(true)
                    setShowPassModal(false)
                    setPassInput("")
                  } else if (e.key === "Escape") setShowPassModal(false)
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (passInput === "MeoTN@") {
                      setIsAuthorized(true)
                      setShowPassModal(false)
                      setPassInput("")
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-all"
                >Verify</button>
                <button onClick={() => setShowPassModal(false)} className="flex-1 bg-slate-800 text-slate-400 font-bold py-2.5 rounded-lg">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDevToast && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed top-0 z-[120] flex justify-center w-full pointer-events-none"
          >
            <div className="bg-slate-900/90 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${devMode ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-red-500 shadow-[0_0_10px_#ef4444]"}`} />
              <span className="text-white font-bold text-sm uppercase tracking-wider">
                Developer Mode: <span className={devMode ? "text-green-400" : "text-red-400"}>{devMode ? "ENABLED" : "DISABLED"}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDevMenu && devMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 right-4 z-[130] bg-slate-900/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md w-72 max-h-[85vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="text-white font-black uppercase tracking-wider text-sm flex items-center gap-2">
                <Bug size={14} className="text-green-400" /> Dev Menu
              </h3>
              <button onClick={() => setShowDevMenu(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Real-time Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase mb-1">
                    <Activity size={10} /> System
                  </div>
                  <div className="text-xs font-mono text-white flex justify-between">
                    <span className="text-slate-400">FPS:</span>
                    <span className={fps < 50 ? "text-red-400" : "text-green-400"}>{fps}</span>
                  </div>
                  <div className="text-xs font-mono text-white flex justify-between mt-1">
                    <span className="text-slate-400">Speed:</span>
                    <span className="text-blue-400">{(gameData.current.baseGameSpeed * (gameData.current.timeScale || 1)).toFixed(2)}x</span>
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase mb-1">
                    <Layers size={10} /> Objects
                  </div>
                  <div className="text-xs font-mono text-white flex justify-between">
                    <span className="text-slate-400">Ball:</span>
                    <span className="text-yellow-400 truncate ml-1">{gameData.current.ball.type}</span>
                  </div>
                  <div className="text-xs font-mono text-white flex justify-between mt-1">
                    <span className="text-slate-400">Bombs:</span>
                    <span className="text-orange-400">{gameData.current.bombs.length}</span>
                  </div>
                </div>
              </div>

              {/* Audio Status */}
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase mb-1">
                  <Music size={10} /> Current BGM
                </div>
                <div className="text-[10px] font-mono text-blue-300 truncate">
                  {getMusicName()}
                </div>
              </div>

              {/* Hitbox Play */}
              <button
                onClick={() => setDebugHitboxPlay(!debugHitboxPlay)}
                className="w-full flex justify-between items-center bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="text-xs font-bold text-slate-300">Hitbox on Play</span>
                <div className={`w-2 h-2 rounded-full ${debugHitboxPlay ? "bg-green-500" : "bg-red-500"}`} />
              </button>

              {/* Hitbox UI */}
              <button
                onClick={() => setDebugUI(!debugUI)}
                className="w-full flex justify-between items-center bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="text-xs font-bold text-slate-300">Hitbox UI</span>
                <div className={`w-2 h-2 rounded-full ${debugUI ? "bg-green-500" : "bg-red-500"}`} />
              </button>

              {/* Hitbox All */}
              <button
                onClick={() => {
                  const newState = !(debugHitboxPlay && debugUI)
                  setDebugHitboxPlay(newState)
                  setDebugUI(newState)
                }}
                className="w-full py-2 bg-blue-600/20 text-blue-400 font-bold text-xs rounded-lg hover:bg-blue-600/30 uppercase"
              >
                Toggle All Hitboxes
              </button>

              {/* Dev Pause */}
              <button
                onClick={() => {
                  if (gameState === "running") {
                    setGameState("dev_paused")
                    if (currentBgmRef.current) currentBgmRef.current.pause()
                  } else if (gameState === "dev_paused") {
                    setGameState("running")
                    if (currentBgmRef.current && !gameData.current.isMuted) currentBgmRef.current.play().catch(() => { })
                  }
                }}
                className="w-full flex justify-between items-center bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="text-xs font-bold text-slate-300">Dev Pause (No Menu)</span>
                <div className={`w-2 h-2 rounded-full ${gameState === "dev_paused" ? "bg-green-500" : "bg-red-500"}`} />
              </button>

              {/* Force Game Over */}
              <button
                onClick={handleForceGameOver}
                className="w-full py-2 bg-red-600/20 text-red-400 font-bold text-xs rounded-lg hover:bg-red-600/30 uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <Skull size={14} /> Force Game Over
              </button>

              {/* Max FPS Control - Updates immediately */}
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase mb-2">
                  <Zap size={10} /> Limit FPS
                </div>
                <input
                  type="range" min="30" max="240" step="30"
                  value={maxFPS === -1 ? 240 : maxFPS}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    const finalVal = val === 240 ? -1 : val
                    setMaxFPS(finalVal)
                    gameData.current.maxFPS = finalVal
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>30</span>
                  <span className="text-blue-400 font-bold">{maxFPS === -1 ? "Unlimited" : `${maxFPS} FPS`}</span>
                  <span>240</span>
                </div>
              </div>

              {/* Score Edit */}
              <div className="bg-white/5 p-2 rounded-lg">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Set Score</label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    setScore(val)
                    gameData.current.score = val
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {debugUI && (
        <style>{`* { outline: 1px solid rgba(255, 0, 0, 0.3) !important; }`}</style>
      )}
    </>
  )
}
