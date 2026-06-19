import { Clapperboard, Languages, ScrollText, Sparkles } from "lucide-react"

const features = [
  {
    icon: Clapperboard,
    title: "上传戏剧音视频",
    desc: "支持 mp4、mov、avi、mkv、mp3、wav、flac、m4a 等多种格式。",
  },
  {
    icon: Languages,
    title: "三语同步字幕",
    desc: "吴语原文、普通话、English 随播放进度实时高亮显示。",
  },
  {
    icon: ScrollText,
    title: "剧情与背景解析",
    desc: "自动生成剧情梗概、场幕背景与角色介绍，辅助理解。",
  },
  {
    icon: Sparkles,
    title: "AI 驱动",
    desc: "由 mimo-v2-omni 与 qwen3.7-max 提供多模态与文本能力。",
  },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            让吴语戏剧被世界看见
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 font-serif">
            <span className="text-foreground">吴话可说</span>
            <span className="block text-primary mt-2">吴语戏剧解析</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            上传一段吴语戏剧音视频，AI 自动为你生成原文、普通话与英文三语字幕，
            并随剧情推进同步呈现舞台字幕、场景背景与角色介绍。
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
