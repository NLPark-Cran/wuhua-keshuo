"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Character } from "@/lib/api"

interface SummaryPanelProps {
  summary?: string
  characters?: Character[]
}

export function SummaryPanel({ summary, characters }: SummaryPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>剧情梗概与角色</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
        <section>
          <h3 className="font-semibold mb-2">剧情梗概</h3>
          {summary ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">暂无剧情梗概</p>
          )}
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">角色介绍</h3>
          {characters && characters.length > 0 ? (
            <div className="grid gap-3">
              {characters.map((char, idx) => (
                <div key={idx} className="p-3 rounded-lg border">
                  <p className="font-medium">{char.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{char.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无角色信息</p>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
