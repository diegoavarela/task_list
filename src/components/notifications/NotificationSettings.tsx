import { useState, useEffect } from 'react';
import { Bell, Mail, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { NotificationService } from '@/services/notificationService';
import type { NotificationPreferences } from '@/types/notification';

interface NotificationSettingsProps {
  userId: string;
  onClose?: () => void;
}

export function NotificationSettings({ userId, onClose }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    NotificationService.getPreferences(userId)
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const notificationTypes = [
    {
      id: 'taskAssigned',
      label: 'Task Assigned',
      description: 'When a task is assigned to you'
    },
    {
      id: 'taskCompleted',
      label: 'Task Completed',
      description: 'When a task you\'re involved with is completed'
    },
    {
      id: 'commentAdded',
      label: 'New Comments',
      description: 'When someone comments on your tasks'
    },
    {
      id: 'commentMention',
      label: 'Mentions',
      description: 'When someone mentions you in a comment'
    },
    {
      id: 'dueDateReminder',
      label: 'Due Date Reminders',
      description: 'Reminders before tasks are due'
    },
    {
      id: 'taskOverdue',
      label: 'Overdue Tasks',
      description: 'When your tasks become overdue'
    },
    {
      id: 'taskUpdated',
      label: 'Task Updates',
      description: 'When tasks you\'re involved with are updated'
    }
  ];

  const handleSave = () => {
    setIsSaving(true);
    
    try {
      NotificationService.savePreferences(preferences);
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.'
      });
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'There was an error saving your preferences. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (type: keyof NotificationPreferences['inApp']) => {
    setPreferences(prev => ({
      ...prev,
      inApp: {
        ...prev.inApp,
        [type]: !prev.inApp[type]
      }
    }));
  };

  const handleTimingChange = (field: keyof NotificationPreferences['reminderTiming'], value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setPreferences(prev => ({
        ...prev,
        reminderTiming: {
          ...prev.reminderTiming,
          [field]: numValue
        }
      }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* In-App Notifications */}
          <div>
            <h3 className="text-sm font-medium mb-4">In-App Notifications</h3>
            <div className="space-y-3">
              {notificationTypes.map((type) => (
                <div key={type.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={type.id}
                    checked={preferences.inApp[type.id as keyof NotificationPreferences['inApp']]}
                    onCheckedChange={() => handleToggle(type.id as keyof NotificationPreferences['inApp'])}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={type.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Reminder Timing */}
          <div>
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reminder Timing
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDateReminder">
                    Due Date Reminder
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dueDateReminder"
                      type="number"
                      min="1"
                      max="1440"
                      value={preferences.reminderTiming.dueDateReminder}
                      onChange={(e) => handleTimingChange('dueDateReminder', e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutes before</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How early to remind you about upcoming due dates
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overdueReminder">
                    Overdue Reminder
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="overdueReminder"
                      type="number"
                      min="1"
                      max="1440"
                      value={preferences.reminderTiming.overdueReminder}
                      onChange={(e) => handleTimingChange('overdueReminder', e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutes after</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How soon after due date to send overdue reminders
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Browser Notifications */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-2">Browser Notifications</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Enable browser notifications to receive alerts even when the app is in the background
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const permission = await NotificationService.requestPermission();
                if (permission === 'granted') {
                  toast({
                    title: 'Notifications enabled',
                    description: 'You will now receive browser notifications.'
                  });
                } else {
                  toast({
                    title: 'Notifications blocked',
                    description: 'Please enable notifications in your browser settings.',
                    variant: 'destructive'
                  });
                }
              }}
            >
              Enable Browser Notifications
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}