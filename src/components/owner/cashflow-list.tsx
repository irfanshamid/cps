
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Cashflow } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { CashflowEditDialog } from "@/components/owner/cashflow-edit-dialog"
import { toast } from "sonner"

type CashflowWithProject = Cashflow & {
  project?: {
    id: string
    name: string
  } | null
}

interface CashflowListProps {
  cashflows: CashflowWithProject[]
}

export function CashflowList({ cashflows }: CashflowListProps) {
  const router = useRouter()
  const [editingCashflow, setEditingCashflow] = useState<Cashflow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const response = await fetch(`/api/owner/cashflow/${deletingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus cashflow")
      }

      toast.success("Cashflow berhasil dihapus")
      router.refresh()
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="space-y-2">
        {cashflows.map((cashflow) => (
          <div
            key={cashflow.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {cashflow.type === "IN" ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {cashflow.description || "Transaksi"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {cashflow.project && (
                      <span>Proyek: {cashflow.project.name}</span>
                    )}
                    {cashflow.category && (
                      <span>• {cashflow.category}</span>
                    )}
                    <span>
                      • {format(new Date(cashflow.createdAt), "dd MMM yyyy HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p
                  className={`font-bold ${
                    cashflow.type === "IN" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {cashflow.type === "IN" ? "+" : "-"} Rp{" "}
                  {Number(cashflow.amount).toLocaleString("id-ID")}
                </p>
                <Badge variant={cashflow.type === "IN" ? "default" : "secondary"}>
                  {cashflow.type}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingCashflow(cashflow)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeletingId(cashflow.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <CashflowEditDialog
        cashflow={editingCashflow}
        open={!!editingCashflow}
        onOpenChange={(open) => !open && setEditingCashflow(null)}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi ini akan dihapus permanen. Jika ini adalah pengeluaran proyek, 
              total pengeluaran proyek akan disesuaikan kembali.
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
    </>
  )
}
