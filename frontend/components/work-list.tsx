"use client"

import Link from "next/link"
import useSWR from "swr"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchWorks, formatTime, type WorkStatus } from "@/lib/api"

const statusLabels: Record<WorkStatus, string> = {
  pending: "待处理",
  processing: "解析中",
  completed: "已完成",
  failed: "失败",
}

const statusVariant: Record<WorkStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "default",
  completed: "outline",
  failed: "destructive",
}

export function WorkList() {
  const { data, error, isLoading } = useSWR("works", fetchWorks, { refreshInterval: 5000 })

  return (
    <Card>
      <CardHeader>
        <CardTitle>已有剧目</CardTitle>
        <CardDescription>点击剧目进入播放与解析结果页</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-muted-foreground">加载中...</p>}
        {error && <p className="text-destructive">加载失败</p>}
        {data && data.items.length === 0 && <p className="text-muted-foreground">暂无剧目，请先上传。</p>}
        {data && data.items.length > 0 && (
          <div className="space-y-3">
            {data.items.map((work) => (
              <Link
                key={work.id}
                href={`/works/${work.id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{work.title}</h3>
                  {work.description && (
                    <p className="text-sm text-muted-foreground truncate">{work.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {work.duration_seconds ? `时长 ${formatTime(work.duration_seconds)} · ` : ""}
                    {new Date(work.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>
                <Badge variant={statusVariant[work.status]}>{statusLabels[work.status]}</Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
