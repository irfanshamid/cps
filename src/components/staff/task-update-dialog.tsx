
"use client"

import { useState, useEffect } from "react"
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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Task } from "@prisma/client"

type TaskUpdateDialogProps = {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskUpdateDialog({ task, open, onOpenChange }: TaskUpdateDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(task.progress)
  const [picNote, setPicNote] = useState(task.picNote || "")

  useEffect(() => {
    if (open) {
      setProgress(task.progress)
      setPicNote(task.picNote || "")
    }
  }, [open, task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/staff/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: Number(progress),
          picNote,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Gagal update progress")
      }

      toast.success("Progress berhasil diupdate")
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
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>
            Update persentase penyelesaian dan catatan lapangan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="progress">Progress (%)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                required
                disabled={loading}
              />
              <span className="text-sm font-medium w-12">{progress}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress} 
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="picNote">Catatan PIC</Label>
            <Textarea
              id="picNote"
              value={picNote}
              onChange={(e) => setPicNote(e.target.value)}
              placeholder="Catatan kendala atau info tambahan..."
              disabled={loading}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Progress"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
