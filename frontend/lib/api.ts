export type WorkStatus = "pending" | "processing" | "completed" | "failed"

export interface WorkListItem {
  id: number
  title: string
  description?: string
  status: WorkStatus
  duration_seconds?: number
  created_at: string
}

export interface Segment {
  id: number
  work_id: number
  start_seconds: number
  end_seconds: number
  speaker?: string
  wu_text: string
  mandarin_text?: string
  english_text?: string
  notes?: string
}

export interface Scene {
  id: number
  work_id: number
  start_seconds: number
  end_seconds: number
  title: string
  background: string
}

export interface Character {
  name: string
  description: string
}

export interface Work {
  id: number
  title: string
  description?: string
  media_path: string
  audio_path?: string
  duration_seconds?: number
  status: WorkStatus
  summary?: string
  characters?: Character[]
  error_message?: string
  created_at: string
  updated_at: string
  segments: Segment[]
  scenes: Scene[]
}

export interface WorkListResponse {
  items: WorkListItem[]
  total: number
}

export async function fetchWorks(): Promise<WorkListResponse> {
  const res = await fetch("/api/works")
  if (!res.ok) throw new Error("Failed to fetch works")
  return res.json()
}

export async function fetchWork(id: number): Promise<Work> {
  const res = await fetch(`/api/works/${id}`)
  if (!res.ok) throw new Error("Failed to fetch work")
  return res.json()
}

export async function fetchWorkStatus(id: number): Promise<{
  id: number
  status: WorkStatus
  error_message?: string
  segment_count: number
  scene_count: number
}> {
  const res = await fetch(`/api/works/${id}/status`)
  if (!res.ok) throw new Error("Failed to fetch status")
  return res.json()
}

export async function createWork(formData: FormData): Promise<Work> {
  const res = await fetch("/api/works", {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || "Upload failed")
  }
  return res.json()
}

export async function reprocessWork(id: number): Promise<Work> {
  const res = await fetch(`/api/works/${id}/process`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to reprocess")
  return res.json()
}

export function mediaUrl(id: number): string {
  return `/api/works/${id}/media`
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}
