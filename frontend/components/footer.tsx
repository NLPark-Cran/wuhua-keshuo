import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-serif font-semibold text-lg">吴话可说</p>
            <p className="text-sm text-muted-foreground">
              Python 与人工智能应用 · 大作业项目
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">首页</Link>
            <a
              href="https://github.com/NLPark-Cran/wuhua-keshuo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} 吴话可说. Powered by Next.js, FastAPI & TokenDance.
        </div>
      </div>
    </footer>
  )
}
