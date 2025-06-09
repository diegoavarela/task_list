import { useState } from 'react';
import { Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarView } from '@/components/calendar/CalendarView';
import { CalendarIntegration } from '@/components/calendar/CalendarIntegration';
import type { Task } from '@/types/task';

interface CalendarPageProps {
  tasks: Task[];
  onTaskEdit?: (task: Task) => void;
}

export function CalendarPage({ tasks, onTaskEdit }: CalendarPageProps) {
  const [showIntegration, setShowIntegration] = useState(false);

  const handleTaskClick = (task: Task) => {
    if (onTaskEdit) {
      onTaskEdit(task);
    }
  };

  const handleDateClick = (date: Date) => {
    // Could open a "add task" dialog for this date
    console.log('Date clicked:', date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your tasks in calendar format.
          </p>
        </div>
        <Button onClick={() => setShowIntegration(true)} className="gap-2">
          <Settings className="h-4 w-4" />
          Calendar Settings
        </Button>
      </div>

      <CalendarView 
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onDateClick={handleDateClick}
      />

      <CalendarIntegration
        isOpen={showIntegration}
        onClose={() => setShowIntegration(false)}
        tasks={tasks}
      />
    </div>
  );
}