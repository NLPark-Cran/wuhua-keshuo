import { UploadForm } from "@/components/upload-form"
import { WorkList } from "@/components/work-list"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold tracking-tight">吴话可说</h1>
          <p className="text-muted-foreground mt-1">
            吴语戏剧解析网页应用 · 原文 / 普通话 / English 三语同步字幕
          </p>
        </div>
      </header>
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <UploadForm />
          <WorkList />
        </div>
      </div>
    </main>
  )
}
