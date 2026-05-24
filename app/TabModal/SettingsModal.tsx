import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Film,
  Globe,
  Activity,
  Bug,
  Trash2,
  AlertTriangle,
  Sliders,
  Settings,
} from "lucide-react"

// Định nghĩa 10 ngôn ngữ được hỗ trợ
type SupportedLanguage = "en" | "vi" | "es" | "ru" | "zh" | "ko" | "ja" | "id" | "fr" | "de"

interface SettingsModalProps {
  t: any
  language: string
  setLanguage: (lang: SupportedLanguage) => void
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
  gameMusicEnabled?: boolean
  toggleGameMusic?: () => void
  sfxEnabled?: boolean
  toggleSfx?: () => void
  gameMusicVolume: number
  setGameMusicVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
  sfxVolume: number
  setSfxVolume: (e: React.ChangeEvent<HTMLInputElement>) => void
  sensitivity: number
  setSensitivity: (e: React.ChangeEvent<HTMLInputElement>) => void
  baseGameSpeed: number
  setBaseGameSpeed: (e: React.ChangeEvent<HTMLInputElement>) => void
  rawInput: boolean
  toggleRawInput: () => void
  maxFPS: number
  setMaxFPS: (e: React.ChangeEvent<HTMLInputElement>) => void
  freezeEffect?: "spread" | "simple" | "none"
  setFreezeEffect?: (effect: "spread" | "simple" | "none") => void
  clearCache?: () => Promise<void>
  gameState?: "start" | "countdown" | "running" | "paused" | "over" | "dev_paused"
  openSettingsFromPause?: boolean
  embed?: boolean
  hideSystem?: boolean
}

type TabType = "language" | "visuals" | "audio" | "controls" | "parameters" | "animation" | "others" | "system"

// Khai báo cấu trúc dữ liệu ngôn ngữ rõ ràng để tối ưu hóa render "mix"
interface LanguageOption {
  code: SupportedLanguage
  flag: string
  label: string
}

