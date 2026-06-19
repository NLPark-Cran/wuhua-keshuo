"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { FileAudio, FileVideo, Loader2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createWork } from "@/lib/api"

export function UploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) setFile(dropped)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    if (!file) {
      setError("请先选择或拖拽一个音视频文件")
      return
    }
    formData.set("file", file)

    setLoading(true)
    setProgress(20)
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

  const fileType = file?.type.startsWith("video/") ? "video" : file?.type.startsWith("audio/") ? "audio" : null
  const FileIcon = fileType === "video" ? FileVideo : FileAudio

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="bg-muted/30">
        <CardTitle className="font-serif text-xl">上传吴语戏剧</CardTitle>
        <CardDescription>支持 mp4、mov、avi、mkv、mp3、wav、flac、m4a</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">剧目名称</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="例如：《梁山伯与祝英台》"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">简介（可选）</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="剧种、演出团体、背景等"
              className="bg-background resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>音视频文件</Label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input
                id="file"
                name="file"
                type="file"
                accept="video/*,audio/*"
                required
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileIcon className="h-6 w-6" />
                  </div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                  >
                    <X className="h-3 w-3" /> 移除
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="font-medium">点击或拖拽文件到此处</p>
                  <p className="text-sm text-muted-foreground mt-1">支持视频与音频格式，最大 2GB</p>
                </>
              )}
            </div>
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>正在上传并提交解析任务</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading || !file} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 上传中...
              </>
            ) : (
              "开始解析"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
