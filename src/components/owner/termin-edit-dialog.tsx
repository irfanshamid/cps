
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Termin } from "@prisma/client"
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
import { format } from "date-fns"

type TerminEditDialogProps = {
  termin: Termin | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TerminEditDialog({ termin, open, onOpenChange }: TerminEditDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    amount: "",
    percentage: "",
    dueDate: "",
    status: "PENDING",
  })

  useEffect(() => {
    if (termin) {
      setForm({
        name: termin.name,
        description: termin.description || "",
        amount: termin.amount.toString(),
        percentage: termin.percentage ? termin.percentage.toString() : "",
        dueDate: termin.dueDate ? format(new Date(termin.dueDate), "yyyy-MM-dd") : "",
        status: termin.status,
      })
    }
  }, [termin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termin) return
    setLoading(true)

    try {
      const response = await fetch(`/api/owner/projects/${termin.projectId}/termin/${termin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount) || 0,
          percentage: form.percentage ? parseFloat(form.percentage) : null,
          dueDate: form.dueDate || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Gagal update termin")
      }

      toast.success("Termin berhasil diupdate!")
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  if (!termin) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Termin</DialogTitle>
          <DialogDescription>
            Ubah detail termin pembayaran.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-termin-name">Nama Termin *</Label>
            <Input
              id="edit-termin-name"
              placeholder="Contoh: Termin 1, DP 30%"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-termin-description">Deskripsi</Label>
            <Textarea
              id="edit-termin-description"
              rows={3}
              placeholder="Keterangan tambahan..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-termin-amount">Amount (Rp) *</Label>
              <Input
                id="edit-termin-amount"
                type="number"
                min="0"
                step="1000"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-termin-percentage">Percentage (%)</Label>
              <Input
                id="edit-termin-percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Opsional"
                value={form.percentage}
                onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="edit-termin-duedate">Jatuh Tempo</Label>
              <Input
                id="edit-termin-duedate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                disabled={loading}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="edit-termin-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm((f) => ({ ...f, status: val }))}
                disabled={loading}
              >
                <SelectTrigger id="edit-termin-status">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
