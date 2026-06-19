import { notFound } from "next/navigation"

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
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold tracking-tight">{work.title}</h1>
          {work.description ? (
            <p className="text-muted-foreground mt-1">{work.description}</p>
          ) : (
            <p className="text-muted-foreground mt-1">吴语戏剧解析结果</p>
          )}
        </div>
      </header>
      <div className="container mx-auto py-8 px-4">
        <WorkDetail work={work} />
      </div>
    </main>
  )
}
