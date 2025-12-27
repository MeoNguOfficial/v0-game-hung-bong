import React from "react"
import { motion } from "framer-motion"
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Wind,
  Film,
  Music,
  Globe,
  Activity,
  Disc,
} from "lucide-react"

interface SettingsModalProps {
  t: any
  language: string
  setLanguage: (lang: "en" | "vi" | "es" | "ru") => void
  isMuted: boolean
  toggleMute: () => void
  particlesEnabled: boolean
  toggleParticles: () => void
  trailsEnabled: boolean
  toggleTrails: () => void
  animationLevel: "full" | "min" | "none"
  setAnimationLevel: (level: "full" | "min" | "none") => void
  playClick: () => void
  onClose: () => void
  bgMenuEnabled: boolean
  toggleBgMenu: () => void
  musicVolume: number
  setMusicVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
  sfxVolume: number
  setSfxVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
  sensitivity: number
  setSensitivity: (e: React.ChangeEvent<HTMLInputElement>) => void
  embed?: boolean
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
  animationLevel,
  setAnimationLevel,
  playClick,
  onClose,
  bgMenuEnabled,
  toggleBgMenu,
  musicVolume,
  setMusicVolume,
  sfxVolume,
  setSfxVolume,
  sensitivity,
  setSensitivity,
  embed = false,
}: SettingsModalProps) {
  const Container = embed ? "div" : motion.div
  const wrapperClass = embed ? "w-full h-full" : "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
  const contentClass = embed 
    ? "w-full h-full overflow-y-auto custom-scrollbar p-1" 
    : "bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"

  return (
    <div className={wrapperClass}>
      <Container
        {...(!embed ? {
          initial: { scale: 0.9, opacity: 0, y: 20 },
          animate: { scale: 1, opacity: 1, y: 0 },
          exit: { scale: 0.9, opacity: 0, y: 20 },
          transition: { duration: animationLevel !== 'none' ? 0.2 : 0 }
        } : {})}
        className={contentClass}
      >
        {!embed && (
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{t.settings}</h2>
            <button
              onClick={() => {
                playClick()
                onClose()
              }}
              className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Language */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Globe size={14} /> {t.language}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {(["en", "vi", "es", "ru"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`py-2 rounded-xl font-bold text-sm uppercase transition-all border ${
                    language === lang
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                      : "bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> {t.controls}
            </h3>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold uppercase tracking-wide text-slate-300">{t.sensitivity}</span>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">{sensitivity}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={sensitivity}
                onChange={setSensitivity}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Volume Controls */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Volume2 size={14} /> {t.audio}
            </h3>
            
            {/* Music Volume */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <Music size={18} />
                  <span className="text-sm font-bold uppercase tracking-wide">{t.music}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVolume}
                onChange={setMusicVolume}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* SFX Volume */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-green-400">
                  <Volume2 size={18} />
                  <span className="text-sm font-bold uppercase tracking-wide">{t.sfx}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                  {Math.round(sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sfxVolume}
                onChange={setSfxVolume}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>

            {/* Menu Music Toggle */}
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bgMenuEnabled ? "bg-pink-500/20 text-pink-400" : "bg-slate-700 text-slate-400"}`}>
                  <Disc size={18} className={bgMenuEnabled ? "animate-spin" : ""} style={{ animationDuration: "3s" }} />
                </div>
                <span className="text-sm font-bold text-slate-300 uppercase">
                  {t.menuMusic}
                </span>
              </div>
              <button
                onClick={toggleBgMenu}
                className={`w-12 h-6 rounded-full relative transition-colors ${!bgMenuEnabled ? "bg-slate-600" : "bg-pink-600"}`}
              >
                <motion.div
                  layout
                  transition={{ duration: animationLevel !== 'none' ? 0.2 : 0 }}
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full ${!bgMenuEnabled ? "left-1" : "left-7" }`}
                />
              </button>
            </div>

            {/* Mute Toggle */}
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isMuted ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </div>
                <span className="text-sm font-bold text-slate-300 uppercase">{t.mute}</span>
              </div>
              <button
                onClick={toggleMute}
                className={`w-12 h-6 rounded-full relative transition-colors ${isMuted ? "bg-slate-600" : "bg-green-600"}`}
              >
                <motion.div
                  layout
                  transition={{ duration: animationLevel !== 'none' ? 0.2 : 0 }}
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full ${isMuted ? "left-1" : "left-7" }`}
                />
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} /> {t.visuals}
            </h3>

            {/* Particles Toggle */}
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${particlesEnabled ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700 text-slate-400"}`}>
                  <Sparkles size={18} />
                </div>
                <span className="text-sm font-bold text-slate-300 uppercase">{t.particles}</span>
              </div>
              <button
                onClick={toggleParticles}
                className={`w-12 h-6 rounded-full relative transition-colors ${!particlesEnabled ? "bg-slate-600" : "bg-blue-600"}`}
              >
                <motion.div
                  layout
                  transition={{ duration: animationLevel !== 'none' ? 0.2 : 0 }}
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full ${!particlesEnabled ? "left-1" : "left-7" }`}
                />
              </button>
            </div>

            {/* Trails Toggle */}
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${trailsEnabled ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-slate-400"}`}>
                  <Wind size={18} />
                </div>
                <span className="text-sm font-bold text-slate-300 uppercase">{t.trails}</span>
              </div>
              <button
                onClick={toggleTrails}
                className={`w-12 h-6 rounded-full relative transition-colors ${!trailsEnabled ? "bg-slate-600" : "bg-blue-600"}`}
              >
                <motion.div
                  layout
                  transition={{ duration: animationLevel !== 'none' ? 0.2 : 0 }}
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full ${!trailsEnabled ? "left-1" : "left-7" }`}
                />
              </button>
            </div>

            {/* Animations Toggle */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Film size={14} /> {t.animationLevel || "Animation Level"}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(["full", "min", "none"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setAnimationLevel(level)}
                    className={`py-2 rounded-xl font-bold text-sm uppercase transition-all border ${
                      animationLevel === level
                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                        : "bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700"
                    }`}
                  >
                    {t[`anim${level.charAt(0).toUpperCase() + level.slice(1)}`] || level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
