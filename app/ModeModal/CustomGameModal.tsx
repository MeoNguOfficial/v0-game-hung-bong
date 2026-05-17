"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  X, Zap, Skull, Bot, EyeOff, Square, ArrowUpCircle,
  Undo2, RotateCcw, RefreshCw, AlertCircle, Play,
  ArrowRightLeft, FlipVertical, Ghost, Plus, Minus
} from "lucide-react"

export interface CustomConfig {
  difficulty: "normal" | "hardcode" | "sudden_death"
  isAuto: boolean
  isHidden: boolean
  isBlank: boolean
  isReverse: boolean
  isReverseControl: boolean
  isMirror: boolean
  isInvisible: boolean
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

// Component Input số nâng cao với nút +/- và tính năng kéo (drag)
const DraggableNumberInput = ({ 
  value, onChange, min = 0, max = 100, step = 1, label, colorClass, playClick 
}: { 
  value: number, onChange: (val: number) => void, min?: number, max?: number, 
  step?: number, label: string, colorClass: string, playClick: () => void 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startVal = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startVal.current = value;
    document.body.style.cursor = 'ew-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const diff = Math.floor((e.clientX - startX.current) / 5); // Độ nhạy: 5px = 1 đơn vị
      const newVal = Math.min(max, Math.max(min, startVal.current + diff * step));
      if (newVal !== value) onChange(newVal);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, value, min, max, step, onChange]);

