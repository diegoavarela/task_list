import { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, Trash2, Edit, MoreVertical, Search, Crown, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { UserService } from '@/services/userService';
import type { User, WorkspaceInvite } from '@/types/user';
import { format, formatDistanceToNow } from 'date-fns';

interface UserManagementProps {
  onClose?: () => void;
}

export function UserManagement({ onClose }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceInvite['role']>('member');
  const { toast } = useToast();

  const currentUser = UserService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allUsers = UserService.getUsers();
    const allInvites = UserService.getInvites();
    setUsers(allUsers);
    setInvites(allInvites);
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handleInviteUser = () => {
    if (!inviteEmail.trim()) return;

    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase());
    if (existingUser) {
      toast({
        title: 'User already exists',
        description: 'A user with this email is already in the workspace.',
        variant: 'destructive',
      });
      return;
    }

    // Check if invite already sent
    const existingInvite = invites.find(i => 
      i.email.toLowerCase() === inviteEmail.toLowerCase() && 
      i.status === 'pending'
    );
    if (existingInvite) {
      toast({
        title: 'Invitation already sent',
        description: 'An invitation has already been sent to this email.',
        variant: 'destructive',
      });
      return;
    }

    const invite = UserService.createInvite(
      inviteEmail.trim(),
      inviteRole,
      currentUser.id
    );

    setInvites(prev => [...prev, invite]);
    setInviteEmail('');
    setShowInviteDialog(false);

    toast({
      title: 'Invitation sent',
      description: `An invitation has been sent to ${invite.email}.`,
    });
  };

  const handleUpdateUserRole = (userId: string, newRole: User['role']) => {
    if (userId === currentUser.id && newRole !== 'owner') {
      toast({
        title: 'Cannot change your own role',
        description: 'You cannot change your own role as the workspace owner.',
        variant: 'destructive',
      });
      return;
    }

    const updatedUser = UserService.updateUser(userId, { role: newRole });
    if (updatedUser) {
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      toast({
        title: 'Role updated',
        description: `User role has been changed to ${newRole}.`,
      });
    }
  };

  const handleRemoveUser = (userId: string) => {
    if (userId === currentUser.id) {
      toast({
        title: 'Cannot remove yourself',
        description: 'You cannot remove yourself from the workspace.',
        variant: 'destructive',
      });
      return;
    }

    const success = UserService.removeUser(userId);
    if (success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: 'User removed',
        description: 'The user has been removed from the workspace.',
      });
    }
  };

  const handleRevokeInvite = (inviteId: string) => {
    const success = UserService.revokeInvite(inviteId);
    if (success) {
      setInvites(prev => prev.map(inv => 
        inv.id === inviteId ? { ...inv, status: 'declined' } : inv
      ));
      toast({
        title: 'Invitation revoked',
        description: 'The invitation has been revoked.',
      });
    }
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'member': return <UserCheck className="h-4 w-4" />;
      case 'viewer': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'invited': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const pendingInvites = invites.filter(i => i.status === 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workspace Members
            </CardTitle>
            <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getRoleColor(user.role)} border-0`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">{user.role}</span>
                          </Badge>
                          <Badge className={`${getStatusColor(user.status)} border-0`}>
                            {user.status}
                          </Badge>
                        </div>
                        {user.lastActiveAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last active {formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>

                    {user.id !== currentUser.id && currentUser.role === 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingUser(user);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getRoleColor(invite.role as User['role'])} border-0`}>
                          {getRoleIcon(invite.role as User['role'])}
                          <span className="ml-1 capitalize">{invite.role}</span>
                        </Badge>
                        <Badge variant="outline">
                          Invited {formatDistanceToNow(new Date(invite.invitedAt), { addSuffix: true })}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(value: WorkspaceInvite['role']) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      {getRoleIcon('viewer')}
                      Viewer - Can view tasks
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      {getRoleIcon('member')}
                      Member - Can create and edit tasks
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      {getRoleIcon('admin')}
                      Admin - Full workspace access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={!inviteEmail.trim()}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(editingUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingUser.name}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value: User['role']) => {
                    setEditingUser(prev => prev ? { ...prev, role: value } : null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        {getRoleIcon('viewer')}
                        Viewer
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        {getRoleIcon('member')}
                        Member
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        {getRoleIcon('admin')}
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingUser) {
                handleUpdateUserRole(editingUser.id, editingUser.role);
                setShowEditDialog(false);
                setEditingUser(null);
              }
            }}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}