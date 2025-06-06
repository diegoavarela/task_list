import { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types/task';
import { PriorityBadge } from '@/components/tasks/PriorityBadge';
import { StatusBadge } from '@/components/tasks/StatusBadge';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

interface TaskCalendarProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  task: Task;
  resource?: any;
}

export function TaskCalendar({ tasks, onSelectTask, onSelectSlot }: TaskCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [date, setDate] = useState(new Date());

  // Convert tasks to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return tasks
      .filter(task => task.dueDate && !task.isArchived)
      .map(task => {
        const dueDate = new Date(task.dueDate!);
        
        // If there's a due time, use it; otherwise use the full day
        let start = dueDate;
        let end = dueDate;
        
        if (task.dueTime) {
          const [hours, minutes] = task.dueTime.split(':').map(Number);
          start = new Date(dueDate);
          start.setHours(hours, minutes, 0, 0);
          end = new Date(start);
          end.setHours(hours + 1, minutes, 0, 0); // 1 hour duration by default
        } else {
          // All day event
          end = new Date(dueDate);
          end.setDate(end.getDate() + 1);
        }

        return {
          id: task.id,
          title: task.name,
          start,
          end,
          allDay: !task.dueTime,
          task,
          resource: task,
        };
      });
  }, [tasks]);

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const task = event.task;
    return (
      <div className="p-1 text-xs">
        <div className="font-medium truncate">{task.name}</div>
        <div className="flex items-center gap-1 mt-1">
          <PriorityBadge priority={task.priority} className="scale-75" />
          {task.status !== 'todo' && (
            <StatusBadge status={task.status} className="scale-75" />
          )}
        </div>
      </div>
    );
  };

  // Custom event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const task = event.task;
    let backgroundColor = '#3174ad';
    
    // Color based on priority
    switch (task.priority) {
      case 'high':
        backgroundColor = '#dc2626'; // red-600
        break;
      case 'medium':
        backgroundColor = '#d97706'; // amber-600
        break;
      case 'low':
        backgroundColor = '#16a34a'; // green-600
        break;
    }

    // Adjust opacity based on status
    if (task.completed || task.status === 'completed') {
      backgroundColor = '#9ca3af'; // gray-400
    } else if (task.status === 'cancelled') {
      backgroundColor = '#ef4444'; // red-500
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: task.completed ? 0.7 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectTask?.(event.task);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    onSelectSlot?.(slotInfo);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Task Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              Day
            </Button>
            <Button
              variant={view === 'agenda' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('agenda')}
            >
              Agenda
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent,
            }}
            step={60}
            showMultiDayTimes
            popup
            style={{ height: '100%', padding: '1rem' }}
            messages={{
              next: 'Next',
              previous: 'Previous',
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Time',
              event: 'Task',
              noEventsInRange: 'No tasks in this date range',
              showMore: (total: number) => `+${total} more`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}