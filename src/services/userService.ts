import type { User, TeamMember, TaskAssignment, ShareLink, WorkspaceInvite } from '@/types/user';
import { NotificationService } from './notificationService';

export class UserService {
  private static USERS_KEY = 'workspace-users';
  private static ASSIGNMENTS_KEY = 'task-assignments';
  private static SHARE_LINKS_KEY = 'share-links';
  private static INVITES_KEY = 'workspace-invites';

  // Mock current user - in a real app, this would come from authentication
  static getCurrentUser(): User {
    return {
      id: 'current-user',
      email: 'user@example.com',
      name: 'Current User',
      role: 'owner',
      status: 'active',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      preferences: {
        emailNotifications: true,
        timezone: 'UTC',
        language: 'en'
      }
    };
  }

  // User Management
  static getUsers(): User[] {
    const stored = localStorage.getItem(this.USERS_KEY);
    if (!stored) {
      // Initialize with current user
      const currentUser = this.getCurrentUser();
      this.saveUsers([currentUser]);
      return [currentUser];
    }

    try {
      return JSON.parse(stored);
    } catch {
      return [this.getCurrentUser()];
    }
  }

  static addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };

    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);
    return newUser;
  }

  static updateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return null;

    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;
    this.saveUsers(users);
    return updatedUser;
  }

  static removeUser(userId: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    
    if (filtered.length === users.length) return false;
    
    this.saveUsers(filtered);
    return true;
  }

  private static saveUsers(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // Task Assignment Management
  static getAssignments(): TaskAssignment[] {
    const stored = localStorage.getItem(this.ASSIGNMENTS_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static assignTask(taskId: string, assignedTo: string, assignedBy: string, notes?: string): TaskAssignment {
    const assignments = this.getAssignments();
    const newAssignment: TaskAssignment = {
      id: crypto.randomUUID(),
      taskId,
      assignedTo,
      assignedBy,
      assignedAt: new Date(),
      status: 'assigned',
      notes
    };

    const updatedAssignments = [...assignments, newAssignment];
    this.saveAssignments(updatedAssignments);

    // Notify the assigned user
    const assignedUser = this.getUsers().find(u => u.id === assignedTo);
    const assignerUser = this.getUsers().find(u => u.id === assignedBy);
    
    if (assignedUser && assignerUser) {
      NotificationService.createNotification({
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${assignerUser.name} assigned you a task`,
        taskId,
        userId: assignedBy,
        recipientId: assignedTo,
        metadata: {
          assignerName: assignerUser.name,
          notes
        }
      });
    }

    return newAssignment;
  }

  static updateAssignment(assignmentId: string, updates: Partial<TaskAssignment>): TaskAssignment | null {
    const assignments = this.getAssignments();
    const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
    
    if (assignmentIndex === -1) return null;

    const updatedAssignment = { ...assignments[assignmentIndex], ...updates };
    assignments[assignmentIndex] = updatedAssignment;
    this.saveAssignments(assignments);
    return updatedAssignment;
  }

  static getTaskAssignments(taskId: string): TaskAssignment[] {
    return this.getAssignments().filter(a => a.taskId === taskId);
  }

  static getUserAssignments(userId: string): TaskAssignment[] {
    return this.getAssignments().filter(a => a.assignedTo === userId);
  }

  static removeAssignment(assignmentId: string): boolean {
    const assignments = this.getAssignments();
    const filtered = assignments.filter(a => a.id !== assignmentId);
    
    if (filtered.length === assignments.length) return false;
    
    this.saveAssignments(filtered);
    return true;
  }

  private static saveAssignments(assignments: TaskAssignment[]) {
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(assignments));
  }

  // Share Link Management
  static getShareLinks(): ShareLink[] {
    const stored = localStorage.getItem(this.SHARE_LINKS_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static createShareLink(
    resourceId: string,
    resourceType: ShareLink['resourceType'],
    shareType: ShareLink['shareType'],
    createdBy: string,
    options?: {
      expiresAt?: Date;
      password?: string;
    }
  ): ShareLink {
    const shareLinks = this.getShareLinks();
    const newShareLink: ShareLink = {
      id: crypto.randomUUID(),
      resourceId,
      resourceType,
      shareType,
      createdBy,
      createdAt: new Date(),
      accessCount: 0,
      isActive: true,
      ...options
    };

    const updatedShareLinks = [...shareLinks, newShareLink];
    this.saveShareLinks(updatedShareLinks);
    return newShareLink;
  }

  static getResourceShareLinks(resourceId: string): ShareLink[] {
    return this.getShareLinks().filter(sl => sl.resourceId === resourceId && sl.isActive);
  }

  static revokeShareLink(shareLinkId: string): boolean {
    const shareLinks = this.getShareLinks();
    const linkIndex = shareLinks.findIndex(sl => sl.id === shareLinkId);
    
    if (linkIndex === -1) return false;

    shareLinks[linkIndex].isActive = false;
    this.saveShareLinks(shareLinks);
    return true;
  }

  static updateShareLinkAccess(shareLinkId: string): boolean {
    const shareLinks = this.getShareLinks();
    const linkIndex = shareLinks.findIndex(sl => sl.id === shareLinkId);
    
    if (linkIndex === -1) return false;

    shareLinks[linkIndex].accessCount += 1;
    this.saveShareLinks(shareLinks);
    return true;
  }

  private static saveShareLinks(shareLinks: ShareLink[]) {
    localStorage.setItem(this.SHARE_LINKS_KEY, JSON.stringify(shareLinks));
  }

  // Workspace Invites
  static getInvites(): WorkspaceInvite[] {
    const stored = localStorage.getItem(this.INVITES_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static createInvite(
    email: string,
    role: WorkspaceInvite['role'],
    invitedBy: string,
    expiresInDays: number = 7
  ): WorkspaceInvite {
    const invites = this.getInvites();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const newInvite: WorkspaceInvite = {
      id: crypto.randomUUID(),
      email,
      role,
      invitedBy,
      invitedAt: new Date(),
      expiresAt,
      status: 'pending',
      token: crypto.randomUUID()
    };

    const updatedInvites = [...invites, newInvite];
    this.saveInvites(updatedInvites);
    return newInvite;
  }

  static acceptInvite(token: string): User | null {
    const invites = this.getInvites();
    const invite = invites.find(i => i.token === token && i.status === 'pending');
    
    if (!invite || invite.expiresAt < new Date()) {
      return null;
    }

    // Create new user
    const newUser = this.addUser({
      email: invite.email,
      name: invite.email.split('@')[0], // Default name from email
      role: invite.role,
      status: 'active'
    });

    // Update invite status
    invite.status = 'accepted';
    this.saveInvites(invites);

    return newUser;
  }

  static revokeInvite(inviteId: string): boolean {
    const invites = this.getInvites();
    const inviteIndex = invites.findIndex(i => i.id === inviteId);
    
    if (inviteIndex === -1) return false;

    invites[inviteIndex].status = 'declined';
    this.saveInvites(invites);
    return true;
  }

  private static saveInvites(invites: WorkspaceInvite[]) {
    localStorage.setItem(this.INVITES_KEY, JSON.stringify(invites));
  }

  // Utility methods
  static canUserAccessTask(userId: string, taskId: string): boolean {
    const user = this.getUsers().find(u => u.id === userId);
    if (!user) return false;

    // Owners and admins can access all tasks
    if (user.role === 'owner' || user.role === 'admin') return true;

    // Check if user is assigned to the task
    const assignments = this.getTaskAssignments(taskId);
    return assignments.some(a => a.assignedTo === userId);
  }

  static getTaskCollaborators(taskId: string): User[] {
    const assignments = this.getTaskAssignments(taskId);
    const users = this.getUsers();
    
    return assignments.map(a => users.find(u => u.id === a.assignedTo)).filter(Boolean) as User[];
  }

  static searchUsers(query: string): User[] {
    const users = this.getUsers();
    const lowercaseQuery = query.toLowerCase();
    
    return users.filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    );
  }
}