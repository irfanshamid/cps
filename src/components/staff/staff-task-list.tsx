
"use client"

import { useState } from "react"
import { Task } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, Filter } from "lucide-react"
import { format } from "date-fns"
import { TaskUpdateDialog } from "@/components/staff/task-update-dialog"
import { Progress } from "@/components/ui/progress"

type TaskWithProject = Task & {
  project: { id: string; name: string }
}

interface StaffTaskListProps {
  tasks: TaskWithProject[]
  projects: string[] // Unique project names
}

export function StaffTaskList({ tasks, projects }: StaffTaskListProps) {
  const [search, setSearch] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null)

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase())
    const matchesProject = projectFilter === "all" || task.project.name === projectFilter
    return matchesSearch && matchesProject
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari tugas..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Proyek" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Proyek</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada tugas ditemukan.
          </div>
        ) : (
          filteredTasks.map((task) => (
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

                {task.picNote && (
                  <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded">
                    "{task.picNote}"
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 min-w-[200px]">
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                </div>
                <Button size="sm" onClick={() => setSelectedTask(task)}>
                  Update Progress
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTask && (
        <TaskUpdateDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </>
  )
}
