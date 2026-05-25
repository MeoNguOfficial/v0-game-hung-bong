import React from "react"
import { motion } from "framer-motion"
import { X, Check } from "lucide-react"

interface SkinPlayerModalProps {
  t: any
  currentSkin: string
  setSkin: (skin: string) => void
  playClick: () => void
  onClose: () => void
  animationsEnabled: boolean
}

export const SKINS = [
  { id: "default", name: "skinDefault", color: "bg-blue-500" },
  { id: "emerald", name: "skinEmerald", color: "bg-emerald-500" },
  { id: "neon", name: "skinNeon", color: "bg-fuchsia-500" },
  { id: "ice", name: "skinIce", color: "bg-cyan-400" },
  { id: "cyber", name: "skinCyber", color: "bg-lime-500" },
  { id: "inferno", name: "skinInferno", color: "bg-orange-600" },
  { id: "void", name: "skinVoid", color: "bg-violet-900" },
  { id: "galaxy", name: "skinGalaxy", color: "bg-indigo-600" },
  { id: "diamond", name: "skinDiamond", color: "bg-cyan-200" },
  { id: "iron", name: "skinIron", color: "bg-slate-400" },
  { id: "gold", name: "skinGold", color: "bg-yellow-400" },
  { id: "copper", name: "skinCopper", color: "bg-orange-400" },
  { id: "wooden", name: "skinWooden", color: "bg-amber-800" },
  { id: "ruby", name: "skinRuby", color: "bg-red-600" },
  { id: "sapphire", name: "skinSapphire", color: "bg-blue-700" },
  { id: "platinum", name: "skinPlatinum", color: "bg-slate-300" },
  { id: "leaves", name: "skinLeaves", color: "bg-green-600" },
  { id: "water", name: "skinWater", color: "bg-sky-500" },
]

export default function SkinPlayerModal({
  t,
  currentSkin,
  setSkin,
  playClick,
  onClose,
  animationsEnabled,
}: SkinPlayerModalProps) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={animationsEnabled ? { type: "spring", damping: 25 } : { duration: 0 }}
      className="absolute inset-0 z-[80] bg-slate-900 flex flex-col border-t-4 border-pink-500 rounded-t-[3rem] overflow-hidden"
    >
      <div className="flex justify-between items-center p-8 pb-4 shrink-0 border-b border-white/5">
        <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.skins || "SKINS"}</h3>
        <button onClick={() => {
          playClick()
          onClose()
        }} className="text-slate-400 hover:text-white">
          <X size={32} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 content-start p-8 pt-4 custom-scrollbar">
        {SKINS.map((skin) => (
          <button
            key={skin.id}
            onClick={() => setSkin(skin.id)}
            className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${currentSkin === skin.id ? "bg-slate-800 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]" : "bg-slate-800/50 border-transparent hover:bg-slate-800"}`}
          >
            <div className={`w-16 h-4 rounded-full ${skin.color} shadow-sm`} />
            <span className={`text-xs font-bold uppercase ${currentSkin === skin.id ? "text-white" : "text-slate-500"}`}>
              {t[skin.name] || skin.id}
            </span>
            {currentSkin === skin.id && <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1"><Check size={12} className="text-white" /></div>}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
