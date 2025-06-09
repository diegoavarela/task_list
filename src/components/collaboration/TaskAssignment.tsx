import { useState, useEffect } from 'react';
import { UserPlus, X, Check, Clock, AlertCircle, Search, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { UserService } from '@/services/userService';
import type { User, TaskAssignment } from '@/types/user';
import type { Task } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';

interface TaskAssignmentProps {
  task: Task;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  disabled?: boolean;
}

export function TaskAssignment({ task, onTaskUpdate, disabled = false }: TaskAssignmentProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const currentUser = UserService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, [task.id]);

  const loadData = () => {
    const allUsers = UserService.getUsers();
    const taskAssignments = UserService.getTaskAssignments(task.id);
    setUsers(allUsers);
    setAssignments(taskAssignments);
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const assignedUserIds = assignments.map(a => a.assignedTo);
  const availableUsers = filteredUsers.filter(user => !assignedUserIds.includes(user.id));

  const handleAssignUser = async () => {
    if (!selectedUser || isAssigning) return;

    setIsAssigning(true);
    try {
      const assignment = UserService.assignTask(
        task.id,
        selectedUser,
        currentUser.id,
        assignmentNotes || undefined
      );

      setAssignments(prev => [...prev, assignment]);
      setSelectedUser('');
      setAssignmentNotes('');
      setSearchQuery('');

      // Update task assignee if this is the first assignment
      if (assignments.length === 0) {
        onTaskUpdate(task.id, { assignedToId: selectedUser });
      }

      toast({
        title: 'User assigned',
        description: 'The task has been assigned successfully.',
      });
    } catch (error) {
      toast({
        title: 'Assignment failed',
        description: 'There was an error assigning the task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    const success = UserService.removeAssignment(assignmentId);
    if (success) {
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      
      // If this was the last assignment, clear the task assignee
      if (assignments.length === 1) {
        onTaskUpdate(task.id, { assignedToId: undefined });
      }
      
      toast({
        title: 'Assignment removed',
        description: 'The user has been unassigned from this task.',
      });
    }
  };

  const handleUpdateAssignmentStatus = (assignmentId: string, status: TaskAssignment['status']) => {
    const updatedAssignment = UserService.updateAssignment(assignmentId, { status });
    if (updatedAssignment) {
      setAssignments(prev => 
        prev.map(a => a.id === assignmentId ? updatedAssignment : a)
      );
      
      toast({
        title: 'Assignment updated',
        description: `Assignment status changed to ${status}.`,
      });
    }
  };

  const getStatusColor = (status: TaskAssignment['status']) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TaskAssignment['status']) => {
    switch (status) {
      case 'assigned': return <Clock className="h-3 w-3" />;
      case 'accepted': return <Check className="h-3 w-3" />;
      case 'declined': return <X className="h-3 w-3" />;
      case 'completed': return <Check className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (disabled) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Task assignment is not available for this task.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Assignments */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              Assigned Users ({assignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.map((assignment) => {
              const user = users.find(u => u.id === assignment.assignedTo);
              if (!user) return null;

              return (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {assignment.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{assignment.notes}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Assigned {formatDistanceToNow(new Date(assignment.assignedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(assignment.status)} border-0`}>
                      {getStatusIcon(assignment.status)}
                      <span className="ml-1 capitalize">{assignment.status}</span>
                    </Badge>
                    
                    {assignment.assignedTo !== currentUser.id && (
                      <>
                        <Select 
                          value={assignment.status} 
                          onValueChange={(status: TaskAssignment['status']) => 
                            handleUpdateAssignmentStatus(assignment.id, status)
                          }
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Assign New User */}
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assign Task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User Selection */}
          {availableUsers.length > 0 ? (
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user to assign..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No available users to assign</p>
              <p className="text-xs">All workspace members are already assigned to this task</p>
            </div>
          )}

          {/* Assignment Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any specific instructions or context for the assignee..."
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Assign Button */}
          <Button
            onClick={handleAssignUser}
            disabled={!selectedUser || isAssigning}
            className="w-full gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {isAssigning ? 'Assigning...' : 'Assign Task'}
          </Button>
        </CardContent>
      </Card>

      {/* No Assignments Message */}
      {assignments.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No users assigned</p>
          <p className="text-xs">Assign team members to collaborate on this task</p>
        </div>
      )}
    </div>
  );
}