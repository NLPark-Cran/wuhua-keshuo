"use client"

import { useRef, useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatTime, type Segment } from "@/lib/api"

interface SegmentListProps {
  segments: Segment[]
  currentTime: number
  onSeek: (time: number) => void
}

export function SegmentList({ segments, currentTime, onSeek }: SegmentListProps) {
  const activeRef = useRef<HTMLButtonElement>(null)
  const activeIndex = segments.findIndex(
    (s, i) =>
      currentTime >= s.start_seconds &&
      (i === segments.length - 1 || currentTime < segments[i + 1].start_seconds)
  )

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [activeIndex])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>台词列表</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[60vh] overflow-y-auto">
        {segments.length === 0 && <p className="text-muted-foreground">暂无台词</p>}
        <div className="space-y-2">
          {segments.map((seg, idx) => (
            <button
              key={seg.id}
              ref={idx === activeIndex ? activeRef : null}
              onClick={() => onSeek(seg.start_seconds)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                idx === activeIndex ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="tabular-nums">{formatTime(seg.start_seconds)}</span>
                {seg.speaker && <span>· {seg.speaker}</span>}
              </div>
              <p className="text-sm font-medium">{seg.wu_text}</p>
              {seg.mandarin_text && <p className="text-xs text-muted-foreground mt-1">{seg.mandarin_text}</p>}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
