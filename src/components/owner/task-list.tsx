
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Task } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Pencil, Trash2, Calendar, User, ClipboardList } from "lucide-react"
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
import { TaskFormDialog } from "@/components/owner/task-form-dialog"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

type TaskWithRelations = Task & {
  project: { id: string; name: string }
  pic?: { id: string; username: string } | null
}

interface TaskListProps {
  tasks: TaskWithRelations[]
  projects: { id: string; name: string }[]
  staff: { id: string; username: string }[]
}

export function TaskList({ tasks, projects, staff }: TaskListProps) {
  const router = useRouter()
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const response = await fetch(`/api/owner/progress/${deletingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus progress")
      }

      toast.success("Progress berhasil dihapus")
      router.refresh()
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <Badge variant="outline" className="text-muted-foreground bg-muted/50">
                  {task.project.name}
                </Badge>
                {task.deadline && (
                  <Badge variant={new Date(task.deadline) < new Date() && task.progress < 100 ? "destructive" : "secondary"} className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.deadline), "dd MMM yyyy")}
                  </Badge>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description || "Tidak ada deskripsi"}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{task.pic?.username || "Belum ada PIC"}</span>
                </div>
                {task.picNote && (
                  <div className="flex items-center gap-1" title={task.picNote}>
                    <ClipboardList className="h-4 w-4" />
                    <span className="truncate max-w-[150px]">{task.picNote}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingTask(task)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeletingId(task.id)}
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

      {editingTask && (
        <TaskFormDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          projects={projects}
          staff={staff}
          defaultProjectId={editingTask.projectId}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              Data progress ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
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
