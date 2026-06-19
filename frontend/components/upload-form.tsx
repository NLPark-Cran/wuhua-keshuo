"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { createWork } from "@/lib/api"

export function UploadForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get("file") as File
    if (!file || file.size === 0) {
      setError("请选择音视频文件")
      return
    }

    setLoading(true)
    setProgress(30)
    try {
      const work = await createWork(formData)
      setProgress(100)
      router.push(`/works/${work.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败")
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传吴语戏剧</CardTitle>
        <CardDescription>支持 mp4、mov、avi、mkv、mp3、wav、flac、m4a</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">剧目名称</Label>
            <Input id="title" name="title" required placeholder="例如：《梁山伯与祝英台》" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">简介（可选）</Label>
            <Textarea id="description" name="description" rows={3} placeholder="剧种、演出团体、背景等" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">音视频文件</Label>
            <Input id="file" name="file" type="file" accept="video/*,audio/*" required />
          </div>
          {loading && <Progress value={progress} className="h-2" />}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "上传中..." : "开始解析"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
