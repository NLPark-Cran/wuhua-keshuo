"use client"

import {
  Maximize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { formatTime, mediaUrl, type Segment, type Work } from "@/lib/api"

interface MediaPlayerProps {
  work: Work
  activeSceneId?: number
  onSeek?: (time: number) => void
}

export function MediaPlayer({ work, onSeek }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
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
    const idx = segments.findIndex((s, i) => {
      const next = segments[i + 1]
      return currentTime >= s.start_seconds && (next ? currentTime < next.start_seconds : true)
    })
    return idx
  }, [segments, currentTime])

  const activeSegment = activeIndex >= 0 ? segments[activeIndex] : null

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)
    video.addEventListener("durationchange", updateDuration)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
      video.removeEventListener("durationchange", updateDuration)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
    }
  }, [work.id])

  useEffect(() => {
    if (onSeek) onSeek(currentTime)
  }, [currentTime, onSeek])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }

  const handleSeek = (value: number | readonly number[]) => {
    const video = videoRef.current
    if (!video) return
    const target = Array.isArray(value) ? value[0] : value
    video.currentTime = target
    setCurrentTime(target)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  const isVideo =
    work.media_path.endsWith(".mp4") ||
    work.media_path.endsWith(".mov") ||
    work.media_path.endsWith(".avi") ||
    work.media_path.endsWith(".mkv")

  return (
    <div ref={containerRef} className="relative flex flex-col bg-black rounded-xl overflow-hidden">
      {isVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl(work.id)}
          className="w-full aspect-video"
          controls={false}
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-muted to-background">
          <audio ref={videoRef as React.RefObject<HTMLAudioElement>} src={mediaUrl(work.id)} preload="metadata" />
          <div className="text-center">
            <p className="text-4xl mb-2">🎭</p>
            <p className="text-muted-foreground">音频模式</p>
          </div>
        </div>
      )}

      {/* Subtitle overlay */}
      {work.status === "completed" && activeSegment && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4 pointer-events-none">
          <div className="max-w-3xl text-center space-y-1 bg-black/60 px-6 py-3 rounded-lg backdrop-blur-sm">
            {activeSegment.speaker && (
              <Badge variant="secondary" className="pointer-events-auto mb-1">
                {activeSegment.speaker}
              </Badge>
            )}
            <p className="text-2xl font-medium text-white leading-relaxed drop-shadow">
              {activeSegment.wu_text}
            </p>
            {showMandarin && activeSegment.mandarin_text && (
              <p className="text-lg text-white/90 leading-relaxed drop-shadow">
                {activeSegment.mandarin_text}
              </p>
            )}
            {showEnglish && activeSegment.english_text && (
              <p className="text-base text-white/80 italic leading-relaxed drop-shadow">
                {activeSegment.english_text}
              </p>
            )}
            {showNotes && activeSegment.notes && (
              <p className="text-xs text-white/60 mt-1">💡 {activeSegment.notes}</p>
            )}
          </div>
        </div>
      )}

      {work.status === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white text-lg">AI 正在解析台词与翻译，请稍候...</p>
        </div>
      )}

      {work.status === "failed" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center text-white">
            <p className="text-lg">解析失败</p>
            <p className="text-sm text-white/70 max-w-md">{work.error_message}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-card border-t p-3 space-y-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <span className="text-sm tabular-nums w-20 text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" onClick={() => setMuted(!muted)}>
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
              if (videoRef.current) videoRef.current.volume = vol
            }}
            className="w-24"
          />
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            <Maximize className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={showMandarin} onCheckedChange={setShowMandarin} />
            普通话
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={showEnglish} onCheckedChange={setShowEnglish} />
            English
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={showNotes} onCheckedChange={setShowNotes} />
            文化注释
          </label>
        </div>
      </div>
    </div>
  )
}
