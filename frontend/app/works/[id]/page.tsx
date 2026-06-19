import { notFound } from "next/navigation"

import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { WorkDetail } from "@/components/work-detail"
import type { Work } from "@/lib/api"

export const dynamic = "force-dynamic"

async function getWork(id: number): Promise<Work | null> {
  const base = process.env.API_BASE_URL || "http://127.0.0.1:8005"
  try {
    const res = await fetch(`${base}/api/works/${id}`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const work = await getWork(Number(id))
  if (!work) notFound()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <header className="border-b border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-medium text-primary mb-2">吴语戏剧解析结果</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-serif">{work.title}</h1>
            {work.description && (
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{work.description}</p>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-10">
        <WorkDetail initialWork={work} />
      </main>
      <Footer />
    </div>
  )
}
