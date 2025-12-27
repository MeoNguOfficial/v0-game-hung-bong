import React from "react"
import { motion } from "framer-motion"
import { Settings, Play, Home, AlertCircle } from "lucide-react"

interface PauseModalProps {
  t: any
  animationsEnabled: boolean
  isMobile: boolean
  score: number
  confirmExit: boolean
  toggleAutoMode: () => void
  playClick: () => void
  setOpenSettings: (open: boolean) => void
  resumeGame: () => void
  handleExitRequest: () => void
}

export default function PauseModal({
  t,
  animationsEnabled,
  isMobile,
  score,
  confirmExit,
  toggleAutoMode,
  playClick,
  setOpenSettings,
  resumeGame,
  handleExitRequest,
}: PauseModalProps) {
  return (
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
  )
}
