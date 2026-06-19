"use client"

import { cn } from "@/lib/utils"
import { formatTime, type Scene } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ScenePanelProps {
  scenes: Scene[]
  currentTime: number
  onSeek: (time: number) => void
}

export function ScenePanel({ scenes, currentTime, onSeek }: ScenePanelProps) {
  const activeScene = scenes.find(
    (s, i) =>
      currentTime >= s.start_seconds &&
      (i === scenes.length - 1 || currentTime < scenes[i + 1].start_seconds)
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>场/幕背景</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[50vh] overflow-y-auto">
        {scenes.length === 0 && <p className="text-muted-foreground">暂无场景信息</p>}
        {activeScene && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="font-semibold text-primary">当前：{activeScene.title}</p>
            <p className="text-sm mt-1 leading-relaxed">{activeScene.background}</p>
          </div>
        )}
        <div className="space-y-2">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onSeek(scene.start_seconds)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                activeScene?.id === scene.id ? "bg-muted border-primary" : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{scene.title}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatTime(scene.start_seconds)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{scene.background}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
