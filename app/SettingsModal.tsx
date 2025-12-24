import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Globe,
  ChevronDown,
  VolumeX,
  Volume2,
  Sparkles,
  Wind,
  Film,
  Bug,
  ExternalLink,
} from "lucide-react"

interface SettingsModalProps {
  t: any
  language: "en" | "vi" | "es" | "ru"
  setLanguage: (lang: "en" | "vi" | "es" | "ru") => void
  isMuted: boolean
  toggleMute: () => void
  particlesEnabled: boolean
  toggleParticles: () => void
  trailsEnabled: boolean
  toggleTrails: () => void
  animationsEnabled: boolean
  toggleAnimations: () => void
  onClose: () => void
}

export default function SettingsModal({
  t,
  language,
  setLanguage,
  isMuted,
  toggleMute,
  particlesEnabled,
  toggleParticles,
  trailsEnabled,
  toggleTrails,
  animationsEnabled,
  toggleAnimations,
  onClose,
}: SettingsModalProps) {
  const [showLangMenu, setShowLangMenu] = useState(false)

  const handleLanguageChange = (lang: "en" | "vi" | "es" | "ru") => {
    setLanguage(lang)
    setShowLangMenu(false)
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={animationsEnabled ? { type: "spring", damping: 25 } : { duration: 0 }}
      className="absolute inset-0 z-[80] bg-slate-900 p-8 flex flex-col border-t-4 border-blue-600 rounded-t-[3rem]"
    >
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.settings}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={32} />
        </button>
      </div>
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="flex flex-col bg-white/5 p-6 rounded-[2rem] border border-white/5 transition-all">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-cyan-400" />
              <span className="text-white font-bold uppercase tracking-widest text-xs">{t.language}</span>
            </div>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-white/10 hover:bg-slate-700 transition-colors"
            >
              <span className="text-xs font-black text-white uppercase">{language}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showLangMenu ? "rotate-180" : ""}`} />
            </button>
          </div>
          
          <AnimatePresence>
            {showLangMenu && (
              <motion.div 
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={animationsEnabled ? { duration: 0.2 } : { duration: 0 }}
                className="overflow-hidden w-full grid grid-cols-2 gap-2"
              >
                {['en', 'vi', 'es', 'ru'].map((lang) => (
                   <button 
                     key={lang} 
                     onClick={() => handleLanguageChange(lang as any)}
                     className={`p-3 rounded-xl text-xs font-black uppercase border transition-colors ${language === lang ? "bg-cyan-600 text-white border-cyan-500" : "bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700"}`}
                   >
                     {lang === 'en' ? 'English' : lang === 'vi' ? 'Tiếng Việt' : lang === 'es' ? 'Español' : 'Русский'}
                   </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-3">
            {isMuted ? <VolumeX className="text-red-500" /> : <Volume2 className="text-green-500" />}
            <span className="text-white font-bold uppercase tracking-widest text-xs">{t.audioEffects}</span>
          </div>
          <button
            onClick={toggleMute}
            className={`w-16 h-9 rounded-full relative transition-colors ${isMuted ? "bg-slate-700" : "bg-green-600"}`}
          >
            <motion.div
              layout
              transition={animationsEnabled ? undefined : { duration: 0 }}
              className={`absolute top-1.5 w-6 h-6 bg-white rounded-full ${isMuted ? "left-2" : "left-8"}`}
            />
          </button>
        </div>
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className={particlesEnabled ? "text-yellow-400" : "text-slate-500"} />
            <span className="text-white font-bold uppercase tracking-widest text-xs">{t.particles}</span>
          </div>
          <button
            onClick={toggleParticles}
            className={`w-16 h-9 rounded-full relative transition-colors ${!particlesEnabled ? "bg-slate-700" : "bg-blue-600"}`}
          >
            <motion.div
              layout
              transition={animationsEnabled ? undefined : { duration: 0 }}
              className={`absolute top-1.5 w-6 h-6 bg-white rounded-full ${!particlesEnabled ? "left-2" : "left-8"}`}
            />
          </button>
        </div>
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-3">
            <Wind size={20} className={trailsEnabled ? "text-blue-400" : "text-slate-500"} />
            <span className="text-white font-bold uppercase tracking-widest text-xs">{t.ballTrails}</span>
          </div>
          <button
            onClick={toggleTrails}
            className={`w-16 h-9 rounded-full relative transition-colors ${!trailsEnabled ? "bg-slate-700" : "bg-blue-600"}`}
          >
            <motion.div
              layout
              transition={animationsEnabled ? undefined : { duration: 0 }}
              className={`absolute top-1.5 w-6 h-6 bg-white rounded-full ${!trailsEnabled ? "left-2" : "left-8"}`}
            />
          </button>
        </div>
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5">
          <div className="flex items-center gap-3">
            <Film size={20} className={animationsEnabled ? "text-purple-400" : "text-slate-500"} />
            <span className="text-white font-bold uppercase tracking-widest text-xs">{t.transitions}</span>
          </div>
          <button
            onClick={toggleAnimations}
            className={`w-16 h-9 rounded-full relative transition-colors ${!animationsEnabled ? "bg-slate-700" : "bg-blue-600"}`}
          >
            <motion.div
              layout
              transition={animationsEnabled ? undefined : { duration: 0 }}
              className={`absolute top-1.5 w-6 h-6 bg-white rounded-full ${!animationsEnabled ? "left-2" : "left-8"}`}
            />
          </button>
        </div>
        {/* Report Issue Button */}
        <a
          href="https://github.com/MeoNguOfficial/v0-game-hung-bong/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bug size={20} className="text-red-400" />
            <span className="text-white font-bold uppercase tracking-widest text-xs">{t.reportIssue}</span>
          </div>
          <ExternalLink size={20} className="text-slate-500" />
        </a>
      </div>
    </motion.div>
  )
}
