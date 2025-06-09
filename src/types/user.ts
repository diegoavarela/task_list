export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'inactive';
  createdAt: Date;
  lastActiveAt?: Date;
  preferences?: {
    emailNotifications: boolean;
    timezone: string;
    language: string;
  };
}

export interface TeamMember {
  userId: string;
  teamId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  invitedBy: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  assignedTo: string; // User ID
  assignedBy: string; // User ID
  assignedAt: Date;
  dueDate?: Date;
  status: 'assigned' | 'accepted' | 'declined' | 'completed';
  notes?: string;
}

export interface ShareLink {
  id: string;
  resourceId: string; // Task ID, Project ID, etc.
  resourceType: 'task' | 'project' | 'board';
  shareType: 'view' | 'comment' | 'edit';
  expiresAt?: Date;
  password?: string;
  createdBy: string;
  createdAt: Date;
  accessCount: number;
  isActive: boolean;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
}