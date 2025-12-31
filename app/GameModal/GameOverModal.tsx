import React, { useEffect, useState, useRef } from "react"
import { motion, animate } from "framer-motion"
import { Trophy, Home, Settings, Star } from "lucide-react"

interface GameOverModalProps {
  t: any
  score: number
  direction: number
  tabVariants: any
  menuItemVariants: any
  animationLevel: "full" | "min" | "none"
  playClick: () => void
  isNewBest: boolean
  newBestRank?: number | null
  playSound: (name: string) => void
  stopSound: (name: string) => void
  onHome: () => void
  onSettings: () => void
}

export default function GameOverModal({
  t,
  score,
  direction,
  tabVariants,
  menuItemVariants,
  animationLevel,
  playClick,
  isNewBest,
  newBestRank,
  playSound,
  stopSound,
  onHome,
  onSettings,
}: GameOverModalProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [showNewBestLabel, setShowNewBestLabel] = useState(false)
  const [showButtons, setShowButtons] = useState(false)
  const isNewBestRef = useRef(isNewBest)
  const newBestRankRef = useRef(newBestRank)

  useEffect(() => {
    isNewBestRef.current = isNewBest
  }, [isNewBest])

  useEffect(() => {
    newBestRankRef.current = newBestRank
  }, [newBestRank])

  useEffect(() => {
    // 1. Wait for "Game Over" text to appear
    const startDelay = setTimeout(() => {
      // 2. Start counting
      playSound("score_count")
      
      const controls = animate(0, score, {
        duration: score > 0 ? 1.5 : 0.5,
        ease: "easeOut",
        onUpdate: (value) => setDisplayScore(Math.floor(value)),
        onComplete: () => {
          stopSound("score_count")
          setDisplayScore(score)
          
          if (isNewBestRef.current || (newBestRankRef.current && newBestRankRef.current <= 5)) {
            playSound("game_over_new_best")
            setShowNewBestLabel(true)
          }
          
          setTimeout(() => setShowButtons(true), 600)
        }
      })
      
      return () => controls.stop()
    }, 800)

    return () => {
      clearTimeout(startDelay)
      stopSound("score_count")
    }
  }, [score]) // Run once when score is available (on mount basically)

  return (
    <motion.div
      key="over"
      custom={direction}
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <motion.div
        variants={menuItemVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center"
        key="over"
      >
        <motion.div
          variants={menuItemVariants}
          animate={animationLevel !== "none" ? { scale: [0.94, 1.08, 1] } : { scale: 1 }}
          transition={
            animationLevel !== "none"
              ? { duration: 0.7, times: [0, 0.7, 1], type: "spring", stiffness: 400, damping: 12 }
              : { duration: 0 }
          }
        >
          <Trophy size={80} className="text-yellow-500 mb-6" />
        </motion.div>
        <motion.h2
          variants={menuItemVariants}
          className="text-5xl font-black mb-2 text-white italic uppercase tracking-tighter"
        >
          {t.gameOver}
        </motion.h2>
        <motion.div
          variants={menuItemVariants}
          className="text-7xl font-black text-yellow-400 mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]"
        >
          {displayScore}
        </motion.div>

        {showNewBestLabel && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-6 py-2 rounded-xl shadow-lg z-10 mb-8"
          >
            <Star size={20} className="fill-slate-900 animate-spin-slow" />
            <span className="font-black italic text-xl uppercase tracking-tighter">
              {newBestRank ? `New Top #${newBestRank}` : (t.newBest || "New Best!")}
            </span>
            <Star size={20} className="fill-slate-900 animate-spin-slow" />
          </motion.div>
        )}

        {showButtons && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 pointer-events-auto"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playClick()
                onHome()
              }}
              className="px-10 py-4 bg-slate-800 text-white font-black rounded-full flex items-center gap-3 border border-white/10 hover:bg-slate-700 transition-all"
            >
              <Home size={24} /> {t.home}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playClick()
                onSettings()
              }}
              className="p-4 bg-slate-800 text-white rounded-full border border-white/10"
            >
              <Settings size={24} />
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
