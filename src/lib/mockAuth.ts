// Mock authentication service for development
export class MockAuthService {
  private static users = [
    {
      id: 'user_demo',
      email: 'demo@example.com',
      password: 'demo123',
      name: 'Demo User',
      tenantId: 'tenant_demo',
      tenantName: 'Demo Organization',
      role: 'owner'
    }
  ];

  private static tenants = [
    {
      id: 'tenant_demo',
      name: 'Demo Organization',
      slug: 'demo',
      createdAt: new Date('2024-01-01')
    }
  ];

  static async login(email: string, password: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = this.users.find(u => u.email === email);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }

    const token = btoa(JSON.stringify({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    }));

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role
      },
      tenant: this.tenants.find(t => t.id === user.tenantId)
    };
  }

  static async register(email: string, password: string, name: string, tenantName: string, tenantSlug: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user already exists
    if (this.users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    // Check if tenant slug is taken
    if (this.tenants.find(t => t.slug === tenantSlug)) {
      throw new Error('Organization URL is already taken');
    }

    const userId = `user_${Date.now()}`;
    const tenantId = `tenant_${Date.now()}`;

    // Create tenant
    const tenant = {
      id: tenantId,
      name: tenantName,
      slug: tenantSlug,
      createdAt: new Date()
    };
    this.tenants.push(tenant);

    // Create user
    const user = {
      id: userId,
      email,
      password,
      name,
      tenantId,
      tenantName,
      role: 'owner' as const
    };
    this.users.push(user);

    const token = btoa(JSON.stringify({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    }));

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role
      },
      tenant
    };
  }

  static async verifyToken(token: string) {
    try {
      const decoded = JSON.parse(atob(token));
      
      if (decoded.exp < Date.now()) {
        throw new Error('Token expired');
      }

      const user = this.users.find(u => u.id === decoded.userId);
      if (!user) {
        throw new Error('Invalid token');
      }

      return {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async demoLogin() {
    return this.login('demo@example.com', 'demo123');
  }
}