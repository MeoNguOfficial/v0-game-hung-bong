"use client"
import { motion } from "framer-motion"
import { X, Volume2, VolumeX, Wind, Sparkles } from "lucide-react"

const modalVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
    },
  },
  exit: {
    scale: 0.5,
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

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
  animationsEnabled?: boolean
  toggleAnimations?: () => void
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
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-500 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{t.settings}</h2>
          <button onClick={onClose} className="p-2 hover:bg-purple-500/20 rounded-lg transition">
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Language */}
          <div className="bg-slate-800/50 p-4 rounded-xl">
            <span className="text-white font-bold uppercase tracking-widest text-xs block mb-3">Language</span>
            <div className="grid grid-cols-4 gap-2">
              {["en", "vi", "es", "ru"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang as "en" | "vi" | "es" | "ru")}
                  className={`py-2 rounded-lg font-bold uppercase text-xs transition ${
                    language === lang ? "bg-purple-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Audio */}
          <div className="bg-slate-800/50 p-4 rounded-xl">
            <button
              onClick={toggleMute}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 rounded-lg transition"
            >
              <span className="text-white font-bold uppercase tracking-widest text-xs">{t.audio}</span>
              {isMuted ? (
                <VolumeX size={20} className="text-red-400" />
              ) : (
                <Volume2 size={20} className="text-green-400" />
              )}
            </button>
          </div>

          {/* Particles */}
          <div className="bg-slate-800/50 p-4 rounded-xl">
            <button
              onClick={toggleParticles}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 rounded-lg transition"
            >
              <span className="text-white font-bold uppercase tracking-widest text-xs">{t.particles}</span>
              {particlesEnabled ? (
                <Sparkles size={20} className="text-blue-400" />
              ) : (
                <Sparkles size={20} className="text-slate-500" />
              )}
            </button>
          </div>

          {/* Trails */}
          <div className="bg-slate-800/50 p-4 rounded-xl">
            <button
              onClick={toggleTrails}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 rounded-lg transition"
            >
              <span className="text-white font-bold uppercase tracking-widest text-xs">{t.trails}</span>
              {trailsEnabled ? (
                <Wind size={20} className="text-cyan-400" />
              ) : (
                <Wind size={20} className="text-slate-500" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold uppercase tracking-widest rounded-lg transition"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}
