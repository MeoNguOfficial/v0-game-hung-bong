import React from "react"
import { motion } from "framer-motion"
import { Settings, Play, Home, AlertCircle, Zap } from "lucide-react"

interface PauseModalProps {
  t: any
  animationLevel: "full" | "min" | "none"
  isMobile: boolean
  score: number
  confirmExit: boolean
  maxFPS: number
  setMaxFPS: (e: React.ChangeEvent<HTMLInputElement>) => void
  toggleAutoMode: () => void
  playClick: () => void
  setOpenSettings: (open: boolean) => void
  setOpenSettingsFromPause: (open: boolean) => void
  resumeGame: () => void
  handleExitRequest: () => void
  openSettings: boolean // Add this prop
}

export default function PauseModal({
  t,
  animationLevel,
  isMobile,
  score,
  confirmExit,
  maxFPS,
  setMaxFPS,
  toggleAutoMode,
  playClick,
  setOpenSettings,
  setOpenSettingsFromPause,
  resumeGame,
  handleExitRequest,
  openSettings, // Receive the prop
}: PauseModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={
        animationLevel === "none" ? { duration: 0 } :
        { duration: 0.2 }
      }
      className={`absolute inset-0 z-[70] bg-slate-950/90 flex flex-col items-center justify-center p-8 text-center transition-all duration-200 ease-out ${
        openSettings ? "backdrop-blur-sm" : "backdrop-blur-xl" // Reduce blur when settings is open, then transition back
      }`}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ 
          scale: openSettings ? 0.95 : 1, 
          opacity: openSettings ? 0 : 1 
        }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={
          animationLevel === "full" ? { type: "spring", stiffness: 400, damping: 30 } :
          animationLevel === "min" ? { duration: 0.2 } :
          { duration: 0 }
        }
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

          {/* Quick Max FPS Slider */}
          <div className="w-full bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3 mb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.maxFPS}</span>
              </div>
              <span className="text-xs font-black text-blue-400 tabular-nums">{maxFPS === -1 ? t.unlimited : `${maxFPS} FPS`}</span>
            </div>
            <input
              type="range" min="30" max="240" step="30"
              value={maxFPS === -1 ? 240 : maxFPS}
              onChange={setMaxFPS}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Settings Button (Replaces Quick Sliders) */}
          <button
            onClick={() => {
              playClick()
              setOpenSettings(true)
              setOpenSettingsFromPause(true)
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
  )
}
