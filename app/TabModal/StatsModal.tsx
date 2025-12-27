import React, { useState } from "react"
import { motion } from "framer-motion"
import { Trash2, RotateCcw } from "lucide-react"
import { getScoreKey, getModifierCombinationText, MODIFIER_COMBINATIONS, DIFFICULTIES, GAME_TYPES, initializeScores } from "../ScoreManager"
import type { Difficulty, GameType } from "../ScoreManager"

interface StatsModalProps {
  t: any
  direction: number
  variants: any
  bestScores: Record<string, number>
  setBestScores: (scores: Record<string, number>) => void
  playClick: () => void
}

export default function StatsModal({
  t,
  direction,
  variants,
  bestScores,
  setBestScores,
  playClick,
}: StatsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmResetEntry, setConfirmResetEntry] = useState<string | null>(null)
  const [confirmResetCategory, setConfirmResetCategory] = useState<string | null>(null)

  const handleResetEntry = (key: string) => {
    playClick()
    if (confirmResetEntry !== key) {
      setConfirmResetEntry(key)
      setTimeout(() => setConfirmResetEntry(prev => (prev === key ? null : prev)), 3000)
      return
    }
    localStorage.removeItem(key)
    setBestScores(prev => ({ ...prev, [key]: 0 }))
    setConfirmResetEntry(null)
  }

  const handleResetCategory = (diff: Difficulty, type: GameType) => {
    const catKey = `${diff}_${type}`
    playClick()
    if (confirmResetCategory !== catKey) {
      setConfirmResetCategory(catKey)
      setTimeout(() => setConfirmResetCategory(prev => (prev === catKey ? null : prev)), 3000)
      return
    }
    const keys = MODIFIER_COMBINATIONS.map(mods => getScoreKey(diff, type, mods))
    keys.forEach(k => localStorage.removeItem(k))
    setBestScores(prev => {
      const next = { ...prev }
      keys.forEach(k => next[k] = 0)
      return next
    })
    setConfirmResetCategory(null)
  }

  return (
    <motion.div
      key="stats"
      custom={direction}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.statistics}</h3>
      </div>
      <div className="space-y-6">
        {DIFFICULTIES.map(diff => (
          <div key={diff} className="bg-white/5 p-4 sm:p-6 rounded-[2rem] border border-white/5">
            <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-widest mb-4 capitalize">
              {t[`diff${diff === 'sudden_death' ? 'SuddenDeath' : diff.charAt(0).toUpperCase() + diff.slice(1)}`] || diff}
            </h4>
            <div className="space-y-4">
              {GAME_TYPES.map(type => (
                <div key={type}>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-white/10 pb-1">
                    <div className="flex items-center justify-between">
                      <span>{t[`mode${type.charAt(0).toUpperCase() + type.slice(1)}`] || type}</span>
                      <button
                        onClick={() => handleResetCategory(diff as Difficulty, type as GameType)}
                        className={`inline-flex items-center gap-2 text-xs rounded px-2 py-1 font-bold ${confirmResetCategory === `${diff}_${type}` ? 'bg-red-600 text-white animate-pulse' : 'text-red-400 hover:bg-slate-700'}`}
                        title={confirmResetCategory === `${diff}_${type}` ? (t.confirmDeleteCategory || 'Confirm') : (t.clearCategory || 'Reset Category')}
                      >
                        <RotateCcw size={14} />
                        <span className="hidden sm:inline">{confirmResetCategory === `${diff}_${type}` ? (t.confirmDeleteCategory || 'Confirm') : (t.clearCategory || 'Reset')}</span>
                      </button>
                    </div>
                  </h5>
                  <div className="space-y-2">
                    {MODIFIER_COMBINATIONS.map((mods, i) => {
                      const key = getScoreKey(diff, type, mods);
                      const score = bestScores[key] || 0;
                      const isConfirm = confirmResetEntry === key
                      return (
                        <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-400 px-2">
                          <span className="truncate pr-2">{getModifierCombinationText(mods, t)}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-black tabular-nums ${score > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{score}</span>
                            <button
                              onClick={() => handleResetEntry(key)}
                              className={`p-2 rounded ${isConfirm ? 'bg-red-600 text-white animate-pulse' : 'text-red-400 hover:bg-slate-700'}`}
                              title={isConfirm ? (t.confirmDeleteOne || 'Confirm') : (t.clearRecord || 'Reset')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="bg-white/5 p-4 sm:p-6 rounded-[2rem] border border-white/5 mt-4">
          <button
            onClick={() => {
              playClick()
              if (!confirmReset) {
                setConfirmReset(true)
                setTimeout(() => setConfirmReset(false), 3000)
                return
              }
              Object.keys(bestScores).forEach(key => localStorage.removeItem(key));
              setBestScores(initializeScores());
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
  )
}
