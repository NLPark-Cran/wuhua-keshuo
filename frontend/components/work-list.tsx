"use client"

import Link from "next/link"
import useSWR from "swr"
import { AlertCircle, CheckCircle2, Clock, Film, Headphones, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchWorks, formatTime, type WorkStatus } from "@/lib/api"

const statusConfig: Record<
  WorkStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  pending: { label: "待处理", variant: "secondary", icon: Clock },
  processing: { label: "解析中", variant: "default", icon: Loader2 },
  completed: { label: "已完成", variant: "outline", icon: CheckCircle2 },
  failed: { label: "失败", variant: "destructive", icon: AlertCircle },
}

export function WorkList() {
  const { data, error, isLoading } = useSWR("works", fetchWorks, { refreshInterval: 5000 })

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="bg-muted/30">
        <CardTitle className="font-serif text-xl">已有剧目</CardTitle>
        <CardDescription>点击剧目进入播放与解析结果页</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 加载中...
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            加载失败，请刷新重试
          </div>
        )}
        {data && data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Film className="h-10 w-10 mb-3 opacity-40" />
            <p>暂无剧目</p>
            <p className="text-sm mt-1">上传第一个吴语戏剧开始解析</p>
          </div>
        )}
        {data && data.items.length > 0 && (
          <div className="grid gap-3">
            {data.items.map((work) => {
              const cfg = statusConfig[work.status]
              const Icon = cfg.icon
              const isAudio = !work.duration_seconds // simple heuristic, could be improved
              return (
                <Link
                  key={work.id}
                  href={`/works/${work.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    {isAudio ? <Headphones className="h-6 w-6" /> : <Film className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif font-semibold truncate transition-colors group-hover:text-primary">
                      {work.title}
                    </h3>
                    {work.description && (
                      <p className="text-sm text-muted-foreground truncate">{work.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {work.duration_seconds ? `时长 ${formatTime(work.duration_seconds)} · ` : ""}
                      {new Date(work.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <Badge variant={cfg.variant} className="shrink-0 gap-1">
                    <Icon className={`h-3 w-3 ${work.status === "processing" ? "animate-spin" : ""}`} />
                    {cfg.label}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