const LANGUAGES_LIST: LanguageOption[] = [
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
  { code: "en", flag: "UK", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "zh", flag: "🇨🇳", label: "简体中文" },
  { code: "ko", flag: "🇰🇷", label: "한국어" },
  { code: "ja", flag: "🇯🇵", label: "日本語" },
  { code: "id", flag: "🇮🇩", label: "Indonesia" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
]

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
  gameMusicEnabled = true,
  toggleGameMusic = () => {},
  sfxEnabled = true,
  toggleSfx = () => {},
  gameMusicVolume,
  setGameMusicVolume,
  sfxVolume,
  setSfxVolume,
  sensitivity,
  setSensitivity,
  baseGameSpeed,
  setBaseGameSpeed,
  rawInput,
  toggleRawInput,
  maxFPS,
  setMaxFPS,
  freezeEffect = "spread",
  setFreezeEffect = () => {},
  clearCache,
  gameState = "start",
  openSettingsFromPause = false,
  embed = false,
  hideSystem = false,
}: SettingsModalProps) {
  const Wrapper = embed ? "div" : motion.div
  const Container = embed ? "div" : motion.div

  const wrapperClass = embed
    ? "w-full h-full"
    : "fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-6"

  const contentClass = embed
    ? "w-full h-full flex flex-col overflow-hidden"
    : "bg-slate-955 border border-slate-800/80 w-full max-w-[96%] xl:max-w-[1100px] rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"

  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("language")

  const handleResetData = () => {
    localStorage.clear()
    setResetComplete(true)
  }

  const getSpeedRank = (val: number) => {
    if (val <= 100) return t.speedBeginner
    if (val <= 150) return t.speedAmateur
    if (val <= 200) return t.speedSemiPro
    if (val <= 250) return t.speedProfessional
    if (val <= 300) return t.speedMaster
    if (val <= 350) return t.speedGrandmaster
    if (val <= 400) return t.speedChallenger
    if (val <= 450) return t.speedLegend
    return t.speedInfinite
  }

  const isMenuMusicDisabled = isMuted || !bgMenuEnabled
  const isGameMusicDisabled = isMuted || !gameMusicEnabled
  const isSfxDisabled = isMuted || !sfxEnabled

  const tabsList = [
    { id: "language" as TabType, label: t.language || "Ngôn ngữ", icon: Globe, color: "text-cyan-400", border: "border-cyan-500/30" },
    { id: "visuals" as TabType, label: t.visuals || "Hình ảnh", icon: Sparkles, color: "text-yellow-400", border: "border-yellow-500/30" },
    { id: "audio" as TabType, label: t.audio || "Âm thanh", icon: Volume2, color: "text-emerald-400", border: "border-emerald-500/30" },
    { id: "controls" as TabType, label: t.controls || "Điều khiển", icon: Activity, color: "text-purple-400", border: "border-purple-500/30" },
    { id: "parameters" as TabType, label: t.parameters || "Thông số", icon: Sliders, color: "text-blue-400", border: "border-blue-500/30" },
    { id: "animation" as TabType, label: t.animationLevel || "Hoạt hình", icon: Film, color: "text-indigo-400", border: "border-indigo-500/30" },
    { id: "others" as TabType, label: t.others || "Khác", icon: Bug, color: "text-pink-400", border: "border-pink-500/30" },
    ...(!hideSystem ? [{ id: "system" as TabType, label: t.system || "Hệ thống", icon: AlertTriangle, color: "text-red-400", border: "border-red-500/30" }] : [])
  ]

  const renderTabContent = (tab: TabType) => {
    switch (tab) {
      case "language":
        return (
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                {t.languageDesc || "Chọn ngôn ngữ hiển thị trong trò chơi. Các thay đổi sẽ được áp dụng ngay lập tức."}
              </p>
              {/* Lưới chọn ngôn ngữ chuẩn "Mix" trên Desktop (Cờ bên trái, Tên bên phải) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LANGUAGES_LIST.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      playClick()
                      setLanguage(item.code)
                    }}
                    className={`py-3.5 px-4 rounded-2xl font-bold transition-all border flex items-center gap-3 ${
                      language === item.code
                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30 scale-[1.02]"
                        : "bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800/80 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-2xl leading-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{item.flag}</span>
                    <span className="text-xs sm:text-sm tracking-wide text-left">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 italic mt-6">
              * Support multilingual dynamic routing translation.
            </div>
          </div>
        )
      case "visuals":
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t.visualsDesc || "Tinh chỉnh các hiệu ứng đồ họa để có trải nghiệm chơi game tối ưu và đẹp mắt nhất."}
            </p>
            {/* Particles Toggle */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.particles || "Hạt hiệu ứng"}</span>
                <span className="text-[10px] text-slate-500">{t.particlesInfo || "Hiệu ứng hạt bay xung quanh bóng"}</span>
              </div>
              <button
                onClick={() => { playClick(); toggleParticles(); }}
                className={`w-12 h-6 rounded-full relative transition-colors ${particlesEnabled ? "bg-blue-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${particlesEnabled ? "left-[28px]" : "left-1"}`} />
              </button>
            </div>

            {/* Trails Toggle */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.trails || "Vệt sáng"}</span>
                <span className="text-[10px] text-slate-500">{t.trailsInfo || "Vệt sáng chuyển động kéo dài phía sau bóng"}</span>
              </div>
              <button
                onClick={() => { playClick(); toggleTrails(); }}
                className={`w-12 h-6 rounded-full relative transition-colors ${trailsEnabled ? "bg-blue-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${trailsEnabled ? "left-[28px]" : "left-1"}`} />
              </button>
            </div>

            {/* Shockwaves Toggle */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.shockwaves || "Sóng kích"}</span>
                <span className="text-[10px] text-slate-500">{t.shockwavesInfo || "Tạo hiệu ứng sóng rung kích khi bóng va chạm"}</span>
              </div>
              <button
                onClick={() => { playClick(); toggleShockwaves(); }}
                className={`w-12 h-6 rounded-full relative transition-colors ${shockwavesEnabled ? "bg-cyan-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shockwavesEnabled ? "left-[28px]" : "left-1"}`} />
              </button>
            </div>

            {/* Freeze Effect Type */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.freezeEffect || "Hiệu ứng đóng băng"}</span>
                <span className="text-[10px] text-slate-500">{t.freezeEffectInfo || "Chọn kiểu xuất hiện của lớp phủ đóng băng"}</span>
              </div>
              <div className="flex p-1 bg-slate-800 rounded-xl border border-white/5">
                <button
                  onClick={() => { playClick(); setFreezeEffect("spread"); }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    freezeEffect === "spread" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t.effectSpread || "Lan tỏa"}
                </button>
                <button
                  onClick={() => { playClick(); setFreezeEffect("simple"); }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    freezeEffect === "simple" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t.effectSimple || "Đơn giản"}
                </button>
                <button
                  onClick={() => { playClick(); setFreezeEffect("none"); }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    freezeEffect === "none" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t.effectNone || "Không dùng"}
                </button>
              </div>
            </div>

            {/* Camera Shake Toggle */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.cameraShake || "Rung màn hình"}</span>
                <span className="text-[10px] text-slate-500">{t.cameraShakeInfo || "Màn hình rung lắc nhẹ khi bóng nảy mạnh"}</span>
              </div>
              <button
                onClick={() => { playClick(); toggleCameraShake(); }}
                className={`w-12 h-6 rounded-full relative transition-colors ${cameraShakeEnabled ? "bg-orange-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cameraShakeEnabled ? "left-[28px]" : "left-1"}`} />
              </button>
            </div>
          </div>
        )
      case "audio":
        return (
          <div className="space-y-5">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t.audioDesc || "Điều chỉnh âm lượng nhạc nền menu, nhạc nền game và các hiệu ứng âm thanh."}
            </p>
            {/* Menu Music Slider */}
            <div className={`bg-slate-900/60 p-4 rounded-2xl border border-white/5 transition-opacity ${isMenuMusicDisabled ? "opacity-30" : "opacity-100"}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => { playClick(); toggleBgMenu(); }} className={`transition-colors p-1.5 rounded bg-slate-800 ${bgMenuEnabled && !isMuted ? "text-purple-400" : "text-slate-500"}`}>
                    {bgMenuEnabled && !isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <span className="text-xs font-bold text-slate-200 uppercase">{t.menuMusic || "Nhạc Menu"}</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">{Math.round(menuMusicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={isMenuMusicDisabled}
                value={menuMusicVolume}
                onChange={setMenuMusicVolume}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 touch-action-pan-y"
              />
            </div>

            {/* Game Music Slider */}
            <div className={`bg-slate-900/60 p-4 rounded-2xl border border-white/5 transition-opacity ${isGameMusicDisabled ? "opacity-30" : "opacity-100"}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => { playClick(); toggleGameMusic(); }} className={`transition-colors p-1.5 rounded bg-slate-800 ${gameMusicEnabled && !isMuted ? "text-indigo-400" : "text-slate-500"}`}>
                    {gameMusicEnabled && !isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <span className="text-xs font-bold text-slate-200 uppercase">{t.gameMusic || "Nhạc Game"}</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400">{Math.round(gameMusicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={isGameMusicDisabled}
                value={gameMusicVolume}
                onChange={setGameMusicVolume}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 touch-action-pan-y"
              />
            </div>

            {/* SFX Volume Slider */}
            <div className={`bg-slate-900/60 p-4 rounded-2xl border border-white/5 transition-opacity ${isSfxDisabled ? "opacity-30" : "opacity-100"}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => { playClick(); toggleSfx(); }} className={`transition-colors p-1.5 rounded bg-slate-800 ${sfxEnabled && !isMuted ? "text-green-400" : "text-slate-500"}`}>
                    {sfxEnabled && !isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <span className="text-xs font-bold text-slate-200 uppercase">{t.sfx || "Hiệu ứng"}</span>
                </div>
                <span className="text-xs font-mono font-bold text-green-400">{Math.round(sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={isSfxDisabled}
                value={sfxVolume}
                onChange={setSfxVolume}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500 touch-action-pan-y"
              />
            </div>
          </div>
        )
      case "controls":
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t.controlsDesc || "Điều chỉnh độ nhạy khi di chuyển thanh đỡ bóng và cấu hình tốc độ ban đầu."}
            </p>
            {/* Sensitivity Input */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.sensitivity || "Độ nhạy"}</span>
                  <span className="text-[10px] text-slate-500">{t.sensitivityInfo || "Độ nhạy của chuột, phím hoặc thao tác vuốt cảm ứng"}</span>
                </div>
                <span className="font-mono text-sm font-bold bg-slate-950 px-3 py-1 rounded text-blue-400 border border-white/5">{sensitivity}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={sensitivity}
                onChange={setSensitivity}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-action-pan-y"
              />
            </div>

            {/* Base Game Speed Input */}
            {!openSettingsFromPause && (
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wide block ${gameState === "running" ? "text-slate-500" : "text-slate-200"}`}>
                      {t.baseGameSpeed || "Tốc độ cơ bản"}
                    </span>
                    <span className="text-[10px] text-slate-500">{t.baseSpeedInfo || "Tốc độ di chuyển ban đầu của bóng"}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm font-bold bg-slate-950 px-3 py-1 rounded text-purple-400 border border-white/5">
                      {(baseGameSpeed / 100).toFixed(2)}x
                    </span>
                    <span className="text-[9px] font-black text-purple-500 uppercase mt-1 tracking-wider">{getSpeedRank(baseGameSpeed)}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="50"
                  value={baseGameSpeed}
                  onChange={setBaseGameSpeed}
                  disabled={gameState === "running"}
                  className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-purple-500 touch-action-pan-y ${
                    gameState === "running" ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                  }`}
                />
                {gameState === "running" && (
                  <p className="text-[9px] text-yellow-500/80 mt-1">{t.speedLockedNote || "* Không thể thay đổi khi trận đấu đang diễn ra"}</p>
                )}
              </div>
            )}

            {/* Raw Input Toggle */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.rawInput || "Raw Input (PC)"}</span>
                <span className="text-[10px] text-slate-500">{t.rawInputInfo || "Lấy dữ liệu chuột trực tiếp qua Pointer Lock"}</span>
              </div>
              <button onClick={() => { playClick(); toggleRawInput(); }} className={`w-12 h-6 rounded-full relative transition-colors ${rawInput ? "bg-blue-600" : "bg-slate-700"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${rawInput ? "left-[28px]" : "left-1"}`} />
              </button>
            </div>
          </div>
        )
      case "parameters":
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t.paramsDesc || "Theo dõi các thông số kỹ thuật tối ưu và giới hạn tốc độ hiển thị khung hình."}
            </p>
            {/* Show FPS Toggle */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.showFPS || "Hiển thị FPS"}</span>
                <span className="text-[10px] text-slate-500">{t.showFPSInfo || "Hiển thị bộ đếm số khung hình trên giây góc màn hình"}</span>
              </div>
              <button
                onClick={() => { playClick(); toggleFPS(); }}
                className={`w-12 h-6 rounded-full relative transition-colors ${showFPS ? "bg-emerald-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showFPS ? "left-[28px]" : "left-1"}`} />
              </button>
            </div>

            {/* Max FPS Config */}
            {!openSettingsFromPause && (
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">{t.maxFPS || "Giới hạn FPS"}</span>
                    <span className="text-[10px] text-slate-500">{t.maxFPSInfo || "Giới hạn số khung hình để tiết kiệm pin và tránh nóng máy"}</span>
                  </div>
                  <span className="font-mono text-sm font-bold bg-slate-950 px-3 py-1 rounded text-cyan-400 border border-white/5">
                    {maxFPS === -1 ? (t.unlimited || "Không giới hạn") : `${maxFPS} FPS`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="240"
                  step="1"
                  value={maxFPS}
                  onChange={setMaxFPS}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 touch-action-pan-y"
                />
              </div>
            )}
          </div>
        )
      case "animation":
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t.animationDesc || "Điều chỉnh mức độ chuyển động của các hiệu ứng để tối ưu hiệu năng."}
            </p>
            <div className="flex flex-col gap-3">
              {(["full", "min", "none"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    playClick()
                    setAnimationLevel(level)
                  }}
                  className={`py-4 px-5 rounded-2xl font-bold text-sm uppercase transition-all border flex items-center justify-between ${
                    animationLevel === level
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30"
                      : "bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800"
                  }`}
                >
                  <span className="text-left font-bold">{t[`anim${level.charAt(0).toUpperCase() + level.slice(1)}`] || level}</span>
                  {animationLevel === level && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-glow" />}
                </button>
              ))}
            </div>
          </div>
        )
      case "others":
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t.othersDesc || "Các thiết lập hỗ trợ bổ sung cho người chơi."}
            </p>
            {/* Report Bug */}
            <button
              onClick={() => {
                playClick()
                window.open("https://github.com/MeoNguOfficial/v0-game-hung-bong/issues", "_blank")
              }}
              className="w-full flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:bg-slate-800/80 transition-colors text-left"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase block">{t.reportBug || "Báo cáo lỗi"}</span>
                <span className="text-[10px] text-slate-500">{t.reportBugInfo || "Phản hồi trực tiếp các vấn đề phát sinh"}</span>
              </div>
              <Bug size={18} className="text-orange-400" />
            </button>

            {/* Clear Cache */}
            {clearCache && (
              <button
                onClick={() => {
                  playClick()
                  clearCache()
                }}
                className="w-full flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:bg-slate-800/80 transition-colors text-left"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 uppercase block">{t.clearCache || "Xóa bộ đệm"}</span>
                  <span className="text-[10px] text-slate-500">{t.clearCacheInfo || "Làm sạch dữ liệu tải lại để nhận cập nhật mới"}</span>
                </div>
                <Trash2 size={18} className="text-cyan-400" />
              </button>
            )}
          </div>
        )
      case "system":
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t.systemDesc || "Khu vực khôi phục hệ thống và quản lý cấu hình sâu của dữ liệu lưu trữ."}
            </p>
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <AnimatePresence mode="wait">
                {!showResetConfirm && !resetComplete && (
                  <motion.button
                    key="reset-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { playClick(); setShowResetConfirm(true); }}
                    className="w-full flex items-center justify-between p-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/20 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-red-400 uppercase block">{t.resetData || "Khôi phục dữ liệu gốc"}</span>
                      <span className="text-[10px] text-red-500/80">{t.resetDataInfo || "Xóa vĩnh viễn dữ liệu điểm số, nâng cấp và cài đặt cá nhân"}</span>
                    </div>
                    <Trash2 size={18} className="text-red-400" />
                  </motion.button>
                )}

                {showResetConfirm && !resetComplete && (
                  <motion.div
                    key="reset-confirm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 text-center py-2"
                  >
                    <p className="text-xs text-red-400 font-bold leading-relaxed">
                      {t.resetConfirmText || "Hành động này sẽ xóa vĩnh viễn toàn bộ tiến trình chơi game của bạn. Xác nhận?"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { playClick(); setShowResetConfirm(false); }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase"
                      >
                        {t.cancel || "Hủy"}
                      </button>
                      <button
                        onClick={handleResetData}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase shadow-lg shadow-red-600/30"
                      >
                        {t.confirm || "Xác nhận"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {resetComplete && (
                  <motion.div
                    key="reset-complete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-2"
                  >
                    <p className="text-xs text-green-400 font-bold mb-3">
                      {t.resetComplete || "Khôi phục dữ liệu gốc thành công!"}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                    >
                      {t.restartNow || "Tải lại ngay"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Wrapper
      className={wrapperClass}
      {...(!embed ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25 }
      } : {})}
    >
      <Container
        className={contentClass}
        {...(!embed ? {
          initial: { scale: 0.95, y: 15 },
          animate: { scale: 1, y: 0 },
          exit: { scale: 0.95, y: 15 },
          transition: animationLevel === "full"
            ? { type: "spring", stiffness: 350, damping: 26 }
            : { duration: animationLevel === "min" ? 0.2 : 0.1 }
        } : {})}
      >
        {/* TIÊU ĐỀ PHÍA TRÊN */}
        {!embed && (
          <div className="flex justify-between items-center p-6 pb-4 shrink-0 bg-slate-955/20 z-10 border-b border-white/5">
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <Settings className="text-blue-500 animate-spin-slow" size={24} />
                {t.settings || "Cài đặt"}
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{t.settingsDesc || "Cấu hình hệ thống"}</p>
            </div>
            <button
              onClick={() => {
                playClick()
                onClose()
              }}
              className="bg-slate-900 p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-white/5"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {embed && !hideSystem && (
          <div className="flex justify-between items-center mb-4 shrink-0 pt-1 px-1">
            <h3 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-2">
              <Settings className="text-blue-500 animate-spin-slow" size={20} />
              {t.settings || "Cài đặt"}
            </h3>
          </div>
        )}

        {/* 1. PHIÊN BẢN DESKTOP / PC */}
        <div className="hidden lg:flex flex-1 overflow-hidden min-h-[480px]">
          {/* Cột trái: Tab bar */}
          <div className="w-[280px] bg-slate-900/40 border-r border-white/5 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
            {tabsList.map((tab) => {
              const TabIcon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playClick()
                    setActiveTab(tab.id)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white font-extrabold border-blue-500/50 shadow-md shadow-blue-500/5"
                      : "bg-transparent text-slate-400 border-transparent hover:bg-slate-900/30 hover:text-slate-200"
                  }`}
                >
                  <TabIcon size={18} className={`${tab.color} ${isSelected ? "scale-110" : ""}`} />
                  <span className="text-xs uppercase tracking-wider">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Cột phải: Settings details */}
          <div className="flex-1 bg-slate-950 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div className="w-full max-w-[640px]">
              <div className="mb-6">
                <h4 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  {React.createElement(tabsList.find(t => t.id === activeTab)?.icon || Globe, {
                    size: 18,
                    className: tabsList.find(t => t.id === activeTab)?.color
                  })}
                  {tabsList.find(t => t.id === activeTab)?.label}
                </h4>
                <div className="h-[2px] bg-emerald-500/40 mt-2.5 w-full rounded-full" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={
                    animationLevel === "none" ? { duration: 0 } :
                    animationLevel === "min" ? { duration: 0.15 } :
                    { type: "spring", stiffness: 400, damping: 30 }
                  }
                >
                  {renderTabContent(activeTab)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 2. PHIÊN BẢN DI ĐỘNG/MOBILE */}
        <div className={`block lg:hidden flex-1 overflow-y-auto custom-scrollbar ${embed ? "p-1" : "p-6 pt-4"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
            
            {/* BOX 1: NGÔN NGỮ */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe size={15} className="text-cyan-400" /> {t.language || "Ngôn ngữ"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {/* Lưới chọn ngôn ngữ chuẩn "Mix" trên Mobile (Cờ bên trái, Tên bên phải) */}
                <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                  {LANGUAGES_LIST.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => { playClick(); setLanguage(item.code); }}
                      className={`py-2.5 px-3 rounded-xl font-bold transition-all border flex items-center gap-2.5 ${
                        language === item.code
                          ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                          : "bg-slate-955 text-slate-400 border-transparent hover:bg-slate-850"
                      }`}
                    >
                      <span className="text-xl leading-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{item.flag}</span>
                      <span className="text-xs tracking-wide truncate text-left">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BOX 2: ĐỒ HỌA VÀ HÌNH ẢNH */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={15} className="text-yellow-400" /> {t.visuals || "Hình ảnh"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-2.5">
                <div className="flex justify-between items-center bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.particles || "Hạt hiệu ứng"}</span>
                  <button
                    onClick={() => { playClick(); toggleParticles(); }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${particlesEnabled ? "bg-blue-600" : "bg-slate-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${particlesEnabled ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-955/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.trails || "Vệt sáng"}</span>
                  <button
                    onClick={() => { playClick(); toggleTrails(); }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${trailsEnabled ? "bg-blue-600" : "bg-slate-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${trailsEnabled ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.shockwaves || "Sóng kích"}</span>
                  <button
                    onClick={() => { playClick(); toggleShockwaves(); }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${shockwavesEnabled ? "bg-cyan-600" : "bg-slate-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${shockwavesEnabled ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-955/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.cameraShake || "Rung lắc"}</span>
                  <button
                    onClick={() => { playClick(); toggleCameraShake(); }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${cameraShakeEnabled ? "bg-orange-600" : "bg-slate-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${cameraShakeEnabled ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* BOX 3: ÂM THANH */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Volume2 size={15} className="text-green-400" /> {t.audio || "Âm thanh"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div className={`transition-opacity ${isMenuMusicDisabled ? "opacity-30" : "opacity-100"}`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { playClick(); toggleBgMenu(); }} className={`transition-colors ${bgMenuEnabled && !isMuted ? "text-purple-400" : "text-slate-600"}`}>
                        {bgMenuEnabled && !isMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      </button>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t.menuMusic || "Nhạc Menu"}</span>
                    </div>
                    <span className="text-[11px] font-mono text-purple-400">{Math.round(menuMusicVolume * 100)}%</span>
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

                <div className={`transition-opacity ${isGameMusicDisabled ? "opacity-30" : "opacity-100"}`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { playClick(); toggleGameMusic(); }} className={`transition-colors ${gameMusicEnabled && !isMuted ? "text-indigo-400" : "text-slate-600"}`}>
                        {gameMusicEnabled && !isMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      </button>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t.gameMusic || "Nhạc Game"}</span>
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400">{Math.round(gameMusicVolume * 100)}%</span>
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

                <div className={`transition-opacity ${isSfxDisabled ? "opacity-30" : "opacity-100"}`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { playClick(); toggleSfx(); }} className={`transition-colors ${sfxEnabled && !isMuted ? "text-green-400" : "text-slate-600"}`}>
                        {sfxEnabled && !isMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      </button>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t.sfx || "Hiệu ứng"}</span>
                    </div>
                    <span className="text-[11px] font-mono text-green-400">{Math.round(sfxVolume * 100)}%</span>
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

            {/* BOX 4: ĐIỀU KHIỂN (GAMEPLAY) */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={15} className="text-purple-400" /> {t.controls || "Điều khiển"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-between gap-3">
                {/* Sensitivity */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                    <span>{t.sensitivity || "Độ nhạy"}</span>
                    <span className="font-mono bg-slate-950 px-1.5 py-0.2 rounded text-blue-400">{sensitivity}</span>
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

                {/* Base Game Speed */}
                {!openSettingsFromPause && (
                  <div className="border-t border-white/5 pt-2">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                      <span className={gameState === "running" ? "text-slate-500" : ""}>{t.baseGameSpeed || "Tốc độ gốc"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-purple-500 font-black">{getSpeedRank(baseGameSpeed)}</span>
                        <span className="font-mono bg-slate-950 px-1.5 py-0.2 rounded text-purple-400">{(baseGameSpeed / 100).toFixed(2)}x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="50"
                      value={baseGameSpeed}
                      onChange={setBaseGameSpeed}
                      disabled={gameState === "running"}
                      className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none accent-purple-500 touch-action-pan-y ${
                        gameState === "running" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    />
                  </div>
                )}

                {/* Raw Input Toggle */}
                <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">{t.rawInput || "Raw Input (PC)"}</span>
                  <button
                    onClick={() => { playClick(); toggleRawInput(); }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${rawInput ? "bg-blue-600" : "bg-slate-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${rawInput ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* BOX 5: THÔNG SỐ */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={15} className="text-emerald-400" /> {t.parameters || "Thông số"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <div className="flex justify-between items-center bg-slate-955/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">{t.showFPS || "Hiển thị FPS"}</span>
                  <button
                    onClick={() => { playClick(); toggleFPS(); }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${showFPS ? "bg-emerald-600" : "bg-slate-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${showFPS ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                {!openSettingsFromPause && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                      <span>{t.maxFPS || "Khóa FPS"}</span>
                      <span className="font-mono bg-slate-950 px-1.5 py-0.2 rounded text-cyan-400">
                        {maxFPS === -1 ? (t.unlimited || "Không giới hạn") : `${maxFPS} FPS`}
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
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
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
                      onClick={() => { playClick(); setAnimationLevel(level); }}
                      className={`py-2 rounded-xl font-bold text-xs uppercase transition-all border ${
                        animationLevel === level
                          ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                          : "bg-slate-955 text-slate-400 border-transparent hover:bg-slate-850"
                      }`}
                    >
                      {t[`anim${level.charAt(0).toUpperCase() + level.slice(1)}`] || level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BOX 7: KHÁC */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Bug size={15} className="text-pink-400" /> {t.others || "Khác"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-3">
                <button
                  onClick={() => {
                    playClick()
                    window.open("https://github.com/MeoNguOfficial/v0-game-hung-bong/issues", "_blank")
                  }}
                  className="w-full flex items-center justify-between bg-slate-955 p-2.5 rounded-xl border border-white/5 hover:bg-slate-850 transition-colors text-left"
                >
                  <span className="text-[10px] font-black text-slate-300 uppercase">{t.reportBug || "Báo lỗi"}</span>
                  <Bug size={14} className="text-orange-400" />
                </button>

                {clearCache && (
                  <button
                    onClick={() => { playClick(); clearCache(); }}
                    className="w-full flex items-center justify-between bg-slate-955 p-2.5 rounded-xl border border-white/5 hover:bg-slate-850 transition-colors text-left"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase">{t.clearCache || "Xóa cache"}</span>
                      <span className="text-[8px] text-slate-500 block">{t.clearCacheInfo || "Tải mới tài nguyên"}</span>
                    </div>
                    <Trash2 size={14} className="text-cyan-400" />
                  </button>
                )}
              </div>
            </div>

            {/* BOX 8: HỆ THỐNG */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col h-full min-h-[220px]">
              <div className="mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={15} className="text-red-400" /> {t.system || "Hệ thống"}
                </h3>
                <div className="h-[2px] bg-emerald-500/50 mt-2 w-full rounded-full" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {!hideSystem && (
                  <div className="bg-slate-955/60 p-2 rounded-xl border border-white/5">
                    <AnimatePresence mode="wait">
                      {!showResetConfirm && !resetComplete && (
                        <motion.button
                          key="reset-btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => { playClick(); setShowResetConfirm(true); }}
                          className="w-full flex items-center justify-between p-2 hover:bg-red-500/5 rounded-lg transition-colors"
                        >
                          <span className="text-[10px] font-black text-red-400 uppercase">{t.resetData || "Khôi phục"}</span>
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
                            {t.resetConfirmText || "Khôi phục cài đặt gốc?"}
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => { playClick(); setShowResetConfirm(false); }}
                              className="flex-1 py-1 rounded bg-slate-700 text-white font-bold text-[9px] uppercase"
                            >
                              {t.cancel || "Hủy"}
                            </button>
                            <button
                              onClick={handleResetData}
                              className="flex-1 py-1 rounded bg-red-600 text-white font-bold text-[9px] uppercase"
                            >
                              {t.confirm || "Xóa"}
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
                            {t.resetComplete || "Đã reset!"}
                          </p>
                          <button
                            onClick={() => window.location.reload()}
                            className="w-full py-1.5 rounded bg-blue-600 text-white font-bold text-[9px] uppercase hover:bg-blue-500"
                          >
                            {t.restartNow || "Khởi động lại"}
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
    </Wrapper>
  )
}