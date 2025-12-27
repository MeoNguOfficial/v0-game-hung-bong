"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Heart, Bot, Play, Info, EyeOff, Square, Lock, Zap, Skull, ArrowUpCircle } from "lucide-react";

interface QuickPlayModalProps {
  t: any
  onClose: () => void
  onPlay: (mode: "normal" | "hardcode" | "sudden_death", isClassic: boolean, isAuto: boolean) => void
  playClick: () => void
  animationsEnabled: boolean
  gameMode: "normal" | "hardcode" | "sudden_death"
  setGameMode: (mode: "normal" | "hardcode" | "sudden_death") => void
  isClassic: boolean
  setIsClassic: (isClassic: boolean) => void
  isAuto: boolean
  setIsAuto: (isAuto: boolean) => void
  isHidden: boolean
  setIsHidden: (v: boolean) => void
  isBlank: boolean
  setIsBlank: (v: boolean) => void
  isReverse: boolean
  setIsReverse: (v: boolean) => void
}

export default function QuickPlayModal({
  t, onClose, onPlay, playClick, animationsEnabled,
  gameMode, setGameMode, isClassic, setIsClassic, isAuto, setIsAuto,
  isHidden, setIsHidden, isBlank, setIsBlank, isReverse, setIsReverse
}: QuickPlayModalProps) {
  const [activeInfo, setActiveInfo] = useState<string | null>(null)

  // Hàm hiển thị thông tin khi nhấn vào icon Info
  const toggleInfo = (e: React.MouseEvent | React.TouchEvent, infoKey: string) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click vào nút chính
    playClick();
    setActiveInfo(infoKey);
  }

  // Component nút bấm có tích hợp icon Info riêng
  const ModeButton = ({ 
    active, onClick, icon: Icon, label, infoKey, colorClass 
  }: { active: boolean, onClick: () => void, icon: any, label: string, infoKey: string, colorClass: string }) => (
    <div className="relative flex-1">
      <button
        onClick={() => { playClick(); onClick(); }}
        className={`w-full py-4 rounded-xl font-bold text-xs uppercase transition-all flex flex-col items-center gap-1 ${
          active ? `${colorClass} text-white shadow-lg` : "bg-slate-800 text-slate-500 hover:bg-slate-700/50"
        }`}
      >
        <Icon size={18} /> {label}
      </button>
      {/* Nút hướng dẫn riêng cho mỗi nút */}
      <button 
        onClick={(e) => toggleInfo(e, infoKey)}
        className="absolute top-1 right-1 p-1 text-white/20 hover:text-white/80 transition-colors"
      >
        <Info size={14} />
      </button>
    </div>
  )

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={animationsEnabled ? { type: "spring", damping: 25 } : { duration: 0 }}
      className="absolute inset-0 z-[80] bg-slate-900 p-8 flex flex-col border-t-4 border-blue-600 rounded-t-[3rem] overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.quickPlay || "QUICK PLAY"}</h3>
        </div>
        <button onClick={() => { playClick(); onClose(); }} className="text-slate-400 hover:text-white transition-colors">
          <X size={32} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
        {/* Game Mode */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.gameMode || "Game Mode"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 flex gap-2">
            <ModeButton 
              active={!isClassic} onClick={() => setIsClassic(false)} 
              icon={Shield} label={t.modeDefault || "Default"} infoKey="modeDefaultDesc" colorClass="bg-blue-600" 
            />
            <ModeButton 
              active={isClassic} onClick={() => setIsClassic(true)} 
              icon={Heart} label={t.modeClassic || "Classic"} infoKey="modeClassicDesc" colorClass="bg-yellow-600" 
            />
          </div>
        </section>

        {/* Difficulty Grid 3 cột */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.difficulty || "Difficulty"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-3 gap-2">
            <ModeButton 
              active={gameMode === "normal"} onClick={() => setGameMode("normal")} 
              icon={Shield} label="Normal" infoKey="diffNormalDesc" colorClass="bg-emerald-600" 
            />
            <ModeButton 
              active={gameMode === "hardcode"} onClick={() => setGameMode("hardcode")} 
              icon={Zap} label="Hard" infoKey="diffHardcoreDesc" colorClass="bg-orange-600" 
            />
            <ModeButton 
              active={gameMode === "sudden_death"} onClick={() => setGameMode("sudden_death")} 
              icon={Skull} label="Sudden" infoKey="diffSuddenDeathDesc" colorClass="bg-red-600" 
            />
          </div>
        </section>

        {/* Assists */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.assists || "Assists"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-1 gap-2">
            <ModeButton 
              active={isAuto} onClick={() => setIsAuto(!isAuto)} 
              icon={Bot} label="Autoplay" infoKey="miscAutoplayDesc" colorClass="bg-purple-600" 
            />
          </div>
        </section>

        {/* Modifiers */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.modifiers || "Modifiers"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-2 gap-2">
            <ModeButton 
              active={isHidden} onClick={() => setIsHidden(!isHidden)} 
              icon={EyeOff} label="Hidden" infoKey="miscHiddenDesc" colorClass="bg-indigo-600" 
            />
            <ModeButton 
              active={isBlank} onClick={() => setIsBlank(!isBlank)} 
              icon={Square} label="Blank" infoKey="miscBlankDesc" colorClass="bg-slate-600" 
            />
            <ModeButton 
              active={isReverse} onClick={() => setIsReverse(!isReverse)} 
              icon={ArrowUpCircle} label="Reverse" infoKey="miscReverseDesc" colorClass="bg-teal-600" 
            />
            {/* Nút Soon */}
            <div className="py-3 rounded-xl font-bold text-xs uppercase bg-slate-900/50 text-slate-600 border border-white/5 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed overflow-hidden relative">
              <Lock size={12} /> Soon
              <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12" />
            </div>
          </div>
        </section>
      </div>

      {/* Play Button */}
      <button onClick={() => { playClick(); onPlay(gameMode, isClassic, isAuto); }}
        className="w-full py-5 mt-6 font-black text-2xl rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all bg-gradient-to-r from-blue-600 to-cyan-600 text-white active:scale-95">
        <Play size={24} fill="currentColor" /> {t.play || "PLAY"}
      </button>

      {/* Info Overlay (Hiện khi nhấn vào icon Info) */}
      <AnimatePresence>
        {activeInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActiveInfo(null)} // Click vào overlay để tắt
            className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/95 backdrop-blur-md cursor-pointer"
          >
            <div className="text-center space-y-4 max-w-xs pointer-events-none">
              <Info size={40} className="mx-auto text-blue-400" />
              <p className="text-white text-lg font-black uppercase italic tracking-tighter">Information</p>
              <p className="text-slate-300 text-sm font-medium italic leading-relaxed px-4">
                "{t[activeInfo] || "N/A"}"
              </p>
              <p className="text-blue-500 text-[10px] font-bold animate-pulse">CLICK ANYWHERE TO CLOSE</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
