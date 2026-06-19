"use client"

import { BookOpen, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Character } from "@/lib/api"

interface SummaryPanelProps {
  summary?: string
  characters?: Character[]
}

export function SummaryPanel({ summary, characters }: SummaryPanelProps) {
  return (
    <Card className="border-border/60 shadow-sm h-full">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> 剧情梗概与角色
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
        <section>
          <h3 className="font-serif font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" /> 剧情梗概
          </h3>
          {summary ? (
            <p className="text-sm leading-[1.8] text-foreground/80">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">暂无剧情梗概</p>
          )}
        </section>
        <Separator />
        <section>
          <h3 className="font-serif font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" /> 角色介绍
          </h3>
          {characters && characters.length > 0 ? (
            <div className="grid gap-3">
              {characters.map((char, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border bg-muted/20 hover:border-primary/20 transition-colors"
                >
                  <p className="font-medium font-serif">{char.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{char.description}</p>
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
