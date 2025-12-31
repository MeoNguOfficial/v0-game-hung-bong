'use client'
import React, { useState } from "react"
import { Trash2, Trophy, Calendar, EyeOff, Square, ArrowUpCircle, ArrowRightLeft, FlipVertical, Ghost } from "lucide-react"
import { getModifierCombinationText } from "../ScoreManager"
import type { HistoryEntry } from "../ScoreManager"

interface DefaultModeStatsModalProps {
  t: Record<string, string>
  bestScores: Record<string, number>
  setBestScores: (scores: Record<string, number>) => void
  playClick: () => void
  recentScores: HistoryEntry[]
  setRecentScores: (scores: HistoryEntry[]) => void
}

export default function DefaultModeStatsModal({
  t,
  bestScores,
  setBestScores,
  playClick,
  recentScores = [],
  setRecentScores,
}: DefaultModeStatsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false)

  const parseKeyToDetail = (key: string) => {
    if (!key) return null
    const s = key.replace(/^best_score_/, '')

    let difficulty: string
    let gameType: string
    let modifierParts: string[]

    if (s.startsWith('sudden_death_')) {
      difficulty = 'sudden_death'
      const parts = s.replace('sudden_death_', '').split('_')
      gameType = parts[0]
      modifierParts = parts.slice(1)
    } else {
      const parts = s.split('_')
      difficulty = parts[0]
      gameType = parts[1]
      modifierParts = parts.slice(2)
    }

    const modifiers = {
      isHidden: modifierParts.includes('h'),
      isBlank: modifierParts.includes('b'),
      isReverse: modifierParts.includes('r'),
    }
    return { difficulty, gameType, modifiers }
  }

  const entries = Object.entries(bestScores)

  const getTop5Stats = () => {
    // 1. Best Scores (Unique per mode)
    const bests = entries
      .filter(([k]) => {
        const d = parseKeyToDetail(k)
        return d?.gameType !== 'classic'
      })
      .map(([k, v]) => ({
        value: v,
        detail: {
          ...parseKeyToDetail(k),
          funny: { isReverseControl: false, isMirror: false, isInvisible: false }
        }
      }))

    // 2. Recent Scores (History)
    const recents = recentScores
      .filter(r => r.gameType !== 'classic')
      .map(r => ({
        value: r.score,
        detail: {
          difficulty: r.difficulty,
          gameType: r.gameType,
          modifiers: r.modifiers,
          funny: r.funny
        }
      }))

    // 3. Filter duplicates (Remove bests that are already in recents)
    const uniqueBests = bests.filter(b => {
      return !recents.some(r =>
        r.value === b.value &&
        r.detail.difficulty === b.detail.difficulty &&
        r.detail.modifiers.isHidden === b.detail.modifiers.isHidden &&
        r.detail.modifiers.isBlank === b.detail.modifiers.isBlank &&
        r.detail.modifiers.isReverse === b.detail.modifiers.isReverse &&
        !r.detail.funny.isReverseControl &&
        !r.detail.funny.isMirror &&
        !r.detail.funny.isInvisible
      )
    })

    return [...uniqueBests, ...recents]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  const top5 = getTop5Stats()
  const best = top5.length > 0 ? top5[0] : { value: 0, detail: null }
  const recent = recentScores.filter(r => r.gameType !== 'classic').slice(0, 20)

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Blue Theme for Default
  const gradient = "from-blue-500/20 to-cyan-600/20"
  const border = "border-blue-500/30"
  const blur = "bg-blue-500/5"
  const iconColor = "text-blue-400"
  const shadow = "drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
  const subTitle = "text-blue-200"

  return (
      <div className="mb-8 last:mb-0">
        {/* Best Score */}
        <div className={`bg-gradient-to-br ${gradient} p-6 rounded-[2rem] border ${border} mb-6 flex flex-col items-center justify-center relative overflow-hidden`}>
          <div className={`absolute inset-0 ${blur} blur-xl`} />
          <Trophy size={48} className={`${iconColor} mb-2 ${shadow}`} />
          <h4 className={`text-xs font-black ${subTitle} uppercase tracking-widest mb-1`}>{t.allTimeBest || "All Time Best"}</h4>
          <span className="text-5xl font-black text-white italic tracking-tighter drop-shadow-lg tabular-nums">
            {best.value}
          </span>
          {best.detail && (
            <div className="text-[11px] text-slate-300 mt-2 font-bold flex items-center gap-2">
              <span className="uppercase text-[9px] text-slate-500">{t.gameModes || 'Mode'}:</span>
              <span className="text-[11px] font-black">
                {(() => {
                  const { difficulty, modifiers } = best.detail
                  const diffLabel = t[`diff${difficulty === 'sudden_death' ? 'SuddenDeath' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`] || difficulty
                  const modsLabel = getModifierCombinationText(modifiers, t)
                  return `${diffLabel}${modsLabel ? ' • ' + modsLabel : ''}`
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Top 5 Scores */}
        <div className="mb-8">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 mb-4">{t.topScores || "Top 5 Best Scores"}</h4>
          <div className="space-y-3">
            {top5.length === 0 ? (
              <div className="text-center py-4 text-slate-600 italic text-xs font-bold">
                {t.noData || "No records yet."}
              </div>
            ) : (
              top5.map((stat, index) => (
                <div key={index} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
                      index === 0 ? 'bg-yellow-500 text-black shadow-yellow-500/20' :
                      index === 1 ? 'bg-slate-300 text-slate-900 shadow-slate-300/20' :
                      index === 2 ? 'bg-amber-700 text-amber-100 shadow-amber-700/20' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <span className={`text-xl font-black italic tabular-nums text-blue-400`}>
                      {stat.value}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {stat.detail && (
                      <>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          stat.detail.difficulty === 'sudden_death' ? 'bg-red-600/20 text-red-400' :
                          stat.detail.difficulty === 'hardcode' ? 'bg-orange-600/20 text-orange-400' : 'bg-emerald-600/20 text-emerald-400'
                        }`}>
                          {t[`diff${stat.detail.difficulty === 'sudden_death' ? 'SuddenDeath' : stat.detail.difficulty.charAt(0).toUpperCase() + stat.detail.difficulty.slice(1)}`] || stat.detail.difficulty}
                        </span>
                        <div className="flex gap-1">
                          {stat.detail.modifiers.isHidden && <span className="p-1 rounded bg-indigo-600/20 text-indigo-400" title="Hidden"><EyeOff size={10} /></span>}
                          {stat.detail.modifiers.isBlank && <span className="p-1 rounded bg-slate-600/20 text-slate-400" title="Blank"><Square size={10} /></span>}
                          {stat.detail.modifiers.isReverse && <span className="p-1 rounded bg-teal-600/20 text-teal-400" title="Reverse"><ArrowUpCircle size={10} /></span>}

                          {stat.detail.funny?.isReverseControl && <span className="p-1 rounded bg-lime-600/20 text-lime-400" title="Rev. Ctrl"><ArrowRightLeft size={10} /></span>}
                          {stat.detail.funny?.isMirror && <span className="p-1 rounded bg-fuchsia-600/20 text-fuchsia-400" title="Mirror"><FlipVertical size={10} /></span>}
                          {stat.detail.funny?.isInvisible && <span className="p-1 rounded bg-stone-600/20 text-stone-400" title="Invisible"><Ghost size={10} /></span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">{t.recentMatches || "Recent Matches"}</h4>
          {recent.length === 0 ? (
            <div className="text-center py-4 text-slate-600 italic text-xs font-bold">
              {t.noHistory || "No matches played yet."}
            </div>
          ) : (
            recent.map((entry, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                {/* Left: Score */}
                <div className="flex flex-col items-start min-w-[80px]">
                  <span className={`text-2xl font-black italic leading-none tabular-nums text-blue-400`}>{entry.score}</span>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar size={10} /> {formatDate(entry.timestamp)}
                  </span>
                </div>

                {/* Right: Details */}
                <div className="flex flex-col items-end gap-1.5 flex-1">
                  {/* Difficulty */}
                  <div className="flex flex-wrap justify-end gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      entry.difficulty === 'sudden_death' ? 'bg-red-600/20 text-red-400' :
                      entry.difficulty === 'hardcode' ? 'bg-orange-600/20 text-orange-400' : 'bg-emerald-600/20 text-emerald-400'
                    }`}>
                      {t[`diff${entry.difficulty === 'sudden_death' ? 'SuddenDeath' : entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}`] || entry.difficulty}
                    </span>
                  </div>

                  {/* Modifiers */}
                  <div className="flex flex-wrap justify-end gap-1">
                    {entry.modifiers.isHidden && <span className="p-1 rounded bg-indigo-600/20 text-indigo-400" title="Hidden"><EyeOff size={10} /></span>}
                    {entry.modifiers.isBlank && <span className="p-1 rounded bg-slate-600/20 text-slate-400" title="Blank"><Square size={10} /></span>}
                    {entry.modifiers.isReverse && <span className="p-1 rounded bg-teal-600/20 text-teal-400" title="Reverse"><ArrowUpCircle size={10} /></span>}

                    {entry.funny.isReverseControl && <span className="p-1 rounded bg-lime-600/20 text-lime-400" title="Rev. Ctrl"><ArrowRightLeft size={10} /></span>}
                    {entry.funny.isMirror && <span className="p-1 rounded bg-fuchsia-600/20 text-fuchsia-400" title="Mirror"><FlipVertical size={10} /></span>}
                    {entry.funny.isInvisible && <span className="p-1 rounded bg-stone-600/20 text-stone-400" title="Invisible"><Ghost size={10} /></span>}

                    {!entry.modifiers.isHidden && !entry.modifiers.isBlank && !entry.modifiers.isReverse &&
                      !entry.funny.isReverseControl && !entry.funny.isMirror && !entry.funny.isInvisible && (
                        <span className="text-[9px] font-bold text-slate-600 uppercase">{t.none || "None"}</span>
                      )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clear Records Button */}
      <div className="bg-white/5 p-4 sm:p-6 rounded-[2rem] border border-white/5 mt-4">
        <button
          onClick={() => {
            playClick()
            if (!confirmReset) {
              setConfirmReset(true)
              setTimeout(() => setConfirmReset(false), 3000)
              return
            }

            const nextBestScores = { ...bestScores };

            Object.keys(bestScores).forEach(key => {
              const detail = parseKeyToDetail(key);
              if (detail) {
                // Only delete Default records
                if (detail.gameType !== 'classic') {
                  localStorage.removeItem(key);
                  delete nextBestScores[key];
                }
              }
            });
            setBestScores(nextBestScores);

            const nextRecentScores = recentScores.filter(r => {
              // Keep Classic records
              return r.gameType === 'classic';
            });
            setRecentScores(nextRecentScores);
            localStorage.setItem("game_recent_history", JSON.stringify(nextRecentScores));

            setConfirmReset(false)
          }}
          className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 text-xs uppercase transition-all ${confirmReset ? "bg-red-600 text-white animate-pulse" : "bg-slate-800 text-red-400 hover:bg-slate-700"}`}
        >
          {confirmReset ? t.confirmDeleteAll : `${t.clearRecordsFor || "Clear records for"} ${t.modeDefault || 'Default'}`}
          <Trash2 size={16} />
        </button>
      </div>
      </div>
  )
}
