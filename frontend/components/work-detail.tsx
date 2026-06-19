"use client"

import { useState, useCallback } from "react"

import { MediaPlayer } from "@/components/media-player"
import { ScenePanel } from "@/components/scene-panel"
import { SegmentList } from "@/components/segment-list"
import { SummaryPanel } from "@/components/summary-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Work } from "@/lib/api"

interface WorkDetailProps {
  work: Work
}

export function WorkDetail({ work }: WorkDetailProps) {
  const [currentTime, setCurrentTime] = useState(0)

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  return (
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
  )
}
