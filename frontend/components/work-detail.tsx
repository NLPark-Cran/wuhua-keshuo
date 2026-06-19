"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { MediaPlayer } from "@/components/media-player"
import { ScenePanel } from "@/components/scene-panel"
import { SegmentList } from "@/components/segment-list"
import { SummaryPanel } from "@/components/summary-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchWork, reprocessWork, type Work } from "@/lib/api"

interface WorkDetailProps {
  initialWork: Work
}

export function WorkDetail({ initialWork }: WorkDetailProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [reprocessing, setReprocessing] = useState(false)

  const { data: work, mutate } = useSWR(
    [`work`, initialWork.id],
    () => fetchWork(initialWork.id),
    {
      fallbackData: initialWork,
      refreshInterval: (data) =>
        data && (data.status === "processing" || data.status === "pending") ? 3000 : 0,
    }
  )

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  async function handleReprocess() {
    setReprocessing(true)
    try {
      await reprocessWork(work.id)
      mutate()
    } finally {
      setReprocessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          状态：
          <span className="font-medium text-foreground">
            {work.status === "completed"
              ? "已完成"
              : work.status === "processing"
                ? "解析中..."
                : work.status === "failed"
                  ? "解析失败"
                  : "待处理"}
          </span>
          {work.status === "failed" && work.error_message && (
            <span className="ml-2 text-destructive">{work.error_message}</span>
          )}
        </div>
        {work.status !== "processing" && work.status !== "pending" && (
          <Button size="sm" variant="outline" onClick={handleReprocess} disabled={reprocessing}>
            {reprocessing ? "提交中..." : "重新解析"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MediaPlayer work={work} onSeek={handleSeek} />
        </div>
        <div className="space-y-6">
          <Tabs defaultValue="scenes">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scenes">场景</TabsTrigger>
              <TabsTrigger value="summary">梗概</TabsTrigger>
              <TabsTrigger value="lines">台词</TabsTrigger>
            </TabsList>
            <TabsContent value="scenes" className="mt-2">
              <ScenePanel scenes={work.scenes} currentTime={currentTime} onSeek={handleSeek} />
            </TabsContent>
            <TabsContent value="summary" className="mt-2">
              <SummaryPanel summary={work.summary} characters={work.characters} />
            </TabsContent>
            <TabsContent value="lines" className="mt-2">
              <SegmentList segments={work.segments} currentTime={currentTime} onSeek={handleSeek} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
