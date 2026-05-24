import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Wind,
  Film,
  Music,
  Globe,
  Zap,
  Activity,
  Disc,
  Bug,
  Trash2,
  AlertTriangle,
  Sliders,
} from "lucide-react"

interface SettingsModalProps {
  t: any
  language: string
  setLanguage: (lang: "en" | "vi" | "es" | "ru") => void
  isMuted: boolean
  toggleMute: () => void
  showFPS: boolean
  toggleFPS: () => void
  particlesEnabled: boolean
  toggleParticles: () => void
  trailsEnabled: boolean
  toggleTrails: () => void
  shockwavesEnabled: boolean
  toggleShockwaves: () => void
  cameraShakeEnabled: boolean
  toggleCameraShake: () => void
  animationLevel: "full" | "min" | "none"
  setAnimationLevel: (level: "full" | "min" | "none") => void
  playClick: () => void
  onClose: () => void
  bgMenuEnabled: boolean
  toggleBgMenu: () => void
  menuMusicVolume: number
  setMenuMusicVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
  gameMusicVolume: number
  setGameMusicVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
  sfxVolume: number
  setSfxVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
  sensitivity: number
  setSensitivity: (e: React.ChangeEvent<HTMLInputElement>) => void
  baseGameSpeed: number
  setBaseGameSpeed: (e: React.ChangeEvent<HTMLInputElement>) => void
  maxFPS: number
  setMaxFPS: (e: React.ChangeEvent<HTMLInputElement>) => void
  clearCache?: () => Promise<void>
  gameState?: "start" | "countdown" | "running" | "paused" | "over" | "dev_paused"
  openSettingsFromPause?: boolean
  embed?: boolean
  hideSystem?: boolean
}

