"use client"

import React, { useEffect, useState } from "react"
import { WifiOff, Zap, X, CheckCircle2 } from "lucide-react"
import { swManager } from "../lib/serviceWorkerManager"

/**
 * OfflineGame Component
 * Quản lý trạng thái ngoại tuyến và đảm bảo tài nguyên được cache bền vững.
 */
export default function OfflineGame() {
  const [isOnline, setIsOnline] = useState(true)
  const [isCached, setIsCached] = useState(false)
  const [dismissedReadyForOffline, setDismissedReadyForOffline] = useState(false)

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", updateStatus)
    window.addEventListener("offline", updateStatus)
    
    // Luôn reset trạng thái ẩn khi load lại game (mount component)
    setDismissedReadyForOffline(false)

    // Kiểm tra xem Service Worker đã cache đủ tài nguyên chưa
    const checkCache = async () => {
      if ('serviceWorker' in navigator) {
        // Chờ SW sẵn sàng và kiểm tra xem nó có đang kiểm soát trang không
        await navigator.serviceWorker.ready
        if (navigator.serviceWorker.controller) {
          setIsCached(true)
          // Yêu cầu quyền lưu trữ bền vững (Persistent Storage) cho game
          if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist()
          }
        }
      }
    }

    updateStatus()
    checkCache()

    return () => {
      window.removeEventListener("online", updateStatus)
      window.removeEventListener("offline", updateStatus)
    }
  }, [])

  const handleDismiss = () => {
    setDismissedReadyForOffline(true)
  }

  // Nếu đang online và đã ẩn thông báo hoặc chưa cache thì không hiện gì
  if (isOnline && (!isCached || dismissedReadyForOffline)) return null

  return (
    <div className="fixed top-4 left-4 z-[200] pointer-events-none flex flex-col gap-2">
      {!isOnline && (
        <div className="bg-red-500/95 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-xl animate-pulse border border-red-400/50">
          <WifiOff size={14} className="text-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-tighter">Offline Mode</span>
        </div>
      )}
      
      {isCached && isOnline && !dismissedReadyForOffline && (
        <div className="bg-emerald-500/95 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-emerald-400/50">
          <Zap size={14} className="text-white fill-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-tighter">Ready for Offline</span>
          <button 
            onClick={handleDismiss}
            className="pointer-events-auto ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={12} className="text-white" />
          </button>
        </div>
      )}
    </div>
  )
}