"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Heart, Bot, Play, Info, EyeOff, Square, Lock, Zap, Skull, ArrowUpCircle, ArrowRightLeft, FlipVertical, Ghost, Trophy } from "lucide-react";
import { getScoreMultiplier, GAME_TYPE_MULTIPLIER, DIFFICULTY_MULTIPLIER, type HistoryEntry } from "../ScoreManager";

interface QuickPlayModalProps {
  t: any
  onClose: () => void
  onPlay: (mode: "normal" | "hardcode" | "sudden_death", isClassic: boolean, isAuto: boolean) => void
  playClick: () => void
  animationLevel: "full" | "min" | "none"
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
  isReverseControl: boolean
  setIsReverseControl: (v: boolean) => void
  isMirror: boolean
  setIsMirror: (v: boolean) => void
  isInvisible: boolean
  setIsInvisible: (v: boolean) => void
  bestScores: Record<string, number>
  recentScores: HistoryEntry[]
}

export default function QuickPlayModal({
  t, onClose, onPlay, playClick, animationLevel,
  gameMode, setGameMode, isClassic, setIsClassic, isAuto, setIsAuto,
  isHidden, setIsHidden, isBlank, setIsBlank, isReverse, setIsReverse,
  isReverseControl, setIsReverseControl, isMirror, setIsMirror, isInvisible, setIsInvisible,
  bestScores, recentScores = []
}: QuickPlayModalProps) {
  const [activeInfo, setActiveInfo] = useState<string | null>(null)
  const [showClassicTop, setShowClassicTop] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowClassicTop(prev => !prev)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const getTop1Detail = (isClassicMode: boolean) => {
    let maxScore = -1;
    let details: any = null;

    // 1. Check Best Scores
    Object.entries(bestScores).forEach(([k, v]) => {
      if (!k.startsWith("best_score_")) return;
      const s = k.replace(/^best_score_/, "")
      let type = "default";
      let difficulty = "normal";
      let modifierParts: string[] = [];

      if (s.startsWith('sudden_death_')) {
         difficulty = 'sudden_death';
         const parts = s.replace('sudden_death_', '').split('_');
         type = parts[0];
         modifierParts = parts.slice(1);
      } else {
         const parts = s.split('_');
         difficulty = parts[0];
         if (parts.length > 1) type = parts[1];
         modifierParts = parts.slice(2);
      }

      if ((isClassicMode ? type === "classic" : type !== "classic")) {
        if (v > maxScore) {
          maxScore = v;
          details = {
            score: v,
            difficulty,
            modifiers: {
              isHidden: modifierParts.includes('h'),
              isBlank: modifierParts.includes('b'),
              isReverse: modifierParts.includes('r')
            },
            funny: { isReverseControl: false, isMirror: false, isInvisible: false }
          };
        }
      }
    });

    // 2. Check Recent Scores (History)
    recentScores.forEach(r => {
      if ((isClassicMode ? r.gameType === "classic" : r.gameType !== "classic")) {
        if (r.score > maxScore) {
          maxScore = r.score;
          details = {
            score: r.score,
            difficulty: r.difficulty,
            modifiers: r.modifiers,
            funny: r.funny
          };
        }
      }
    });

    return details;
  }

  const top1Detail = getTop1Detail(showClassicTop);

  // Hàm hiển thị thông tin khi nhấn vào icon Info
  const toggleInfo = (e: React.MouseEvent | React.TouchEvent, infoKey: string) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click vào nút chính
    playClick();
    setActiveInfo(infoKey);
  }

  // Component nút bấm có tích hợp icon Info riêng
  const ModeButton = ({ 
    active, onClick, icon: Icon, label, infoKey, colorClass, multiplier
  }: { active: boolean, onClick: () => void, icon: any, label: string, infoKey: string, colorClass: string, multiplier?: string }) => (
    <div className="relative flex-1">
      <button
        onClick={() => { playClick(); onClick(); }}
        className={`w-full py-4 rounded-xl font-bold text-xs uppercase transition-all flex flex-col items-center gap-1 ${
          active ? `${colorClass} text-white shadow-lg` : "bg-slate-800 text-slate-500 hover:bg-slate-700/50"
        }`}
      >
        <Icon size={18} /> {label}
        {multiplier && <span className={`text-[9px] px-1.5 rounded-full ${active ? "bg-white/20" : "bg-slate-900/50 text-slate-400"}`}>{multiplier}</span>}
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

  const currentMultiplier = getScoreMultiplier(
    gameMode,
    isClassic ? "classic" : "default",
    { isHidden, isBlank, isReverse },
    isReverseControl || isMirror || isInvisible
  )

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={animationLevel === "full" ? { type: "spring", damping: 25 } : animationLevel === "min" ? { duration: 0.2 } : { duration: 0 }}
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

      {/* Top Score Banner */}
      <div className="mb-6 h-12 relative shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={showClassicTop ? "classic" : "default"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={animationLevel === "full" ? { type: "spring", stiffness: 300, damping: 30 } : animationLevel === "min" ? { duration: 0.2 } : { duration: 0 }}
            className={`absolute inset-0 flex items-center justify-between px-4 rounded-xl border ${showClassicTop ? "bg-yellow-500/10 border-yellow-500/20" : "bg-blue-500/10 border-blue-500/20"}`}
          >
             <div className="flex items-center gap-3">
                <Trophy size={20} className={showClassicTop ? "text-yellow-500" : "text-blue-500"} />
                <span className={`text-xs font-black uppercase tracking-widest ${showClassicTop ? "text-yellow-200" : "text-blue-200"}`}>
                  TOP 1 {showClassicTop ? (t.modeClassic || "Classic") : (t.modeDefault || "Default")}
                </span>
             </div>
             <div className="flex flex-col items-end">
                <span className={`text-xl font-black italic tabular-nums ${showClassicTop ? "text-yellow-400" : "text-blue-400"}`}>
                   {top1Detail ? top1Detail.score : 0}
                </span>
                {top1Detail && (
                  <div className="flex items-center gap-1 mt-0.5 opacity-80">
                     <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                       top1Detail.difficulty === 'sudden_death' ? 'bg-red-500 text-white' :
                       top1Detail.difficulty === 'hardcode' ? 'bg-orange-500 text-white' :
                       'bg-emerald-500 text-white'
                     }`}>
                       {t[`diff${top1Detail.difficulty === 'sudden_death' ? 'SuddenDeath' : top1Detail.difficulty.charAt(0).toUpperCase() + top1Detail.difficulty.slice(1)}`] || top1Detail.difficulty}
                     </span>
                     
                     <div className="flex gap-0.5">
                       {top1Detail.modifiers.isHidden && <EyeOff size={10} className="text-indigo-400" />}
                       {top1Detail.modifiers.isBlank && <Square size={10} className="text-slate-400" />}
                       {top1Detail.modifiers.isReverse && <ArrowUpCircle size={10} className="text-teal-400" />}
                       
                       {top1Detail.funny?.isReverseControl && <ArrowRightLeft size={10} className="text-lime-400" />}
                       {top1Detail.funny?.isMirror && <FlipVertical size={10} className="text-fuchsia-400" />}
                       {top1Detail.funny?.isInvisible && <Ghost size={10} className="text-stone-400" />}
                     </div>
                  </div>
                )}
             </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
        {/* Game Mode */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.gameMode || "Game Mode"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 flex gap-2">
            <ModeButton 
              active={!isClassic} onClick={() => setIsClassic(false)} 
              icon={Shield} label={t.modeDefault || "Default"} infoKey="modeDefaultDesc" colorClass="bg-blue-600"
              multiplier={`x${GAME_TYPE_MULTIPLIER.default}`}
            />
            <ModeButton 
              active={isClassic} onClick={() => setIsClassic(true)} 
              icon={Heart} label={t.modeClassic || "Classic"} infoKey="modeClassicDesc" colorClass="bg-yellow-600"
              multiplier={`x${GAME_TYPE_MULTIPLIER.classic}`}
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
              multiplier={`x${DIFFICULTY_MULTIPLIER.normal}`}
            />
            <ModeButton 
              active={gameMode === "hardcode"} onClick={() => setGameMode("hardcode")} 
              icon={Zap} label="Hard" infoKey="diffHardcoreDesc" colorClass="bg-orange-600"
              multiplier={`x${DIFFICULTY_MULTIPLIER.hardcode}`}
            />
            <ModeButton 
              active={gameMode === "sudden_death"} onClick={() => setGameMode("sudden_death")} 
              icon={Skull} label="Sudden" infoKey="diffSuddenDeathDesc" colorClass="bg-red-600"
              multiplier={`x${DIFFICULTY_MULTIPLIER.sudden_death}`}
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
              icon={EyeOff} label="Hide.Ball" infoKey="miscHiddenDesc" colorClass="bg-indigo-600"
              multiplier="x1.1"
            />
            <ModeButton 
              active={isBlank} onClick={() => setIsBlank(!isBlank)} 
              icon={Square} label="Blank" infoKey="miscBlankDesc" colorClass="bg-slate-600"
              multiplier="x1.2"
            />
            <ModeButton 
              active={isReverse} onClick={() => setIsReverse(!isReverse)} 
              icon={ArrowUpCircle} label="Rev.Gravity" infoKey="miscReverseDesc" colorClass="bg-teal-600"
              multiplier="x1.3"
            />
            {/* Nút Soon */}
            <div className="py-3 rounded-xl font-bold text-xs uppercase bg-slate-900/50 text-slate-600 border border-white/5 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed overflow-hidden relative">
              <Lock size={12} /> Soon
              <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12" />
            </div>
          </div>
        </section>

        {/* Funny */}
        <section>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t.funny || "Funny"}</h4>
          <div className="bg-white/5 p-2 rounded-2xl border border-white/5 grid grid-cols-3 gap-2">
            <ModeButton 
              active={isReverseControl} onClick={() => setIsReverseControl(!isReverseControl)} 
              icon={ArrowRightLeft} label={t.funnyReverseControl || "Rev. Ctrl"} infoKey="funnyReverseControlDesc" colorClass="bg-lime-600"
              multiplier="x1.1"
            />
            <ModeButton 
              active={isMirror} onClick={() => setIsMirror(!isMirror)} 
              icon={FlipVertical} label={t.funnyMirror || "Mirror"} infoKey="funnyMirrorDesc" colorClass="bg-fuchsia-600"
              multiplier="x1.1"
            />
            <ModeButton 
              active={isInvisible} onClick={() => setIsInvisible(!isInvisible)} 
              icon={Ghost} label={t.funnyInvisible || "Invisible"} infoKey="funnyInvisibleDesc" colorClass="bg-stone-600"
              multiplier="x1.1"
            />
          </div>
        </section>
      </div>

      {/* Play Button */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2 px-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.totalMultiplier || "Total Multiplier"}</span>
          <span className="text-xl font-black text-yellow-400 italic tabular-nums">x{currentMultiplier.toFixed(1)}</span>
        </div>
      <button onClick={() => { playClick(); onPlay(gameMode, isClassic, isAuto); }}
        className="w-full py-5 font-black text-2xl rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all bg-gradient-to-r from-blue-600 to-cyan-600 text-white active:scale-95">
        <Play size={24} fill="currentColor" /> {t.play || "PLAY"}
      </button>
      </div>

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
