'use client'
import React, { useState } from "react"
import { motion, type Variants, AnimatePresence } from "framer-motion"
import { Trash2, Trophy, Calendar, EyeOff, Square, ArrowUpCircle, ArrowRightLeft, FlipVertical, Ghost } from "lucide-react"
import { initializeScores, getModifierCombinationText } from "../ScoreManager"
import type { HistoryEntry } from "../ScoreManager"
import DefaultModeStatsModal from "../StatsModal/DefaultModeStatsModal"
import ClassicModeStatsModal from "../StatsModal/ClassicModeStatsModal"

interface StatsModalProps {
  t: Record<string, string>
  direction: number
  variants: Variants
  bestScores: Record<string, number>
  setBestScores: (scores: Record<string, number>) => void
  playClick: () => void
  recentScores: HistoryEntry[]
  setRecentScores: (scores: HistoryEntry[]) => void
  animationLevel: "full" | "min" | "none"
}

export default function StatsModal({
  t,
  direction,
  variants,
  bestScores,
  setBestScores,
  playClick,
  recentScores = [],
  setRecentScores,
  animationLevel,
}: StatsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [activeTab, setActiveTab] = useState<'classic' | 'default'>('default')
  const [tabDirection, setTabDirection] = useState(0)

  const changeTab = (tab: 'classic' | 'default') => {
    if (tab === activeTab) return
    setTabDirection(tab === 'classic' ? 1 : -1)
    setActiveTab(tab)
  }

  const contentVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: animationLevel === 'none' ? { duration: 0 } : 
                  animationLevel === 'min' ? { duration: 0.15 } : 
                  { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      transition: animationLevel === 'none' ? { duration: 0 } : { duration: 0.15 }
    })
  }

  return (
    <motion.div
      key="stats"
      custom={direction}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="flex justify-between items-center p-6 pb-4 shrink-0 z-10 border-b border-white/5">
        <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.statistics}</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
      <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/5">
        <button
          onClick={() => changeTab('default')}
          className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'default'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          {t.modeDefault || "Default"}
        </button>
        <button
          onClick={() => changeTab('classic')}
          className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'classic'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          {t.modeClassic || "Classic"}
        </button>
      </div>

      <AnimatePresence mode="wait" custom={tabDirection}>
        {activeTab === 'default' && (
          <motion.div
            key="default"
            custom={tabDirection}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <DefaultModeStatsModal
              t={t}
              bestScores={bestScores}
              setBestScores={setBestScores}
              playClick={playClick}
              recentScores={recentScores}
              setRecentScores={setRecentScores}
            />
          </motion.div>
        )}
        {activeTab === 'classic' && (
          <motion.div
            key="classic"
            custom={tabDirection}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <ClassicModeStatsModal
              t={t}
              bestScores={bestScores}
              setBestScores={setBestScores}
              playClick={playClick}
              recentScores={recentScores}
              setRecentScores={setRecentScores}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>

  )
}
