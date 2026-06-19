import { Footer } from "@/components/footer"
import { Hero } from "@/components/hero"
import { SiteHeader } from "@/components/site-header"
import { UploadForm } from "@/components/upload-form"
import { WorkList } from "@/components/work-list"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <Hero />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <UploadForm />
          </div>
          <div className="lg:col-span-3">
            <WorkList />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
