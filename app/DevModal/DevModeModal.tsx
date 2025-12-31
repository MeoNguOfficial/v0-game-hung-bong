"use client"

import React, { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bug, X } from "lucide-react"

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
  setScore: (value: number) => void
  gameData: React.MutableRefObject<any>
  currentBgmRef: React.MutableRefObject<HTMLAudioElement | null>
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
  setScore,
  gameData,
  currentBgmRef,
}: DevModeModalProps) {
  // --- Anti-Right Click (PC) & Keyboard Shortcuts ---
  useEffect(() => {
    const keys = new Set<string>()

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code)
      if (e.repeat) return

      // Toggle DevMode if Left Control + Backquote (` or ~) are pressed
      if (keys.has("ControlLeft") && keys.has("Backquote")) {
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
  }, [devMode, setDevMode, setShowDevMenu, setShowDevToast])

  return (
    <>
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
            className="fixed top-20 right-4 z-[130] bg-slate-900/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md w-64"
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="text-white font-black uppercase tracking-wider text-sm flex items-center gap-2">
                <Bug size={14} className="text-green-400" /> Dev Menu
              </h3>
              <button onClick={() => setShowDevMenu(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <div className="space-y-3">
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
