
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Termin } from "@prisma/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, XCircle, Pencil, Trash2, MoreVertical } from "lucide-react"
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
import { TerminEditDialog } from "@/components/owner/termin-edit-dialog"
import { toast } from "sonner"

type TerminListProps = {
  termins: Termin[]
  projectId: string
}

export function TerminList({ termins, projectId }: TerminListProps) {
  const router = useRouter()
  const [editingTermin, setEditingTermin] = useState<Termin | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const response = await fetch(`/api/owner/projects/${projectId}/termin/${deletingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus termin")
      }

      toast.success("Termin berhasil dihapus")
      router.refresh()
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus")
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "APPROVED":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default" // or success if available
      case "APPROVED":
        return "secondary"
      case "REJECTED":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {termins.map((termin) => (
          <Card key={termin.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(termin.status)}
                    {termin.name}
                  </CardTitle>
                  {termin.description && (
                    <CardDescription className="mt-1">
                      {termin.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(termin.status)}>
                    {termin.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTermin(termin)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingId(termin.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    Rp {Number(termin.amount).toLocaleString("id-ID")}
                  </p>
                </div>
                {termin.percentage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Percentage</p>
                    <p className="font-medium">
                      {Number(termin.percentage).toFixed(1)}%
                    </p>
                  </div>
                )}
                {termin.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">
                      {format(new Date(termin.dueDate), "dd MMM yyyy")}
                    </p>
                  </div>
                )}
                {termin.paidDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Date</p>
                    <p className="font-medium">
                      {format(new Date(termin.paidDate), "dd MMM yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TerminEditDialog
        termin={editingTermin}
        open={!!editingTermin}
        onOpenChange={(open) => !open && setEditingTermin(null)}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Termin ini akan dihapus permanen.
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