export default function SettingsModal({
  t,
  language,
  setLanguage,
  isMuted,
  toggleMute,
  showFPS,
  toggleFPS,
  particlesEnabled,
  toggleParticles,
  trailsEnabled,
  toggleTrails,
  shockwavesEnabled,
  toggleShockwaves,
  cameraShakeEnabled,
  toggleCameraShake,
  animationLevel,
  setAnimationLevel,
  playClick,
  onClose,
  bgMenuEnabled,
  toggleBgMenu,
  menuMusicVolume,
  setMenuMusicVolume,
  gameMusicVolume,
  setGameMusicVolume,
  sfxVolume,
  setSfxVolume,
  sensitivity,
  setSensitivity,
  baseGameSpeed,
  setBaseGameSpeed,
  maxFPS,
  setMaxFPS,
  clearCache,
  gameState = "start",
  openSettingsFromPause = false,
  embed = false,
  hideSystem = false,
}: SettingsModalProps) {
  const Container = embed ? "div" : motion.div
  const wrapperClass = embed 
    ? "w-full h-full" 
    : "fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 md:p-6"
  
  // Mở rộng kích thước Modal trên PC để hiển thị dạng lưới ngang tuyệt đẹp
  const contentClass = embed
    ? "w-full h-full flex flex-col overflow-hidden"
    : "bg-slate-900 border border-slate-800 w-full max-w-[94%] xl:max-w-[1200px] rounded-[2rem] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"

  const [showResetConfirm, setShowResetConfirm] = React.useState(false)
  const [resetComplete, setResetComplete] = React.useState(false)

  const handleResetData = () => {
    localStorage.clear()
    setResetComplete(true)
  }

  const isMenuMusicDisabled = isMuted || !bgMenuEnabled
  const isGameMusicDisabled = isMuted
  const isSfxDisabled = isMuted

  return (
    <div className={wrapperClass}>
      <Container
        {...(!embed ? {
          initial: { scale: 0.95, opacity: 0, y: 15 },
          animate: { scale: 1, opacity: 1, y: 0 },
          exit: { scale: 0.95, opacity: 0, y: 15 },
          transition: animationLevel === "full"
            ? { type: "spring", stiffness: 350, damping: 26 }
            : { duration: animationLevel === "min" ? 0.2 : 0 }
        } : {})}
        className={contentClass}
      >
        {/* Tiêu đề Modal phía trên */}
        {!embed && (
          <div className="flex justify-between items-center p-6 pb-4 shrink-0 bg-slate-900 z-10 border-b border-white/5">
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{t.settings}</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Global Configuration Portal</p>
            </div>
            <button
              onClick={() => {
                playClick()
                onClose()
              }}
              className="bg-slate-800 p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {embed && !hideSystem && (
          <div className="flex justify-between items-center mb-4 shrink-0 pt-1 px-1">
            <h3 className="text-2xl font-black text-white italic tracking-tighter">{t.settings}</h3>
          </div>
        )}

        {/* Khu vực nội dung cuộn */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${embed ? "p-1" : "p-6 pt-4"}`}>
          
          {/* LƯỚI GRID PHẢN HỒI: 
              - Mobile: 1 cột cuộn xếp chồng dọc
              - Tablet (md): 2 cột 
              - PC (lg/xl): 4 cột ngang x 2 hàng ngang hoàn mỹ theo sơ đồ của bạn */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pb-4">

            {/* BOX 1: NGÔN NGỮ */}
            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe size={15} className="text-cyan-400" /> {t.language}
                </h3>
                {/* Viền Line Xanh Lục tinh tế dưới tiêu đề */}
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-2">
                  {(["en", "vi", "es", "ru"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`py-2.5 rounded-xl font-bold text-xs uppercase transition-all border ${
                        language === lang
                          ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                          : "bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {lang === "vi" ? "Tiếng Việt" : lang === "en" ? "English" : lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BOX 2: ĐỒ HỌA VÀ HÌNH ẢNH */}
            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={15} className="text-yellow-400" /> {t.visuals || "Visuals"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-2.5">
                {/* Particles Toggle */}
                <div className="flex justify-between items-center bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.particles}</span>
                  <button
                    onClick={toggleParticles}
                    className={`w-10 h-5 rounded-full relative transition-colors ${particlesEnabled ? "bg-blue-600" : "bg-slate-700"}`}
                  >
                    <motion.div
                      layout
                      transition={{ duration: 0.15 }}
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full ${particlesEnabled ? "left-5.5" : "left-0.5"}`}
                    />
                  </button>
                </div>

                {/* Trails Toggle */}
                <div className="flex justify-between items-center bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.trails}</span>
                  <button
                    onClick={toggleTrails}
                    className={`w-10 h-5 rounded-full relative transition-colors ${trailsEnabled ? "bg-blue-600" : "bg-slate-700"}`}
                  >
                    <motion.div
                      layout
                      transition={{ duration: 0.15 }}
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full ${trailsEnabled ? "left-5.5" : "left-0.5"}`}
                    />
                  </button>
                </div>

                {/* Shockwaves Toggle */}
                <div className="flex justify-between items-center bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.shockwaves}</span>
                  <button
                    onClick={toggleShockwaves}
                    className={`w-10 h-5 rounded-full relative transition-colors ${shockwavesEnabled ? "bg-cyan-600" : "bg-slate-700"}`}
                  >
                    <motion.div
                      layout
                      transition={{ duration: 0.15 }}
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full ${shockwavesEnabled ? "left-5.5" : "left-0.5"}`}
                    />
                  </button>
                </div>

                {/* Camera Shake Toggle */}
                <div className="flex justify-between items-center bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.cameraShake}</span>
                  <button
                    onClick={toggleCameraShake}
                    className={`w-10 h-5 rounded-full relative transition-colors ${cameraShakeEnabled ? "bg-orange-600" : "bg-slate-700"}`}
                  >
                    <motion.div
                      layout
                      transition={{ duration: 0.15 }}
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full ${cameraShakeEnabled ? "left-5.5" : "left-0.5"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* BOX 3: ÂM THANH */}
            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px] lg:col-span-1">
              <div className="mb-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Volume2 size={15} className="text-green-400" /> {t.audio}
                  </h3>
                  {/* Quick Mute Indicator */}
                  <button onClick={toggleMute} className={`p-1 rounded text-xs ${isMuted ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"}`}>
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                </div>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-between space-y-2">
                {/* Menu Music Slider */}
                <div className={`transition-opacity ${isMenuMusicDisabled ? "opacity-30" : "opacity-100"}`}>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                    <span>{t.menuMusic}</span>
                    <span>{Math.round(menuMusicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    disabled={isMenuMusicDisabled}
                    value={menuMusicVolume}
                    onChange={setMenuMusicVolume}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 touch-action-pan-y"
                  />
                </div>

                {/* Game Music Slider */}
                <div className={`transition-opacity ${isGameMusicDisabled ? "opacity-30" : "opacity-100"}`}>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                    <span>{t.gameMusic || "Game Music"}</span>
                    <span>{Math.round(gameMusicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    disabled={isGameMusicDisabled}
                    value={gameMusicVolume}
                    onChange={setGameMusicVolume}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 touch-action-pan-y"
                  />
                </div>

                {/* SFX Volume Slider */}
                <div className={`transition-opacity ${isSfxDisabled ? "opacity-30" : "opacity-100"}`}>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                    <span>{t.sfx}</span>
                    <span>{Math.round(sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    disabled={isSfxDisabled}
                    value={sfxVolume}
                    onChange={setSfxVolume}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500 touch-action-pan-y"
                  />
                </div>
              </div>
            </div>

            {/* BOX 4: GAMEPLAY */}
            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={15} className="text-purple-400" /> Gameplay
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-around">
                {/* Sensitivity Input */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                    <span>{t.sensitivity}</span>
                    <span className="font-mono bg-slate-900 px-1.5 py-0.2 rounded">{sensitivity}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={sensitivity}
                    onChange={setSensitivity}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-action-pan-y"
                  />
                </div>

                {/* Base Game Speed Input */}
                {!openSettingsFromPause && (
                  <div className="border-t border-white/5 pt-2 mt-2">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                      <span className={gameState === "running" ? "text-slate-500" : ""}>{t.baseGameSpeed}</span>
                      <span className="font-mono bg-slate-900 px-1.5 py-0.2 rounded">{(baseGameSpeed / 100).toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={baseGameSpeed}
                      onChange={setBaseGameSpeed}
                      disabled={gameState === "running"}
                      className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none accent-purple-500 touch-action-pan-y ${
                        gameState === "running" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* BOX 5: THÔNG SỐ */}
            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={15} className="text-emerald-400" /> {t.parameters || "Thông số"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-4">
                {/* Show FPS Toggle */}
                <div className="flex justify-between items-center bg-slate-900/40 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.showFPS}</span>
                  <button
                    onClick={toggleFPS}
                    className={`w-10 h-5 rounded-full relative transition-colors ${showFPS ? "bg-emerald-600" : "bg-slate-700"}`}
                  >
                    <motion.div
                      layout
                      transition={{ duration: 0.15 }}
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full ${showFPS ? "left-5.5" : "left-0.5"}`}
                    />
                  </button>
                </div>

                {/* Max FPS Config */}
                {!openSettingsFromPause && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                      <span>{t.maxFPS}</span>
                      <span className="font-mono bg-slate-900 px-1.5 py-0.2 rounded">
                        {maxFPS === -1 ? t.unlimited : `${maxFPS} FPS`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max="240"
                      step="1"
                      value={maxFPS}
                      onChange={setMaxFPS}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 touch-action-pan-y"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* BOX 6: HOẠT HÌNH */}
            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Film size={15} className="text-indigo-400" /> {t.animationLevel || "Hoạt hình"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex flex-col gap-2">
                  {(["full", "min", "none"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setAnimationLevel(level)}
                      className={`py-2 rounded-xl font-bold text-xs uppercase transition-all border ${
                        animationLevel === level
                          ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                          : "bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800"
                      }`}
                    >
                      {t[`anim${level.charAt(0).toUpperCase() + level.slice(1)}`] || level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BOX 7: KHÁC */}
            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Bug size={15} className="text-blue-400" /> Khác
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-3">
                {/* Report Bug */}
                <button
                  onClick={() => window.open("https://github.com/MeoNguOfficial/v0-game-hung-bong/issues", "_blank")}
                  className="w-full flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors text-left"
                >
                  <span className="text-[10px] font-black text-slate-300 uppercase">{t.reportBug || "Report Bug"}</span>
                  <Bug size={14} className="text-orange-400" />
                </button>

                {/* Clear Cache */}
                {clearCache && (
                  <button
                    onClick={clearCache}
                    className="w-full flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase">{t.clearCache || "Clear Cache"}</span>
                      <span className="text-[8px] text-slate-500 block">Fetch latest assets</span>
                    </div>
                    <Trash2 size={14} className="text-cyan-400" />
                  </button>
                )}
              </div>
            </div>

            {/* BOX 8: HỆ THỐNG */}
            <div className="bg-slate-800/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-400" /> Hệ thống
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {!hideSystem && (
                  <div className="bg-slate-900/40 p-2 rounded-xl border border-white/5">
                    <AnimatePresence mode="wait">
                      {!showResetConfirm && !resetComplete && (
                        <motion.button
                          key="reset-btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowResetConfirm(true)}
                          className="w-full flex items-center justify-between p-2 hover:bg-red-500/5 rounded-lg transition-colors"
                        >
                          <span className="text-[10px] font-black text-red-400 uppercase">{t.resetData || "Reset Data"}</span>
                          <Trash2 size={14} className="text-red-400" />
                        </motion.button>
                      )}

                      {showResetConfirm && !resetComplete && (
                        <motion.div
                          key="reset-confirm"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-2 text-center"
                        >
                          <p className="text-[9px] text-red-400 font-bold leading-tight">
                            {t.resetConfirmText || "Delete all data?"}
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setShowResetConfirm(false)}
                              className="flex-1 py-1 rounded bg-slate-700 text-white font-bold text-[9px] uppercase"
                            >
                              {t.cancel || "No"}
                            </button>
                            <button
                              onClick={handleResetData}
                              className="flex-1 py-1 rounded bg-red-600 text-white font-bold text-[9px] uppercase"
                            >
                              {t.confirm || "Yes"}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {resetComplete && (
                        <motion.div
                          key="reset-complete"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center"
                        >
                          <p className="text-[10px] text-green-400 font-bold mb-1">
                            {t.resetComplete || "Cleared!"}
                          </p>
                          <button
                            onClick={() => window.location.reload()}
                            className="w-full py-1.5 rounded bg-blue-600 text-white font-bold text-[9px] uppercase hover:bg-blue-500"
                          >
                            {t.restartNow || "Restart"}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </Container>
    </div>
  )
}