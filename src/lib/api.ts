import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiTask {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  notes?: string;
  companyId?: string;
  categoryId?: string;
  assignedToId?: string;
  createdById: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  completed: boolean;
  dueDate?: string;
  dueTime?: string;
  completedAt?: string;
  parentTaskId?: string;
  order?: number;
  estimatedHours?: number;
  actualHours?: number;
  isRecurring: boolean;
  recurringPattern?: any;
  isTemplate: boolean;
  templateName?: string;
  attachments: any[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  dependencies?: string[];
  subtasks?: ApiTask[];
}

export interface ApiUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ApiTenant {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: 'free' | 'normal' | 'enterprise';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due';
}

// Auth API
export const authApi = {
  login: async (clerkUserId: string, tenantSlug?: string) => {
    const response = await api.post('/auth/login', { clerkUserId, tenantSlug });
    return response.data;
  },

  register: async (data: {
    clerkUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    tenantName: string;
    tenantSlug: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  verify: async (token: string) => {
    const response = await api.post('/auth/verify', { token });
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
    companyId?: string;
    categoryId?: string;
    search?: string;
    includeCompleted?: boolean;
    includeArchived?: boolean;
  }) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiTask> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: Partial<ApiTask>): Promise<ApiTask> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ApiTask>): Promise<ApiTask> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  bulkUpdate: async (taskIds: string[], updates: Partial<ApiTask>) => {
    const response = await api.post('/tasks/bulk-update', { taskIds, updates });
    return response.data;
  },

  addComment: async (taskId: string, content: string, parentCommentId?: string, mentions?: string[]) => {
    const response = await api.post(`/tasks/${taskId}/comments`, {
      content,
      parentCommentId,
      mentions
    });
    return response.data;
  },
};

// Users API
export const usersApi = {
  getMe: async (): Promise<ApiUser> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (data: Partial<ApiUser>): Promise<ApiUser> => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  getAll: async (): Promise<ApiUser[]> => {
    const response = await api.get('/users');
    return response.data;
  },
};

// Tenants API
export const tenantsApi = {
  getCurrent: async (): Promise<ApiTenant> => {
    const response = await api.get('/tenants/current');
    return response.data;
  },

  updateCurrent: async (data: { name: string; domain?: string; settings?: any }): Promise<ApiTenant> => {
    const response = await api.put('/tenants/current', data);
    return response.data;
  },

  getUsage: async () => {
    const response = await api.get('/tenants/usage');
    return response.data;
  },

  getMembers: async (): Promise<ApiUser[]> => {
    const response = await api.get('/tenants/members');
    return response.data;
  },

  inviteMember: async (email: string, role: string) => {
    const response = await api.post('/tenants/members/invite', { email, role });
    return response.data;
  },

  updateMember: async (userId: string, data: { role?: string; isActive?: boolean }) => {
    const response = await api.put(`/tenants/members/${userId}`, data);
    return response.data;
  },
};

export default api;