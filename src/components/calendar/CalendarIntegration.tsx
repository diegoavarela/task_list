import { useState, useEffect } from 'react';
import { Calendar, Settings, RefreshCw, Plus, ExternalLink, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CalendarService } from '@/services/calendarService';
import type { CalendarProvider, Calendar as CalendarType, CalendarSettings } from '@/services/calendarService';
import type { Task } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';

interface CalendarIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: Task[];
}

export function CalendarIntegration({ isOpen, onClose, tasks = [] }: CalendarIntegrationProps) {
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>({} as CalendarSettings);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const loadedProviders = CalendarService.getProviders();
    const loadedSettings = CalendarService.getSettings();
    setProviders(loadedProviders);
    setSettings(loadedSettings);
  };

  const handleConnectProvider = async (providerId: string) => {
    setIsConnecting(providerId);
    try {
      const success = await CalendarService.connectProvider(providerId);
      if (success) {
        loadData();
        toast({
          title: 'Calendar connected',
          description: 'Your calendar has been connected successfully.',
        });
      } else {
        toast({
          title: 'Connection failed',
          description: 'Failed to connect to the calendar provider.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: 'An error occurred while connecting to the calendar.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnectProvider = (providerId: string) => {
    const success = CalendarService.disconnectProvider(providerId);
    if (success) {
      loadData();
      toast({
        title: 'Calendar disconnected',
        description: 'Your calendar has been disconnected.',
      });
    }
  };

  const handleRefreshProvider = async (providerId: string) => {
    setIsRefreshing(providerId);
    try {
      const success = await CalendarService.refreshProvider(providerId);
      if (success) {
        loadData();
        toast({
          title: 'Calendar refreshed',
          description: 'Calendar data has been updated.',
        });
      }
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh calendar data.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(null);
    }
  };

  const handleToggleCalendar = (calendarId: string, enabled: boolean) => {
    const updated = CalendarService.updateCalendar(calendarId, { enabled });
    if (updated) {
      loadData();
    }
  };

  const handleUpdateSettings = (updates: Partial<CalendarSettings>) => {
    const updated = CalendarService.updateSettings(updates);
    setSettings(updated);
    toast({
      title: 'Settings updated',
      description: 'Calendar settings have been saved.',
    });
  };

  const handleSyncTasks = async () => {
    try {
      await CalendarService.syncTasks(tasks);
      toast({
        title: 'Tasks synced',
        description: 'Your tasks have been synced to calendar.',
      });
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'Failed to sync tasks to calendar.',
        variant: 'destructive',
      });
    }
  };

  const getProviderIcon = (type: CalendarProvider['type']) => {
    switch (type) {
      case 'google':
        return '📅'; // In real app, use Google Calendar icon
      case 'apple':
        return '🍎'; // In real app, use Apple Calendar icon
      case 'outlook':
        return '📧'; // In real app, use Outlook icon
      case 'local':
        return '📋';
      default:
        return '📅';
    }
  };

  const connectedProviders = providers.filter(p => p.connected);
  const totalCalendars = providers.reduce((sum, p) => sum + p.calendars.length, 0);
  const enabledCalendars = providers.reduce((sum, p) => sum + p.calendars.filter(c => c.enabled).length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="calendars">Calendars</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4 mt-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{connectedProviders.length}</div>
                  <div className="text-xs text-muted-foreground">Connected</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{enabledCalendars}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalCalendars}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar Providers */}
            <div className="space-y-3">
              {providers.map((provider) => (
                <Card key={provider.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getProviderIcon(provider.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{provider.name}</h3>
                            {provider.connected ? (
                              <Badge className="bg-green-100 text-green-800 border-0">
                                <Check className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not connected</Badge>
                            )}
                          </div>
                          {provider.connected && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {provider.email && <div>{provider.email}</div>}
                              {provider.lastSync && (
                                <div>
                                  Last sync: {formatDistanceToNow(new Date(provider.lastSync), { addSuffix: true })}
                                </div>
                              )}
                              <div>{provider.calendars.length} calendar{provider.calendars.length !== 1 ? 's' : ''}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {provider.connected ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefreshProvider(provider.id)}
                              disabled={isRefreshing === provider.id}
                            >
                              <RefreshCw className={`h-4 w-4 ${isRefreshing === provider.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDisconnectProvider(provider.id)}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleConnectProvider(provider.id)}
                            disabled={isConnecting === provider.id}
                            size="sm"
                          >
                            {isConnecting === provider.id ? 'Connecting...' : 'Connect'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendars" className="space-y-4 mt-4">
            {connectedProviders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No calendar providers connected</p>
                <p className="text-xs">Connect a calendar provider to see your calendars</p>
              </div>
            ) : (
              connectedProviders.map((provider) => (
                <Card key={provider.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-lg">{getProviderIcon(provider.type)}</span>
                      {provider.name} Calendars
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {provider.calendars.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No calendars found</p>
                      </div>
                    ) : (
                      provider.calendars.map((calendar) => (
                        <div key={calendar.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: calendar.color }}
                            />
                            <div>
                              <p className="font-medium">{calendar.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {calendar.readOnly && <span>Read-only</span>}
                                {calendar.enabled ? (
                                  <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                    <Eye className="h-2 w-2 mr-1" />
                                    Enabled
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    <EyeOff className="h-2 w-2 mr-1" />
                                    Disabled
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={calendar.enabled}
                            onCheckedChange={(enabled) => handleToggleCalendar(calendar.id, enabled)}
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sync Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Sync tasks to calendar</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically create calendar events for tasks with due dates
                    </p>
                  </div>
                  <Switch
                    checked={settings.syncTasks}
                    onCheckedChange={(syncTasks) => handleUpdateSettings({ syncTasks })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Sync due dates</Label>
                    <p className="text-xs text-muted-foreground">
                      Include task due dates in calendar events
                    </p>
                  </div>
                  <Switch
                    checked={settings.syncDueDates}
                    onCheckedChange={(syncDueDates) => handleUpdateSettings({ syncDueDates })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-create events</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically create calendar events for new tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoCreateEvents}
                    onCheckedChange={(autoCreateEvents) => handleUpdateSettings({ autoCreateEvents })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default calendar</Label>
                  <Select
                    value={settings.defaultCalendarId || ''}
                    onValueChange={(defaultCalendarId) => 
                      handleUpdateSettings({ defaultCalendarId: defaultCalendarId || undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose default calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No default</SelectItem>
                      {providers
                        .filter(p => p.connected)
                        .flatMap(p => p.calendars)
                        .filter(c => c.enabled && !c.readOnly)
                        .map((calendar) => (
                          <SelectItem key={calendar.id} value={calendar.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: calendar.color }}
                              />
                              {calendar.name}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default event duration (minutes)</Label>
                  <Input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={settings.defaultEventDuration}
                    onChange={(e) => 
                      handleUpdateSettings({ defaultEventDuration: parseInt(e.target.value) || 60 })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sync Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleSyncTasks} className="w-full gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Sync {tasks.length} Task{tasks.length !== 1 ? 's' : ''} to Calendar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    This will create calendar events for tasks with due dates
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}