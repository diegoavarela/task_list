import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Task } from '@/types/task';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

interface TaskAnalyticsProps {
  tasks: Task[];
}

export function TaskAnalytics({ tasks }: TaskAnalyticsProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const thisWeek = { start: startOfWeek(now), end: endOfWeek(now) };
    const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };

    // Basic stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      !t.completed && 
      new Date(t.dueDate) < now
    ).length;
    const tasksThisWeek = tasks.filter(t => 
      t.createdAt && 
      isWithinInterval(new Date(t.createdAt), thisWeek)
    ).length;

    // Priority distribution
    const priorityData = [
      { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#dc2626' },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#d97706' },
      { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#16a34a' },
    ];

    // Status distribution
    const statusData = [
      { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#6b7280' },
      { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#2563eb' },
      { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#16a34a' },
      { name: 'Cancelled', value: tasks.filter(t => t.status === 'cancelled').length, color: '#dc2626' },
    ];

    // Completion rate over time (last 7 days)
    const completionData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const completedToday = tasks.filter(t => 
        t.completedAt && 
        isWithinInterval(new Date(t.completedAt), { start: dayStart, end: dayEnd })
      ).length;

      return {
        date: format(dayStart, 'MMM dd'),
        completed: completedToday,
      };
    });

    // Time tracking data (if available)
    const timeTrackingData = tasks
      .filter(t => t.estimatedHours && t.actualHours)
      .map(t => ({
        name: t.name.length > 20 ? t.name.substring(0, 20) + '...' : t.name,
        estimated: t.estimatedHours,
        actual: t.actualHours,
      }))
      .slice(0, 5); // Show only top 5

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksThisWeek,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      priorityData,
      statusData,
      completionData,
      timeTrackingData,
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{analytics.totalTasks}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{analytics.completedTasks}</p>
                <p className="text-xs text-muted-foreground">{analytics.completionRate}% completion rate</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{analytics.overdueTasks}</p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.tasksThisWeek}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {analytics.priorityData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.completionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  dot={{ fill: '#16a34a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Tracking */}
        {analytics.timeTrackingData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estimated vs Actual Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.timeTrackingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="estimated" fill="#93c5fd" name="Estimated" />
                  <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}