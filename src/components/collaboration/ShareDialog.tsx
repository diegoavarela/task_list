import { useState, useEffect } from 'react';
import { Share2, Link2, Copy, Mail, Settings, Eye, MessageSquare, Edit, Trash2, Globe, Lock, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { UserService } from '@/services/userService';
import type { ShareLink, WorkspaceInvite } from '@/types/user';
import type { Task } from '@/types/task';
import { format, addDays } from 'date-fns';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  resourceType?: 'task' | 'project' | 'board';
}

export function ShareDialog({ isOpen, onClose, task, resourceType = 'task' }: ShareDialogProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [newLinkType, setNewLinkType] = useState<ShareLink['shareType']>('view');
  const [linkExpiration, setLinkExpiration] = useState<string>('7');
  const [linkPassword, setLinkPassword] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceInvite['role']>('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const { toast } = useToast();

  const currentUser = UserService.getCurrentUser();

  useEffect(() => {
    if (isOpen) {
      loadShareData();
    }
  }, [isOpen, task.id]);

  const loadShareData = () => {
    const links = UserService.getResourceShareLinks(task.id);
    const allInvites = UserService.getInvites();
    setShareLinks(links);
    setInvites(allInvites);
  };

  const handleCreateShareLink = () => {
    const expiresAt = linkExpiration === 'never' ? undefined : addDays(new Date(), parseInt(linkExpiration));
    const password = requirePassword ? linkPassword : undefined;

    const shareLink = UserService.createShareLink(
      task.id,
      resourceType,
      newLinkType,
      currentUser.id,
      { expiresAt, password }
    );

    setShareLinks(prev => [...prev, shareLink]);
    setLinkPassword('');
    setRequirePassword(false);

    toast({
      title: 'Share link created',
      description: 'A new share link has been generated.',
    });
  };

  const handleRevokeLink = (linkId: string) => {
    const success = UserService.revokeShareLink(linkId);
    if (success) {
      setShareLinks(prev => prev.filter(link => link.id !== linkId));
      toast({
        title: 'Link revoked',
        description: 'The share link has been revoked and is no longer accessible.',
      });
    }
  };

  const handleCopyLink = (linkId: string) => {
    const shareUrl = `${window.location.origin}/shared/${linkId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Link copied',
        description: 'The share link has been copied to your clipboard.',
      });
    });
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;

    const invite = UserService.createInvite(
      inviteEmail.trim(),
      inviteRole,
      currentUser.id,
      7 // 7 days expiration
    );

    setInvites(prev => [...prev, invite]);
    setInviteEmail('');
    setInviteMessage('');

    // In a real app, this would send an actual email
    toast({
      title: 'Invite sent',
      description: `An invitation has been sent to ${invite.email}.`,
    });
  };

  const handleRevokeInvite = (inviteId: string) => {
    const success = UserService.revokeInvite(inviteId);
    if (success) {
      setInvites(prev => prev.map(inv => 
        inv.id === inviteId ? { ...inv, status: 'declined' } : inv
      ));
      toast({
        title: 'Invite revoked',
        description: 'The invitation has been revoked.',
      });
    }
  };

  const getShareTypeIcon = (type: ShareLink['shareType']) => {
    switch (type) {
      case 'view': return <Eye className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'edit': return <Edit className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getShareTypeColor = (type: ShareLink['shareType']) => {
    switch (type) {
      case 'view': return 'bg-gray-100 text-gray-800';
      case 'comment': return 'bg-blue-100 text-blue-800';
      case 'edit': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInviteStatusColor = (status: WorkspaceInvite['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{task.name}"
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="links">Share Links</TabsTrigger>
            <TabsTrigger value="invites">Team Invites</TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4 mt-4">
            {/* Create New Link */}
            <Card className="border-dashed border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Create Share Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Permission Level</Label>
                    <Select value={newLinkType} onValueChange={(value: ShareLink['shareType']) => setNewLinkType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            View Only
                          </div>
                        </SelectItem>
                        <SelectItem value="comment">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            View & Comment
                          </div>
                        </SelectItem>
                        <SelectItem value="edit">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Full Edit Access
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Link Expiration</Label>
                    <Select value={linkExpiration} onValueChange={setLinkExpiration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="7">1 Week</SelectItem>
                        <SelectItem value="30">1 Month</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requirePassword"
                      checked={requirePassword}
                      onCheckedChange={(checked) => setRequirePassword(!!checked)}
                    />
                    <Label htmlFor="requirePassword">Require password</Label>
                  </div>
                  
                  {requirePassword && (
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                    />
                  )}
                </div>

                <Button onClick={handleCreateShareLink} className="w-full">
                  <Link2 className="h-4 w-4 mr-2" />
                  Create Share Link
                </Button>
              </CardContent>
            </Card>

            {/* Existing Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Active Share Links ({shareLinks.length})</h3>
              {shareLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No active share links</p>
                  <p className="text-xs">Create a link to share this task with others</p>
                </div>
              ) : (
                shareLinks.map((link) => (
                  <Card key={link.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${getShareTypeColor(link.shareType)} border-0`}>
                              {getShareTypeIcon(link.shareType)}
                              <span className="ml-1 capitalize">{link.shareType}</span>
                            </Badge>
                            {link.password && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created {format(new Date(link.createdAt), 'MMM d, yyyy')}
                            {link.expiresAt && ` • Expires ${format(new Date(link.expiresAt), 'MMM d, yyyy')}`}
                            • {link.accessCount} access{link.accessCount !== 1 ? 'es' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(link.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeLink(link.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="invites" className="space-y-4 mt-4">
            {/* Send Invite */}
            <Card className="border-dashed border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Invite Team Member
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Personal Message (Optional)</Label>
                  <Textarea
                    placeholder="Add a personal message to the invitation..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim()}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </CardContent>
            </Card>

            {/* Pending Invites */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Recent Invitations ({invites.length})</h3>
              {invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No invitations sent</p>
                  <p className="text-xs">Invite team members to collaborate on this workspace</p>
                </div>
              ) : (
                invites.map((invite) => (
                  <Card key={invite.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{invite.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${getInviteStatusColor(invite.status)} border-0 text-xs`}>
                              {invite.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {invite.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sent {format(new Date(invite.invitedAt), 'MMM d, yyyy')}
                            • Expires {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        {invite.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}