"use client"

import { MapPin } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatTime, type Scene } from "@/lib/api"

interface ScenePanelProps {
  scenes: Scene[]
  currentTime: number
  onSeek: (time: number) => void
}

export function ScenePanel({ scenes, currentTime, onSeek }: ScenePanelProps) {
  const activeIndex = scenes.findIndex(
    (s, i) =>
      currentTime >= s.start_seconds &&
      (i === scenes.length - 1 || currentTime < scenes[i + 1].start_seconds)
  )
  const activeScene = activeIndex >= 0 ? scenes[activeIndex] : null

  return (
    <Card className="border-border/60 shadow-sm h-full">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> 场 / 幕背景
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 max-h-[55vh] overflow-y-auto">
        {scenes.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm">暂无场景信息</div>
        )}
        {activeScene && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="font-serif font-semibold text-primary">当前：{activeScene.title}</p>
            <p className="text-sm mt-2 leading-relaxed text-foreground/80">{activeScene.background}</p>
          </div>
        )}
        <div className="space-y-2">
          {scenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => onSeek(scene.start_seconds)}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all",
                activeScene?.id === scene.id
                  ? "bg-muted border-primary shadow-sm"
                  : "bg-card border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium font-serif">{scene.title}</span>
                <span className="text-xs text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded-full">
                  {formatTime(scene.start_seconds)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {scene.background}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
