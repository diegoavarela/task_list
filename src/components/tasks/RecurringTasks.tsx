import { useState } from 'react';
import { Repeat, Plus, X, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import type { Task } from '@/types/task';

interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number;
}

interface RecurringTasksProps {
  pattern: RecurringPattern | null;
  onPatternChange: (pattern: RecurringPattern | null) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export function RecurringTasks({ pattern, onPatternChange, disabled = false }: RecurringTasksProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempPattern, setTempPattern] = useState<RecurringPattern>(
    pattern || {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [1], // Default to Monday
    }
  );
  const { toast } = useToast();

  const handleStartEditing = () => {
    setIsEditing(true);
    setTempPattern(pattern || {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [1],
    });
  };

  const handleSave = () => {
    // Validate pattern
    if (tempPattern.type === 'weekly' && (!tempPattern.daysOfWeek || tempPattern.daysOfWeek.length === 0)) {
      toast({
        title: "Invalid pattern",
        description: "Please select at least one day of the week.",
        variant: "destructive"
      });
      return;
    }

    if (tempPattern.type === 'monthly' && (!tempPattern.dayOfMonth || tempPattern.dayOfMonth < 1 || tempPattern.dayOfMonth > 31)) {
      toast({
        title: "Invalid pattern",
        description: "Please enter a valid day of the month (1-31).",
        variant: "destructive"
      });
      return;
    }

    onPatternChange(tempPattern);
    setIsEditing(false);
    
    toast({
      title: "Recurring pattern saved",
      description: "Task will repeat according to the specified pattern."
    });
  };

  const handleCancel = () => {
    setTempPattern(pattern || {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [1],
    });
    setIsEditing(false);
  };

  const handleRemove = () => {
    onPatternChange(null);
    setIsEditing(false);
    
    toast({
      title: "Recurring pattern removed",
      description: "Task will no longer repeat."
    });
  };

  const formatPattern = (p: RecurringPattern): string => {
    const interval = p.interval === 1 ? '' : `every ${p.interval} `;
    
    switch (p.type) {
      case 'daily':
        return `Repeats ${interval}day${p.interval > 1 ? 's' : ''}`;
      
      case 'weekly':
        const days = p.daysOfWeek?.map(day => DAYS_OF_WEEK[day].short).join(', ') || '';
        return `Repeats ${interval}week${p.interval > 1 ? 's' : ''} on ${days}`;
      
      case 'monthly':
        const dayOfMonth = p.dayOfMonth || 1;
        const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
        return `Repeats ${interval}month${p.interval > 1 ? 's' : ''} on the ${dayOfMonth}${suffix}`;
      
      case 'yearly':
        return `Repeats ${interval}year${p.interval > 1 ? 's' : ''}`;
      
      default:
        return 'Custom pattern';
    }
  };

  const toggleDayOfWeek = (day: number) => {
    const currentDays = tempPattern.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    setTempPattern(prev => ({
      ...prev,
      daysOfWeek: newDays
    }));
  };

  if (disabled) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Repeat className="h-4 w-4" />
            <span className="text-sm">Recurring patterns not available for subtasks</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Recurring Pattern
          </CardTitle>
          {pattern && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!pattern && !isEditing ? (
          <div className="text-center py-4">
            <Repeat className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">No recurring pattern set</p>
            <Button onClick={handleStartEditing} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Pattern
            </Button>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            {/* Pattern Type */}
            <div>
              <Label className="text-sm font-medium">Repeat Type</Label>
              <Select
                value={tempPattern.type}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') =>
                  setTempPattern(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval */}
            <div>
              <Label className="text-sm font-medium">
                Every {tempPattern.interval} {tempPattern.type.slice(0, -2)}{tempPattern.interval > 1 ? 's' : ''}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={tempPattern.interval}
                  onChange={(e) =>
                    setTempPattern(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {tempPattern.type.slice(0, -2)}{tempPattern.interval > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Days of Week (for weekly) */}
            {tempPattern.type === 'weekly' && (
              <div>
                <Label className="text-sm font-medium">Days of Week</Label>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      variant={tempPattern.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDayOfWeek(day.value)}
                      className="text-xs h-8"
                    >
                      {day.short}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Day of Month (for monthly) */}
            {tempPattern.type === 'monthly' && (
              <div>
                <Label className="text-sm font-medium">Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={tempPattern.dayOfMonth || 1}
                  onChange={(e) =>
                    setTempPattern(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) || 1 }))
                  }
                  className="mt-1 w-20"
                />
              </div>
            )}

            {/* End Date */}
            <div>
              <Label className="text-sm font-medium">End Date (Optional)</Label>
              <Input
                type="date"
                value={tempPattern.endDate ? tempPattern.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setTempPattern(prev => ({
                    ...prev,
                    endDate: e.target.value ? new Date(e.target.value) : undefined
                  }))
                }
                className="mt-1"
              />
            </div>

            {/* Preview */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-muted-foreground">{formatPattern(tempPattern)}</p>
              {tempPattern.endDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Until {tempPattern.endDate.toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                Save Pattern
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Repeat className="h-3 w-3" />
                Active
              </Badge>
              <span className="text-sm">{formatPattern(pattern)}</span>
            </div>
            
            {pattern.endDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">Ends on {pattern.endDate.toLocaleDateString()}</span>
              </div>
            )}
            
            <Button onClick={handleStartEditing} variant="outline" size="sm">
              Edit Pattern
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}