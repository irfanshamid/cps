
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TaskFormDialog } from "@/components/owner/task-form-dialog"

type AddTaskButtonProps = {
  projects: { id: string; name: string }[]
  staff: { id: string; username: string }[]
  defaultProjectId?: string
}

export function AddTaskButton({ projects, staff, defaultProjectId }: AddTaskButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Progress
      </Button>
      <TaskFormDialog
        open={open}
        onOpenChange={setOpen}
        projects={projects}
        staff={staff}
        defaultProjectId={defaultProjectId}
      />
    </>
  )
}
