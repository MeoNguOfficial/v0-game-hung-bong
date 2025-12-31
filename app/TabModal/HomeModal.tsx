import React from "react"
import { motion } from "framer-motion"
import { Zap, Play, Gamepad2, Edit3 } from "lucide-react"

interface HomeModalProps {
  t: any
  direction: number
  variants: any
  menuItemVariants: any
  playClick: () => void
  setOpenQuickPlay: (value: boolean) => void
  setOpenCustom: (value: boolean) => void
}

export default function HomeModal({
  t,
  direction,
  variants,
  menuItemVariants,
  playClick,
  setOpenQuickPlay,
  setOpenCustom,
}: HomeModalProps) {
  return (
    <motion.div
      key="home"
      custom={direction}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto custom-scrollbar"
    >
      <motion.div
        variants={menuItemVariants}
        initial="hidden"
        animate="visible"
        className="w-full flex flex-col items-center"
        key="start"
      >
        <motion.div variants={menuItemVariants} className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 shrink-0">
            <Zap size={32} className="text-white fill-white" />
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter text-left leading-none">
            Catch<br />Master
          </h2>
        </motion.div>

        <motion.button
          variants={menuItemVariants}
          onClick={() => { playClick(); setOpenQuickPlay(true); }}
          className="w-full py-5 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 shadow-xl transition-all mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/30 text-white"
        >
          <Play size={32} fill="currentColor" />
          {t.quickPlay || "QUICK PLAY"}
        </motion.button>

        <motion.button
          variants={menuItemVariants}
          onClick={() => {
            playClick()
            setOpenCustom(true)
          }}
          className="w-full py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all mb-6 bg-slate-800 text-slate-300 border border-white/5 hover:bg-slate-700 hover:text-white"
        >
          <Edit3 size={20} /> {t.custom || "Custom"}
        </motion.button>

        <motion.div variants={menuItemVariants} className="text-slate-600 text-[10px] font-bold uppercase tracking-widest opacity-40 mt-8">
          v1.0.4 Hotfix 1
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
