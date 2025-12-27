"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  X, Shield, Heart, Zap, Skull, Bot, EyeOff, Square, ArrowUpCircle,
  Undo2, RotateCcw, RefreshCw, AlertCircle, Play
} from "lucide-react"

export interface CustomConfig {
  isClassic: boolean
  difficulty: "normal" | "hardcode" | "sudden_death"
  isAuto: boolean
  isHidden: boolean
  isBlank: boolean
  isReverse: boolean
  balls: Record<string, { enabled: boolean; score: number; rate: number }>
}

interface CustomGameModalProps {
  t: any
  customConfig: CustomConfig
  setCustomConfig: React.Dispatch<React.SetStateAction<CustomConfig>>
  customError: string | null
  setCustomError: (error: string | null) => void
  setOpenCustom: (open: boolean) => void
  startCustomGame: () => void
  playClick: () => void
  animationsEnabled: boolean
  configHistory: CustomConfig[]
  setConfigHistory: React.Dispatch<React.SetStateAction<CustomConfig[]>>
}

export default function CustomGameModal({
  t, customConfig, setCustomConfig, customError, setCustomError, setOpenCustom,
  startCustomGame, playClick, animationsEnabled, configHistory, setConfigHistory,
}: CustomGameModalProps) {

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
    setCustomConfig(prev => ({
      ...prev,
      balls: {
        normal: { enabled: !prev.isClassic, score: 0, rate: 40 },
        purple: { enabled: !prev.isClassic, score: 50, rate: 30 },
        yellow: { enabled: !prev.isClassic, score: 100, rate: 15 },
        boost: { enabled: !prev.isClassic, score: 200, rate: 3 },
        grey: { enabled: true, score: 300, rate: 2 },
        snow: { enabled: !prev.isClassic, score: 500, rate: 3 },
        orange: { enabled: !prev.isClassic, score: 2, rate: 2 },
        heal: { enabled: true, score: 150, rate: 5 },
      }
    }))
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

  const handleClassicToggle = (isClassic: boolean) => {
    playClick()
    saveHistory()
    setCustomConfig(prev => {
      const newBalls = { ...prev.balls }
      Object.keys(newBalls).forEach(key => {
        const isClassicBall = ['normal', 'heal', 'grey'].includes(key)
        newBalls[key as keyof typeof newBalls].enabled = isClassic ? isClassicBall : true
      })
      
      const newConfig = { ...prev, isClassic, balls: newBalls }

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
      return newConfig
    })
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={animationsEnabled ? { type: "spring", damping: 25 } : { duration: 0 }}
      className="absolute inset-0 z-[80] bg-slate-900 p-8 flex flex-col border-t-4 border-purple-600 rounded-t-[3rem]"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.customGame}</h3>
        <button onClick={() => { playClick(); setOpenCustom(false); setCustomError(null); }} className="text-slate-400 hover:text-white">
          <X size={32} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
        {/* Game Mode */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.gameMode}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 flex gap-2">
            <button onClick={() => handleClassicToggle(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${!customConfig.isClassic ? "bg-blue-600 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}><Shield size={16} /> {t.modeDefault}</button>
            <button onClick={() => handleClassicToggle(true)} className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${customConfig.isClassic ? "bg-yellow-600 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}><Heart size={16} /> {t.modeClassic}</button>
          </div>
        </section>

        {/* Difficulty */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.difficulty}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-3 gap-2">
            <button onClick={() => setCustomConfig(p => ({...p, difficulty: 'normal'}))} className={`py-2 rounded-xl font-bold text-sm uppercase transition-all ${customConfig.difficulty === 'normal' ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}>{t.diffNormal}</button>
            <button onClick={() => setCustomConfig(p => ({...p, difficulty: 'hardcode'}))} className={`py-2 rounded-xl font-bold text-sm uppercase transition-all ${customConfig.difficulty === 'hardcode' ? "bg-orange-600 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}>{t.diffHardcore}</button>
            <button onClick={() => setCustomConfig(p => ({...p, difficulty: 'sudden_death'}))} className={`py-2 rounded-xl font-bold text-sm uppercase transition-all ${customConfig.difficulty === 'sudden_death' ? "bg-red-600 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}>{t.diffSuddenDeath}</button>
          </div>
        </section>

        {/* Assists */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.assists || "Assists"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-1 gap-2">
            <button onClick={() => setCustomConfig(p => ({...p, isAuto: !p.isAuto}))} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isAuto ? "bg-purple-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><Bot size={16} /> {t.miscAutoplay}</button>
          </div>
        </section>

        {/* Modifiers */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.modifiers || "Modifiers"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-2 gap-2">
            <button onClick={() => setCustomConfig(p => ({...p, isHidden: !p.isHidden}))} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isHidden ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><EyeOff size={16} /> {t.miscHidden}</button>
            <button onClick={() => setCustomConfig(p => ({...p, isBlank: !p.isBlank}))} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isBlank ? "bg-slate-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><Square size={16} /> {t.miscBlank}</button>
            <button onClick={() => setCustomConfig(p => ({...p, isReverse: !p.isReverse}))} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isReverse ? "bg-teal-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><ArrowUpCircle size={16} /> {t.miscReverse}</button>
          </div>
        </section>

        {/* Ball Selection */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.selectBalls}</h4>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={handleUndo} disabled={configHistory.length === 0} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${configHistory.length === 0 ? "bg-slate-800 text-slate-600 border-transparent" : "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700"}`}><Undo2 size={14} /> {t.undo}</button>
            <button onClick={handleReset} className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700 transition-all"><RotateCcw size={14} /> {t.reset}</button>
            <button onClick={() => { playClick(); autoBalanceRates(); }} className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"><RefreshCw size={14} /> {t.autoBalance}</button>
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
              <div key={ball.id} className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${customConfig.balls[ball.id as keyof typeof customConfig.balls].enabled ? "bg-slate-800 border-white/20" : "bg-slate-900/50 border-transparent opacity-50"}`}>
                <button onClick={() => toggleBall(ball.id)} className="flex items-center gap-3 flex-1" disabled={customConfig.isClassic && !['normal', 'heal', 'grey'].includes(ball.id)}>
                  <div className={`w-4 h-4 rounded-full ${ball.color} shadow-sm shrink-0`} />
                  <span className={`text-xs font-bold uppercase truncate ${customConfig.balls[ball.id as keyof typeof customConfig.balls].enabled ? "text-white" : "text-slate-500"}`}>{ball.label}</span>
                </button>
                {customConfig.balls[ball.id as keyof typeof customConfig.balls].enabled && (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <label className="text-[8px] text-slate-500 font-bold uppercase">{t.score}</label>
                      <input type="number" min="0" max="1000" value={customConfig.balls[ball.id as keyof typeof customConfig.balls].score}
                        onChange={(e) => { saveHistory(); const val = Math.min(1000, Math.max(0, parseInt(e.target.value) || 0)); setCustomConfig(prev => ({ ...prev, balls: { ...prev.balls, [ball.id]: { ...prev.balls[ball.id as keyof typeof prev.balls], score: val } } })) }}
                        className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs font-mono text-right text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col items-end">
                      <label className="text-[8px] text-slate-500 font-bold uppercase">{t.rate}</label>
                      <input type="number" min="0" max="100" value={customConfig.balls[ball.id as keyof typeof customConfig.balls].rate}
                        onChange={(e) => { saveHistory(); const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)); setCustomConfig(prev => ({ ...prev, balls: { ...prev.balls, [ball.id]: { ...prev.balls[ball.id as keyof typeof prev.balls], rate: val } } })) }}
                        className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs font-mono text-right text-yellow-400 focus:border-yellow-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${getTotalRate() === 100 ? "text-green-400" : "text-red-400"}`}>{t.totalRate}: {getTotalRate()}%</span>
          </div>
        </section>
      </div>

      {customError && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-200 text-xs font-bold animate-pulse">
          <AlertCircle size={16} className="text-red-500" />
          {customError}
        </div>
      )}

      <button onClick={() => { playClick(); startCustomGame(); }} disabled={getTotalRate() !== 100}
        className={`w-full py-4 mt-4 font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-transform ${getTotalRate() === 100 ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30 active:scale-95" : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"}`}>
        <Play size={20} fill="currentColor" /> {t.startCustom}
      </button>
    </motion.div>
  )
}
