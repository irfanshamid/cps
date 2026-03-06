
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RAB, Cashflow } from "@prisma/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type UnifiedItem = {
  id: string
  source: "RAB" | "CASHFLOW"
  name: string
  description: string | null
  category: string
  quantity: number | null
  unit: string | null
  unitPriceRAB: number | null
  budgetRAB: number | null
  unitPriceReal: number | null
  budgetReal: number | null
  original: RAB | Cashflow
}

const DEFAULT_CATEGORIES = [
  "Pekerjaan Persiapan",
  "Pekerjaan Struktur",
  "Pekerjaan Arsitektur",
  "Pekerjaan ME / MEP",
  "Pekerjaan Finishing",
  "Lainnya",
]

export function RABTable({ rabs, cashflows }: { rabs: RAB[]; cashflows: Cashflow[] }) {
  const router = useRouter()
  const [editingItem, setEditingItem] = useState<UnifiedItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Merge and Normalize Data
  const items: UnifiedItem[] = [
    ...rabs.map((r) => ({
      id: r.id,
      source: "RAB" as const,
      name: r.name,
      description: r.description,
      category: r.category || "Tanpa Kategori",
      quantity: r.quantity ? Number(r.quantity) : null,
      unit: r.unit,
      unitPriceRAB: r.unitPrice ? Number(r.unitPrice) : null,
      budgetRAB: Number(r.budget),
      unitPriceReal: r.realUnitPrice ? Number(r.realUnitPrice) : null,
      // For RAB, budgetReal is spent (if updated correctly) or calculated
      budgetReal: r.spent ? Number(r.spent) : (r.quantity && r.realUnitPrice ? Number(r.quantity) * Number(r.realUnitPrice) : 0),
      original: r,
    })),
    ...cashflows.map((c) => ({
      id: c.id,
      source: "CASHFLOW" as const,
      name: c.description || "Pengeluaran Cashflow",
      description: null,
      category: c.category || "Tanpa Kategori",
      quantity: c.quantity ? Number(c.quantity) : null,
      unit: c.unit,
      unitPriceRAB: c.unitPrice ? Number(c.unitPrice) : null,
      budgetRAB: c.budget ? Number(c.budget) : 0,
      unitPriceReal: c.quantity && Number(c.quantity) > 0 ? Number(c.amount) / Number(c.quantity) : null,
      budgetReal: Number(c.amount),
      original: c,
    })),
  ]

  // Group by Category
  const groups = items.reduce<
    Record<
      string,
      {
        items: UnifiedItem[]
        totalBudgetRAB: number
        totalBudgetReal: number
      }
    >
  >((acc, item) => {
    const key = item.category
    const budgetRAB = item.budgetRAB || 0
    const budgetReal = item.budgetReal || 0

    if (!acc[key]) {
      acc[key] = {
        items: [],
        totalBudgetRAB: 0,
        totalBudgetReal: 0,
      }
    }

    acc[key].items.push(item)
    acc[key].totalBudgetRAB += budgetRAB
    acc[key].totalBudgetReal += budgetReal

    return acc
  }, {})

  // Calculate Grand Total
  const grand = Object.values(groups).reduce(
    (acc, g) => {
      acc.totalBudgetRAB += g.totalBudgetRAB
      acc.totalBudgetReal += g.totalBudgetReal
      return acc
    },
    { totalBudgetRAB: 0, totalBudgetReal: 0 }
  )

  let rowIndex = 1

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const item = items.find((i) => i.id === deletingId)
      if (!item) return

      const projectId = (item.original as any).projectId

      const res = await fetch(`/api/owner/projects/${projectId}/rab/${deletingId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Gagal menghapus item")
      
      toast.success("Item berhasil dihapus")
      router.refresh()
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft RAB & Realisasi</CardTitle>
        <CardDescription>
          Gabungan data RAB dan Cashflow Out.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/60">
                <th className="px-3 py-2 text-left w-12">No</th>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-right">Harga Satuan (RAB)</th>
                <th className="px-3 py-2 text-right">Total Budget (RAB)</th>
                <th className="px-3 py-2 text-right">Harga Satuan (Real)</th>
                <th className="px-3 py-2 text-right">Total Realisasi</th>
                <th className="px-3 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([category, group]) => (
                <>
                  <tr key={`cat-${category}`} className="bg-muted/40">
                    <td colSpan={9} className="px-3 py-2 font-semibold uppercase tracking-wide">
                      {category}
                    </td>
                  </tr>
                  {group.items.map((item) => (
                    <tr key={`${item.source}-${item.id}`} className="border-b last:border-0 hover:bg-muted/10">
                      <td className="px-3 py-2 align-top">{rowIndex++}</td>
                      <td className="px-3 py-2 align-top font-medium">
                        {item.name}
                        {item.source === "CASHFLOW" && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Cashflow
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {item.quantity ? item.quantity.toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="px-3 py-2 align-top">{item.unit || "-"}</td>
                      <td className="px-3 py-2 align-top text-right">
                        {item.unitPriceRAB ? `Rp ${item.unitPriceRAB.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {item.budgetRAB ? `Rp ${item.budgetRAB.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {item.unitPriceReal ? `Rp ${item.unitPriceReal.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {item.budgetReal ? `Rp ${item.budgetReal.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="px-3 py-2 align-top text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {item.source === "RAB" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr key={`subtotal-${category}`} className="border-t bg-muted/40 font-semibold">
                    <td colSpan={5} className="px-3 py-2 text-right">Subtotal {category}</td>
                    <td className="px-3 py-2 text-right">Rp {group.totalBudgetRAB.toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2 text-right">-</td>
                    <td className="px-3 py-2 text-right">Rp {group.totalBudgetReal.toLocaleString("id-ID")}</td>
                    <td />
                  </tr>
                </>
              ))}
              <tr className="bg-muted font-bold">
                <td colSpan={5} className="px-3 py-2 text-right">Grand Total</td>
                <td className="px-3 py-2 text-right">Rp {grand.totalBudgetRAB.toLocaleString("id-ID")}</td>
                <td className="px-3 py-2 text-right">-</td>
                <td className="px-3 py-2 text-right">Rp {grand.totalBudgetReal.toLocaleString("id-ID")}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>

      <EditItemDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Item RAB akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function EditItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item: UnifiedItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "1",
    unit: "",
    unitPriceRAB: "0",
    unitPriceReal: "0",
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity?.toString() || "1",
        unit: item.unit || "",
        unitPriceRAB: item.unitPriceRAB?.toString() || "0",
        unitPriceReal: item.unitPriceReal?.toString() || "0",
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    setLoading(true)

    try {
      const projectId = (item.original as any).projectId
      
      const qty = parseFloat(formData.quantity) || 0
      const priceRAB = parseFloat(formData.unitPriceRAB) || 0
      const priceReal = parseFloat(formData.unitPriceReal) || 0
      
      const budgetRAB = qty * priceRAB
      
      const payload: any = {
        quantity: qty,
        unit: formData.unit || undefined,
        unitPrice: priceRAB, 
        budget: budgetRAB,   
      }

      if (item.source === "RAB") {
        payload.name = formData.name
        payload.description = item.description || undefined
        payload.category = formData.category
        payload.realUnitPrice = priceReal
        payload.frequency = undefined
        payload.remarks = undefined
        
        const res = await fetch(`/api/owner/projects/${projectId}/rab/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Gagal update RAB")
      } else {
        const res = await fetch(`/api/owner/projects/${projectId}/cashflow/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Gagal update Cashflow RAB Details")
      }

      toast.success("Berhasil update item")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error("Gagal menyimpan perubahan")
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Item {item.source === "RAB" ? "RAB" : "Cashflow"}</DialogTitle>
          <DialogDescription>
            {item.source === "CASHFLOW" 
              ? "Anda hanya dapat mengedit detail RAB untuk item cashflow ini." 
              : "Edit detail item RAB."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            {item.source === "RAB" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Item
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Kategori
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Qty
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-24"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priceRAB" className="text-right">
                Harga RAB
              </Label>
              <div className="col-span-3">
                <Input
                  id="priceRAB"
                  type="number"
                  min="0"
                  value={formData.unitPriceRAB}
                  onChange={(e) => setFormData({ ...formData, unitPriceRAB: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total Budget: Rp {(parseFloat(formData.quantity || "0") * parseFloat(formData.unitPriceRAB || "0")).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {item.source === "RAB" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priceReal" className="text-right">
                  Harga Real
                </Label>
                <div className="col-span-3">
                  <Input
                    id="priceReal"
                    type="number"
                    min="0"
                    value={formData.unitPriceReal}
                    onChange={(e) => setFormData({ ...formData, unitPriceReal: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total Real: Rp {(parseFloat(formData.quantity || "0") * parseFloat(formData.unitPriceReal || "0")).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
