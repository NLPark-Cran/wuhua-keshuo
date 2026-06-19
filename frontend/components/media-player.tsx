"use client"

import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { formatTime, mediaUrl, type Segment, type Work } from "@/lib/api"
import { cn } from "@/lib/utils"

interface MediaPlayerProps {
  work: Work
  onSeek?: (time: number) => void
}

export function MediaPlayer({ work, onSeek }: MediaPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(work.duration_seconds || 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showMandarin, setShowMandarin] = useState(true)
  const [showEnglish, setShowEnglish] = useState(true)
  const [showNotes, setShowNotes] = useState(true)

  const segments = work.segments
  const activeIndex = useMemo(() => {
    if (!segments.length) return -1
    return segments.findIndex((s, i) => {
      const next = segments[i + 1]
      return currentTime >= s.start_seconds && (next ? currentTime < next.start_seconds : true)
    })
  }, [segments, currentTime])

  const activeSegment = activeIndex >= 0 ? segments[activeIndex] : null

  useEffect(() => {
    const media = mediaRef.current
    if (!media) return

    const updateTime = () => setCurrentTime(media.currentTime)
    const updateDuration = () => setDuration(media.duration || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    media.addEventListener("timeupdate", updateTime)
    media.addEventListener("loadedmetadata", updateDuration)
    media.addEventListener("durationchange", updateDuration)
    media.addEventListener("play", onPlay)
    media.addEventListener("pause", onPause)
    return () => {
      media.removeEventListener("timeupdate", updateTime)
      media.removeEventListener("loadedmetadata", updateDuration)
      media.removeEventListener("durationchange", updateDuration)
      media.removeEventListener("play", onPlay)
      media.removeEventListener("pause", onPause)
    }
  }, [work.id])

  useEffect(() => {
    if (onSeek) onSeek(currentTime)
  }, [currentTime, onSeek])

  const togglePlay = () => {
    const media = mediaRef.current
    if (!media) return
    if (media.paused) media.play()
    else media.pause()
  }

  const handleSeek = (value: number | readonly number[]) => {
    const media = mediaRef.current
    if (!media) return
    const target = Array.isArray(value) ? value[0] : value
    media.currentTime = target
    setCurrentTime(target)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) document.exitFullscreen()
    else container.requestFullscreen()
  }

  const isVideo =
    work.media_path.endsWith(".mp4") ||
    work.media_path.endsWith(".mov") ||
    work.media_path.endsWith(".avi") ||
    work.media_path.endsWith(".mkv")

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-2xl border border-border bg-black shadow-lg"
    >
      {isVideo ? (
        <video
          ref={mediaRef}
          src={mediaUrl(work.id)}
          className="w-full aspect-video"
          controls={false}
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="relative w-full aspect-video flex items-center justify-center bg-gradient-to-br from-muted to-background">
          <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={mediaUrl(work.id)} preload="metadata" />
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-foreground">音频模式</p>
            <p className="text-sm text-muted-foreground">播放时下方显示同步字幕</p>
          </div>
        </div>
      )}

      {/* Subtitle overlay */}
      {work.status === "completed" && activeSegment && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4 pointer-events-none">
          <div className="max-w-3xl text-center space-y-2 bg-black/70 px-8 py-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
            {activeSegment.speaker && (
              <Badge variant="secondary" className="pointer-events-auto mb-1 bg-white/20 text-white border-white/20">
                {activeSegment.speaker}
              </Badge>
            )}
            <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed drop-shadow-lg font-serif">
              {activeSegment.wu_text}
            </p>
            {showMandarin && activeSegment.mandarin_text && (
              <p className="text-lg md:text-xl text-white/95 leading-relaxed drop-shadow-md">
                {activeSegment.mandarin_text}
              </p>
            )}
            {showEnglish && activeSegment.english_text && (
              <p className="text-base md:text-lg text-white/80 italic leading-relaxed drop-shadow-md">
                {activeSegment.english_text}
              </p>
            )}
            {showNotes && activeSegment.notes && (
              <p className="text-xs text-white/60 mt-2">💡 {activeSegment.notes}</p>
            )}
          </div>
        </div>
      )}

      {work.status === "processing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary mb-4"></div>
          <p className="text-white text-lg font-medium">AI 正在解析台词与翻译</p>
          <p className="text-white/70 text-sm mt-1">请稍候，完成后字幕会自动显示</p>
        </div>
      )}

      {work.status === "failed" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center text-white max-w-md px-6">
            <p className="text-lg font-medium">解析失败</p>
            <p className="text-sm text-white/70 mt-2">{work.error_message}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="border-t border-white/10 bg-black/80 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/10">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <span className="text-sm tabular-nums w-24 text-white/90 text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" onClick={() => setMuted(!muted)} className="text-white hover:bg-white/10">
            {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[muted ? 0 : volume]}
            max={1}
            step={0.05}
            onValueChange={(v) => {
              const vol = Array.isArray(v) ? v[0] : v
              setVolume(vol)
              setMuted(vol === 0)
              if (mediaRef.current) mediaRef.current.volume = vol
            }}
            className="w-24"
          />
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/10">
            <Maximize className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-white/80">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <Switch checked={showMandarin} onCheckedChange={setShowMandarin} />
            普通话
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <Switch checked={showEnglish} onCheckedChange={setShowEnglish} />
            English
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <Switch checked={showNotes} onCheckedChange={setShowNotes} />
            文化注释
          </label>
        </div>
      </div>
    </div>
  )
}
