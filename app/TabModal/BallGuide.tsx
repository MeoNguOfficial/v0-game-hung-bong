import React from "react"
import { motion } from "framer-motion"

interface BallGuideProps {
  t: any
  direction: number
  variants: any
}

export default function BallGuide({ t, direction, variants }: BallGuideProps) {
  return (
    <motion.div
      key="guide"
      custom={direction}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="flex justify-between items-center p-6 pb-4 shrink-0 z-10 border-b border-white/5">
        <div>
          <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none">{t.ballGuide}</h3>
          <p className="text-purple-500 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">{t.manualDatabase}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
      <div className="space-y-4 pb-4">
        {/* NORMAL BALL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group">
          <div className="w-14 h-14 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex-shrink-0 border-4 border-white/10" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-red-500 font-black text-xl uppercase italic">{t.ballNormal}</h4>
              <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold border border-red-500/20">{t.basic}</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 italic">{t.ballNormalDesc}</p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">0 {t.pts}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-green-400">{t.scorePlus1}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-yellow-500">{t.incrementalSpeed}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.allModes}</span></div>
            </div>
          </div>
        </div>
        {/* FAST BALL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group border-l-4 border-l-purple-500">
          <div className="w-14 h-14 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] flex-shrink-0 border-4 border-white/10" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-purple-400 font-black text-xl uppercase italic">{t.ballFast}</h4>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold border border-purple-500/20">{t.speed}</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 italic">{t.ballFastDesc}</p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">50 {t.pts}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-green-400">{t.scorePlus3}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-red-500">{t.lowReactionTime}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
            </div>
          </div>
        </div>
        {/* ZICZAC BALL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group border-l-4 border-l-yellow-500">
          <div className="w-14 h-14 rounded-full bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] flex-shrink-0 border-4 border-white/10" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-yellow-400 font-black text-xl uppercase italic">{t.ballZicZac}</h4>
              <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/20">{t.tricky}</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 italic">{t.ballZicZacDesc}</p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">100 {t.pts}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-green-400">{t.scorePlus10}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-red-500">{t.sharpAngles}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
            </div>
          </div>
        </div>
        {/* BOOSTER BALL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group">
          <div className="w-14 h-14 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] flex-shrink-0 border-4 border-white/10 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-blue-400 font-black text-xl uppercase italic">{t.ballBooster}</h4>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/20">{t.buff}</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 italic">{t.ballBoosterDesc}</p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">200 {t.pts}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-cyan-400">{t.paddleSize}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-green-500">{t.none}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
            </div>
          </div>
        </div>
        {/* SHIELD BALL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group">
          <div className="w-14 h-14 rounded-full bg-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.5)] flex-shrink-0 border-4 border-white/10" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-slate-300 font-black text-xl uppercase italic">{t.ballShield}</h4>
              <span className="text-[10px] bg-slate-100/10 text-slate-300 px-2 py-0.5 rounded-full font-bold border border-slate-500/20">{t.defense}</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 italic">{t.ballShieldDesc}</p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">300 {t.pts}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-cyan-400">{t.armor}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-green-500">{t.none}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.allModes}</span></div>
            </div>
          </div>
        </div>
        {/* SNOW BALL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group border-l-4 border-l-cyan-300">
          <div className="w-14 h-14 flex-shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56" className="rounded-full" aria-hidden>
              <defs>
                <radialGradient id="snowGuideGrad" cx="30%" cy="25%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#e6f9ff" />
                  <stop offset="100%" stopColor="#e6fbff" />
                </radialGradient>
              </defs>
              <circle cx="28" cy="28" r="24" fill="url(#snowGuideGrad)" stroke="#cfeffd" strokeWidth="2" />
              <g fill="#ffffff" opacity="0.95">
                <path d="M28 16 L30 24 L28 32 L26 24 Z" />
              </g>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-white font-black text-xl uppercase italic">{t.ballSnow}</h4>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold border border-white/30">{t.time}</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 italic">{t.ballSnowDesc}</p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">≥500 {t.pts}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-cyan-300">{t.freeze10s}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-yellow-500">{t.momentumLoss}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
            </div>
          </div>
        </div>
        {/* BOMB BALL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group border-l-4 border-l-orange-500">
          <div className="w-14 h-14 flex-shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
              <defs>
                <radialGradient id="bombGuideGrad" cx="35%" cy="25%">
                  <stop offset="0%" stopColor="#fff7ed" />
                  <stop offset="40%" stopColor="#ffd6a8" />
                  <stop offset="100%" stopColor="#f97316" />
                </radialGradient>
              </defs>
              <circle cx="28" cy="28" r="24" fill="url(#bombGuideGrad)" stroke="#f97316" strokeWidth="1.5" />
              <rect x="36" y="10" width="8" height="6" rx="1" fill="#374151" />
              <rect x="41" y="6" width="3" height="6" rx="1" fill="#374151" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-orange-500 font-black text-xl uppercase italic">{t.ballBomb}</h4>
              <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-bold border border-orange-500/20">{t.danger}</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 italic">{t.ballBombDesc}</p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">2 {t.pts}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-red-500">{t.lifeLoss}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-red-500">{t.extreme}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.defaultOnly}</span></div>
            </div>
          </div>
        </div>
        {/* HEAL BALL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 flex gap-5 items-center group">
          <div className="w-14 h-14 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] flex-shrink-0 border-4 border-white/10" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-green-400 font-black text-xl uppercase italic">{t.ballHeal}</h4>
              <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/20">{t.life}</span>
            </div>
            <p className="text-slate-400 text-xs mb-3 italic">{t.ballHealDesc}</p>
            <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wide">
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.unlockAt}:</span><span className="text-white">150 {t.pts}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.mechanic}:</span><span className="text-green-400">{t.hpPlus}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.risk}:</span><span className="text-green-500">{t.harmless}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-0.5">{t.gameModes}:</span><span className="text-blue-400">{t.normalAndClassic}</span></div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  )
}
