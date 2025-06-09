import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Settings, Trash2, X, AlertCircle, MessageSquare, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, formatDistanceToNow } from 'date-fns';
import { NotificationService } from '@/services/notificationService';
import type { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  userId: string;
  onNotificationClick?: (notification: Notification) => void;
  onSettingsClick?: () => void;
}

export function NotificationCenter({ 
  userId, 
  onNotificationClick,
  onSettingsClick 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Load initial notifications
    loadNotifications();

    // Check notification permission
    if ('Notification' in window) {
      setHasPermission(Notification.permission);
    }

    // Subscribe to new notifications
    const unsubscribe = NotificationService.onNotification(() => {
      loadNotifications();
    });

    // Refresh notifications periodically
    const interval = setInterval(loadNotifications, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [userId]);

  const loadNotifications = () => {
    const unread = NotificationService.getUnreadNotifications(userId);
    setNotifications(unread);
  };

  const handleNotificationClick = (notification: Notification) => {
    NotificationService.markAsRead(notification.id);
    loadNotifications();
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead(userId);
    loadNotifications();
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    NotificationService.deleteNotification(notificationId);
    loadNotifications();
  };

  const handleRequestPermission = async () => {
    const permission = await NotificationService.requestPermission();
    setHasPermission(permission);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <User className="h-4 w-4" />;
      case 'task_completed':
        return <CheckCheck className="h-4 w-4" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4" />;
      case 'comment_mention':
        return <MessageSquare className="h-4 w-4" />;
      case 'due_date_reminder':
        return <Clock className="h-4 w-4" />;
      case 'task_overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'task_overdue':
        return 'text-red-600 bg-red-50';
      case 'due_date_reminder':
        return 'text-orange-600 bg-orange-50';
      case 'comment_mention':
        return 'text-blue-600 bg-blue-50';
      case 'task_completed':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } else {
      return format(dateObj, 'MMM d, yyyy');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label={`Notifications ${notifications.length > 0 ? `(${notifications.length} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center font-medium">
              {notifications.length > 99 ? '99+' : notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="h-8 px-2 text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                {onSettingsClick && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSettingsClick}
                    className="h-8 w-8"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="p-0">
            {hasPermission === 'default' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Enable browser notifications to stay updated
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestPermission}
                  className="w-full"
                >
                  Enable Notifications
                </Button>
              </div>
            )}
            
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">No new notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-full flex-shrink-0",
                          getNotificationColor(notification.type)
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(e, notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}