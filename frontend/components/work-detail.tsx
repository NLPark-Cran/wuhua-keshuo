"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import { AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MediaPlayer } from "@/components/media-player"
import { ScenePanel } from "@/components/scene-panel"
import { SegmentList } from "@/components/segment-list"
import { SummaryPanel } from "@/components/summary-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchWork, reprocessWork, type Work, type WorkStatus } from "@/lib/api"

const statusMeta: Record<
  WorkStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: { label: "待处理", icon: Clock, className: "text-muted-foreground" },
  processing: { label: "AI 解析中", icon: Loader2, className: "text-primary" },
  completed: { label: "解析完成", icon: CheckCircle2, className: "text-emerald-600" },
  failed: { label: "解析失败", icon: AlertCircle, className: "text-destructive" },
}

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

  const meta = statusMeta[work.status]
  const StatusIcon = meta.icon

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${meta.className}`}>
              <StatusIcon className={`h-5 w-5 ${work.status === "processing" ? "animate-spin" : ""}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">当前状态</p>
              <p className={`font-medium ${meta.className}`}>{meta.label}</p>
            </div>
          </div>

          {work.status === "failed" && work.error_message && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 max-w-xl">
              {work.error_message}
            </p>
          )}

          {work.status !== "processing" && work.status !== "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReprocess}
              disabled={reprocessing}
              className="shrink-0"
            >
              {reprocessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {reprocessing ? "提交中..." : "重新解析"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <MediaPlayer work={work} onSeek={handleSeek} />
        </div>
        <div className="space-y-6">
          <Tabs defaultValue="scenes" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="scenes">场景</TabsTrigger>
              <TabsTrigger value="summary">梗概</TabsTrigger>
              <TabsTrigger value="lines">台词</TabsTrigger>
            </TabsList>
            <TabsContent value="scenes" className="mt-3">
              <ScenePanel scenes={work.scenes} currentTime={currentTime} onSeek={handleSeek} />
            </TabsContent>
            <TabsContent value="summary" className="mt-3">
              <SummaryPanel summary={work.summary} characters={work.characters} />
            </TabsContent>
            <TabsContent value="lines" className="mt-3">
              <SegmentList segments={work.segments} currentTime={currentTime} onSeek={handleSeek} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
