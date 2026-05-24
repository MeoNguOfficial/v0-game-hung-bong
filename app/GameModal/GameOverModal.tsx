import React, { useEffect, useState, useRef } from "react"
import { motion, animate } from "framer-motion"
import { Trophy, Home, Settings, RotateCcw, Zap } from "lucide-react"

interface GameOverModalProps {
  t: any
  score: number
  gameMode: string
  isAuto: boolean
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
  onRestart: () => void
  onChangeMode: () => void
}

// Hợp phần pháo giấy vô hạn hiệu năng cao sử dụng Canvas thuần mượt mà
function InfiniteCanvasConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = canvas.offsetWidth
        height = canvas.height = canvas.offsetHeight
      }
    }
    window.addEventListener("resize", handleResize)

    const colors = ["#ffd700", "#ff4500", "#1e90ff", "#32cd32", "#ff69b4", "#8a2be2", "#00ffff"]
    
    interface Particle {
      x: number
      y: number
      size: number
      color: string
      angle: number
      speed: number
      gravity: number
      rotation: number
      rotationSpeed: number
      wind: number
    }

    const particles: Particle[] = []
    const particleCount = 50

    function createParticle(isInitial = false): Particle {
      return {
        x: Math.random() * width,
        y: isInitial ? Math.random() * height : -20,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 2 + 1,
        gravity: Math.random() * 1.5 + 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
        wind: Math.random() * 0.5 - 0.25,
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(true))
    }

    function render() {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p, index) => {
        p.y += p.gravity + p.speed * 0.2
        p.x += p.wind
        p.rotation += p.rotationSpeed

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 1.5)
        ctx.restore()

        if (p.y > height) {
          particles[index] = createParticle(false)
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}

export default function GameOverModal({
  t,
  score,
  gameMode,
  isAuto,
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
  onRestart,
  onChangeMode,
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
    const startDelay = setTimeout(() => {
      playSound("gameover")
      playSound("score_count")
      
      const controls = animate(0, score, {
        duration: score > 0 ? 1.5 : 0.5,
        ease: "circOut",
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
    }, 1200)

    return () => {
      clearTimeout(startDelay)
      stopSound("score_count")
    }
  }, [score])

  const currentModeName = t[`diff${gameMode.charAt(0).toUpperCase() + gameMode.slice(1).replace(/_([a-z])/g, (m, c) => c.toUpperCase())}` as keyof typeof t] || gameMode;
  const modeDisplay = isAuto ? `${currentModeName} (${t.auto})` : currentModeName;

  return (
    <motion.div
      key="over"
      custom={direction}
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[500px]"
    >
      {/* Hiệu ứng pháo giấy Canvas vật lý khi lập kỷ lục mới */}
      {showNewBestLabel && <InfiniteCanvasConfetti />}

      <motion.div
        variants={menuItemVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center z-10 w-full max-w-[350px]"
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
          <Trophy size={80} className="text-yellow-500 mb-6 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
        </motion.div>
        
        <motion.h2
          variants={menuItemVariants}
          className="text-5xl font-black mb-2 text-white italic uppercase tracking-tighter"
        >
          {t.gameOver}
        </motion.h2>

        {/* BẢNG KẾT QUẢ HUD (Đã nâng cấp QOL chống tràn số) */}
        <motion.div 
          variants={menuItemVariants}
          className="w-full bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 mt-4 mb-8 shadow-2xl"
        >
          <div className="flex flex-col gap-2 mb-2">
            {/* Hộp 1: Điểm số (Được xếp riêng hàng đầu để có không gian tối đa) */}
            <div className="w-full bg-slate-800/40 rounded-xl border border-white/5 p-4 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.score}</span>
              <span className="text-4xl font-black text-yellow-400 italic tabular-nums leading-none drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                {displayScore.toLocaleString()}
              </span>
            </div>

            {/* Hộp 2: Chế độ chơi */}
            <div className="w-full bg-slate-800/20 rounded-xl border border-white/5 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.gameModes}</span>
              <span className="text-sm font-black text-white uppercase italic truncate max-w-[180px] pl-2">{modeDisplay}</span>
            </div>
          </div>

          {/* Thanh trạng thái kỷ lục dưới đáy bảng */}
          <div className={`rounded-xl px-4 py-2 flex items-center justify-center border transition-all duration-500 ${showNewBestLabel ? "bg-yellow-500/20 border-yellow-500/30" : "bg-blue-600/15 border-blue-500/30"}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 ${showNewBestLabel ? "text-yellow-400" : "text-blue-200"}`}>
              <Zap size={12} className={showNewBestLabel ? "fill-yellow-400 text-yellow-400" : "fill-blue-400 text-blue-400"} />
              {showNewBestLabel 
                ? (newBestRank ? `NEW TOP #${newBestRank} RECORD` : t.newBest) 
                : (isAuto ? "AI PERFORMANCE ANALYSIS" : "SESSION COMPLETED")}
              <Zap size={12} className={showNewBestLabel ? "fill-yellow-400 text-yellow-400" : "fill-blue-400 text-blue-400"} />
            </span>
          </div>
        </motion.div>

        {/* Cụm nút bấm nguyên bản */}
        {showButtons && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 w-full pointer-events-auto"
          >
            {/* Hàng nút chính: Chơi lại & Đổi chế độ */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRestart}
                className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black italic flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <RotateCcw size={18} /> {t.restart}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onChangeMode}
                className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-black italic flex items-center justify-center gap-2 border border-white/5"
              >
                <Settings size={18} /> {t.changeMode}
              </motion.button>
            </div>

            {/* Hàng nút phụ: Trang chủ & Cài đặt */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClick(); onHome(); }}
                className="flex-1 py-3 bg-slate-900 text-slate-400 font-black rounded-xl flex items-center justify-center gap-2 border border-white/5 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Home size={18} /> {t.home}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClick(); onSettings(); }}
                className="px-6 py-3 bg-slate-900 text-slate-400 rounded-xl border border-white/5 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Settings size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}