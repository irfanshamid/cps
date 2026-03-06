
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Task } from "@prisma/client"
import { format } from "date-fns"

type ProjectOption = {
  id: string
  name: string
}

type StaffOption = {
  id: string
  username: string
}

type TaskFormDialogProps = {
  task?: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectOption[]
  staff: StaffOption[]
  defaultProjectId?: string
}

export function TaskFormDialog({ 
  task, 
  open, 
  onOpenChange, 
  projects, 
  staff,
  defaultProjectId 
}: TaskFormDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    progress: "0",
    projectId: defaultProjectId || "",
    picId: "none",
    picNote: "",
    deadline: "",
  })

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        progress: String(task.progress),
        projectId: task.projectId,
        picId: task.picId || "none",
        picNote: task.picNote || "",
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
      })
    } else {
      setForm({
        title: "",
        description: "",
        progress: "0",
        projectId: defaultProjectId || "",
        picId: "none",
        picNote: "",
        deadline: "",
      })
    }
  }, [task, open, defaultProjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.projectId) {
      toast.error("Judul dan Proyek wajib diisi")
      return
    }

    setLoading(true)

    try {
      const url = task ? `/api/owner/progress/${task.id}` : "/api/owner/progress"
      const method = task ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          progress: Number(form.progress),
          projectId: form.projectId,
          picId: form.picId === "none" ? null : form.picId,
          picNote: form.picNote,
          deadline: form.deadline || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan progress")
      }

      toast.success(task ? "Progress berhasil diupdate" : "Progress berhasil ditambahkan")
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Progress" : "Tambah Progress Baru"}</DialogTitle>
          <DialogDescription>
            Kelola progress pekerjaan proyek.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Proyek</Label>
            <Select
              value={form.projectId}
              onValueChange={(value) => setForm((f) => ({ ...f, projectId: value }))}
              disabled={loading || !!defaultProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih proyek" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul Pekerjaan</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: Pemasangan Atap"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Detail pekerjaan..."
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) => setForm((f) => ({ ...f, progress: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>PIC (Tim Lapangan)</Label>
            <Select
              value={form.picId}
              onValueChange={(value) => setForm((f) => ({ ...f, picId: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih PIC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Belum ada PIC</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="picNote">Catatan PIC</Label>
            <Textarea
              id="picNote"
              value={form.picNote}
              onChange={(e) => setForm((f) => ({ ...f, picNote: e.target.value }))}
              placeholder="Catatan dari lapangan..."
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
