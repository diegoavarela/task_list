import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Eye, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarService } from '@/services/calendarService';
import type { CalendarEvent, Calendar as CalendarType } from '@/services/calendarService';
import type { Task } from '@/types/task';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateClick?: (date: Date) => void;
}

type ViewMode = 'month' | 'week' | 'agenda';

export function CalendarView({ tasks, onTaskClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  useEffect(() => {
    loadCalendarData();
  }, []);

  useEffect(() => {
    generateEvents();
  }, [tasks, calendars]);

  const loadCalendarData = () => {
    const allCalendars = CalendarService.getConnectedCalendars();
    setCalendars(allCalendars);
    setSelectedCalendarIds(allCalendars.map(c => c.id));
  };

  const generateEvents = async () => {
    try {
      const taskEvents = await CalendarService.syncTasks(tasks);
      setEvents(taskEvents);
    } catch (error) {
      console.error('Failed to generate calendar events:', error);
      setEvents([]);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => selectedCalendarIds.includes(event.calendarId));
  }, [events, selectedCalendarIds]);

  const toggleCalendar = (calendarId: string) => {
    setSelectedCalendarIds(prev => 
      prev.includes(calendarId) 
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.start, date));
  };

  const getTaskForEvent = (event: CalendarEvent): Task | undefined => {
    return tasks.find(task => task.id === event.taskId);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-2 border-r border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
              } ${isCurrentDay ? 'bg-primary/10' : ''}`}
              onClick={() => onDateClick?.(day)}
            >
              <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const task = getTaskForEvent(event);
                  const calendar = calendars.find(c => c.id === event.calendarId);
                  
                  return (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ 
                        backgroundColor: calendar?.color + '20',
                        color: calendar?.color,
                        border: `1px solid ${calendar?.color}30`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (task) onTaskClick?.(task);
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentDay = isToday(day);
          
          return (
            <div key={day.toISOString()} className="border-r">
              <div className={`p-3 border-b text-center ${isCurrentDay ? 'bg-primary/10' : ''}`}>
                <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                <div className={`text-lg font-medium ${isCurrentDay ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
              <div className="p-2 space-y-1 min-h-[400px]">
                {dayEvents.map((event) => {
                  const task = getTaskForEvent(event);
                  const calendar = calendars.find(c => c.id === event.calendarId);
                  
                  return (
                    <div
                      key={event.id}
                      className="text-xs p-2 rounded cursor-pointer hover:opacity-80"
                      style={{ 
                        backgroundColor: calendar?.color + '20',
                        color: calendar?.color,
                        border: `1px solid ${calendar?.color}30`
                      }}
                      onClick={() => {
                        if (task) onTaskClick?.(task);
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      {!event.isAllDay && (
                        <div>{format(event.start, 'HH:mm')}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAgendaView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthEvents = filteredEvents.filter(event => 
      event.start >= monthStart && event.start <= monthEnd
    ).sort((a, b) => a.start.getTime() - b.start.getTime());

    if (monthEvents.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No events this month</p>
        </div>
      );
    }

    const eventsByDate = monthEvents.reduce((acc, event) => {
      const dateKey = format(event.start, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);

    return (
      <div className="space-y-4">
        {Object.entries(eventsByDate).map(([dateKey, dateEvents]) => {
          const date = new Date(dateKey);
          const isCurrentDay = isToday(date);
          
          return (
            <Card key={dateKey}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base ${isCurrentDay ? 'text-primary' : ''}`}>
                  {format(date, 'EEEE, MMMM d, yyyy')}
                  {isCurrentDay && <Badge className="ml-2">Today</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dateEvents.map((event) => {
                  const task = getTaskForEvent(event);
                  const calendar = calendars.find(c => c.id === event.calendarId);
                  
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (task) onTaskClick?.(task);
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: calendar?.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-sm text-muted-foreground">{event.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {event.isAllDay ? 'All day' : format(event.start, 'HH:mm')}
                          {calendar && ` • ${calendar.name}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>

              {calendars.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Calendars ({selectedCalendarIds.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {calendars.map((calendar) => (
                      <DropdownMenuItem
                        key={calendar.id}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleCalendar(calendar.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: calendar.color }}
                          />
                          <span>{calendar.name}</span>
                        </div>
                        {selectedCalendarIds.includes(calendar.id) && (
                          <Eye className="h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-0">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'agenda' && (
            <div className="p-4">
              {renderAgendaView()}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No calendar events</p>
          <p className="text-xs">Connect a calendar provider and sync your tasks to see events</p>
        </div>
      )}
    </div>
  );
}