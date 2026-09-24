import type { TaskPreset } from '@/data/tasks'

interface TaskSelectorProps {
  tasks: TaskPreset[]
  selectedId: string
  onSelect: (task: TaskPreset) => void
}

export function TaskSelector({ tasks, selectedId, onSelect }: TaskSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {tasks.map((task) => {
        const selected = task.id === selectedId
        return (
          <button
            key={task.id}
            type="button"
            onClick={() => onSelect(task)}
            aria-pressed={selected}
            className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors ${
              selected
                ? 'border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
            }`}
          >
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {task.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {task.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