  return (
    <div className="flex flex-col w-full group">
      <div className="flex justify-between items-center mb-1 px-1">
        <label className="text-[9px] text-slate-500 font-black uppercase tracking-tighter leading-none">{label}</label>
        <span className="text-[7px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">DRAG ↔</span>
      </div>
      <div className="flex items-center bg-slate-950/50 border border-slate-700/50 rounded-xl overflow-hidden focus-within:border-blue-500 transition-all w-full">
        <button onClick={() => { playClick(); onChange(Math.max(min, value - step)); }} className="px-3 py-2.5 hover:bg-white/5 text-slate-400 transition-colors"><Minus size={12} /></button>
        <input 
          type="number" value={value} 
          onMouseDown={handleMouseDown}
          onChange={(e) => onChange(Math.min(max, Math.max(min, parseInt(e.target.value) || 0)))}
          className={`flex-1 min-w-0 bg-transparent text-center text-xs font-black outline-none cursor-ew-resize select-none py-2 ${colorClass}`} 
        />
        <button onClick={() => { playClick(); onChange(Math.min(max, value + step)); }} className="px-3 py-2.5 hover:bg-white/5 text-slate-400 transition-colors"><Plus size={12} /></button>
      </div>
    </div>
  );
};

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
    playClick() // Thêm SFX
    const previous = configHistory[configHistory.length - 1]
    setCustomConfig(previous)
    setConfigHistory(prev => prev.slice(0, -1))
  }

  const handleReset = () => {
    playClick() // Thêm SFX
    saveHistory()
    setCustomConfig(prev => ({
      ...prev,
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
    }))
  }

  const autoBalanceRates = () => {
    playClick() // Thêm SFX
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
    playClick() // SFX đã có
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



  // Các hàm tiện ích để handle input thay đổi có kèm SFX
  const handleConfigToggle = (key: keyof CustomConfig) => {
    playClick()
    setCustomConfig(p => ({ ...p, [key]: !p[key] }))
  }

  const handleDifficultyChange = (diff: CustomConfig["difficulty"]) => {
    playClick()
    setCustomConfig(p => ({ ...p, difficulty: diff }))
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


        {/* Difficulty */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.difficulty}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-3 gap-2">
            <button onClick={() => handleDifficultyChange('normal')} className={`py-2 rounded-xl font-bold text-sm uppercase transition-all ${customConfig.difficulty === 'normal' ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}>{t.diffNormal}</button>
            <button onClick={() => handleDifficultyChange('hardcode')} className={`py-2 rounded-xl font-bold text-sm uppercase transition-all ${customConfig.difficulty === 'hardcode' ? "bg-orange-600 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}>{t.diffHardcore}</button>
            <button onClick={() => handleDifficultyChange('sudden_death')} className={`py-2 rounded-xl font-bold text-sm uppercase transition-all ${customConfig.difficulty === 'sudden_death' ? "bg-red-600 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}>{t.diffSuddenDeath}</button>
          </div>
        </section>

        {/* Assists */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.assists || "Assists"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-1 gap-2">
            <button onClick={() => handleConfigToggle('isAuto')} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isAuto ? "bg-purple-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><Bot size={16} /> {t.miscAutoplay}</button>
          </div>
        </section>

        {/* Modifiers */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.modifiers || "Modifiers"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-2 gap-2">
            <button onClick={() => handleConfigToggle('isHidden')} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isHidden ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><EyeOff size={16} /> {t.miscHidden}</button>
            <button onClick={() => handleConfigToggle('isBlank')} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isBlank ? "bg-slate-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><Square size={16} /> {t.miscBlank}</button>
            <button onClick={() => handleConfigToggle('isReverse')} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isReverse ? "bg-teal-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><ArrowUpCircle size={16} /> {t.miscReverse}</button>
          </div>
        </section>

        {/* Funny */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.funny || "Funny"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-3 gap-2">
            <button onClick={() => handleConfigToggle('isReverseControl')} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isReverseControl ? "bg-lime-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><ArrowRightLeft size={16} /> {t.funnyReverseControl || "Rev. Ctrl"}</button>
            <button onClick={() => handleConfigToggle('isMirror')} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isMirror ? "bg-fuchsia-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><FlipVertical size={16} /> {t.funnyMirror || "Mirror"}</button>
            <button onClick={() => handleConfigToggle('isInvisible')} className={`py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${customConfig.isInvisible ? "bg-stone-600 text-white shadow-lg" : "bg-slate-800 text-slate-500"}`}><Ghost size={16} /> {t.funnyInvisible || "Invisible"}</button>
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
            <button onClick={autoBalanceRates} className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"><RefreshCw size={14} /> {t.autoBalance}</button>
          </div>
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
              <div key={ball.id} className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${customConfig.balls[ball.id as keyof typeof customConfig.balls].enabled ? "bg-slate-800 border-white/20" : "bg-slate-900/50 border-transparent opacity-50"}`}>
                <button onClick={() => toggleBall(ball.id)} className="flex items-center gap-3 flex-1" disabled={customConfig.isClassic && !['normal', 'heal', 'grey'].includes(ball.id)}>
                  <div className={`w-4 h-4 rounded-full ${ball.color} shadow-sm shrink-0`} />
                  <span className={`text-xs font-bold uppercase truncate ${customConfig.balls[ball.id as keyof typeof customConfig.balls].enabled ? "text-white" : "text-slate-500"}`}>{ball.label}</span>
                </button>
                {config.enabled && (
                  <div className="flex flex-col gap-2 mt-auto">
                    <DraggableNumberInput 
                      label={t.score}
                      value={config.score}
                      min={0} max={1000} step={10}
                      colorClass="text-white"
                      playClick={playClick}
                      onChange={(val) => {
                        saveHistory();
                        setCustomConfig(prev => ({ 
                          ...prev, 
                          balls: { ...prev.balls, [ball.id]: { ...config, score: val } } 
                        }));
                      }}
                    />
                    <DraggableNumberInput 
                      label={t.rate}
                      value={config.rate}
                      min={0} max={100}
                      colorClass="text-yellow-400"
                      playClick={playClick}
                      onChange={(val) => {
                        saveHistory();
                        setCustomConfig(prev => ({ 
                          ...prev, 
                          balls: { ...prev.balls, [ball.id]: { ...config, rate: val } } 
                        }));
                      }}
                    />
                  </div>
                )}
                </div>
              );
            })}
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
