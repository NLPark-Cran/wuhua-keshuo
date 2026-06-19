"use client"

import { useEffect, useRef } from "react"
import { MessageSquare } from "lucide-react"

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
    <Card className="border-border/60 shadow-sm h-full">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> 台词列表
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 max-h-[60vh] overflow-y-auto">
        {segments.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">暂无台词</div>
        )}
        <div className="space-y-2">
          {segments.map((seg, idx) => (
            <button
              key={seg.id}
              ref={idx === activeIndex ? activeRef : null}
              onClick={() => onSeek(seg.start_seconds)}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all",
                idx === activeIndex
                  ? "bg-primary/10 border-primary shadow-sm"
                  : "bg-card border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <span className="tabular-nums bg-muted px-1.5 py-0.5 rounded">
                  {formatTime(seg.start_seconds)}
                </span>
                {seg.speaker && (
                  <span className="font-medium text-foreground/70">· {seg.speaker}</span>
                )}
              </div>
              <p className="text-sm font-medium leading-relaxed">{seg.wu_text}</p>
              {seg.mandarin_text && (
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {seg.mandarin_text}
                </p>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
