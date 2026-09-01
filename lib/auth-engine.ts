import { User, UserRole, StaffPermission, AuthSession } from './types';

const STORAGE_KEYS = {
  USERS: 'seen_production_users_v4',
  CURRENT_SESSION: 'seen_production_session_v4',
};

// Platform Executive Directors (Official Production Credentials)
export const INITIAL_USERS: (User & { username?: string })[] = [
  {
    id: 'usr-admin-yousef',
    name: 'يوسف يعقوب',
    email: 'yusef@seen.store',
    username: 'yousef',
    phone: '777000111',
    password: '1234',
    role: 'SUPER_ADMIN',
    staffTitle: 'المالك والمدير العام (Founder & CEO)',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin-abbas',
    name: 'عباس الأغبر',
    email: 'abbas@seen.store',
    username: 'abbas',
    phone: '777000222',
    password: '1234',
    role: 'SUPER_ADMIN',
    staffTitle: 'المالك والشريك المؤسس (Co-Founder & Director)',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
];

class AuthEngine {
  private isClient: boolean;
  private users: (User & { username?: string })[] = INITIAL_USERS;
  private currentSession: AuthSession | null = null;

  constructor() {
    this.isClient = typeof window !== 'undefined';
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (!this.isClient) return;

    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        this.saveToStorage(STORAGE_KEYS.USERS, this.users);
      }

      const storedSession = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (storedSession) {
        this.currentSession = JSON.parse(storedSession);
      }
    } catch (e) {
      console.error('Error loading auth state:', e);
    }
  }

  private saveToStorage(key: string, data: any) {
    if (!this.isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  }

  // --- OFFICIAL DIRECTORS & USERS LOGIN ---
  public login(identifier: string, password?: string): { success: boolean; session?: AuthSession; redirectUrl?: string; error?: string } {
    this.loadFromStorage();
    const cleanId = identifier.trim().toLowerCase();

    // Match by username (yousef, abbas), email, or phone
    const user = this.users.find(
      (u) => 
        (u.username && u.username.toLowerCase() === cleanId) ||
        u.email.toLowerCase() === cleanId || 
        (u.phone && u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, ''))
    );

    if (!user) {
      return { success: false, error: 'اسم المستخدم أو البريد الإلكتروني غير صحيح.' };
    }

    if (user.status === 'suspended') {
      return { success: false, error: 'هذا الحساب معلق حالياً من قبل الإدارة.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, error: 'كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.' };
    }

    user.lastLoginAt = new Date().toISOString();
    this.updateUser(user.id, { lastLoginAt: user.lastLoginAt });

    const session: AuthSession = {
      user,
      token: `tok_${user.id}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.currentSession = session;
    this.saveToStorage(STORAGE_KEYS.CURRENT_SESSION, session);

    let redirectUrl = '/profile';
    if (user.role === 'SUPER_ADMIN') {
      redirectUrl = '/admin';
    } else if (user.role === 'STORE_OWNER' || user.role === 'STORE_STAFF') {
      redirectUrl = user.storeSlug ? `/merchant/${user.storeSlug}` : '/create-store';
    } else if (user.role === 'CUSTOMER') {
      redirectUrl = user.storeSlug ? `/store/${user.storeSlug}` : '/profile';
    }

    return { success: true, session, redirectUrl };
  }

  // Change Password Method
  public changePassword(userId: string, oldPass: string, newPass: string): { success: boolean; error?: string } {
    this.loadFromStorage();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'المستخدم غير موجود.' };

    if (user.password && user.password !== oldPass) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة.' };
    }

    user.password = newPass;
    this.updateUser(userId, { password: newPass } as any);
    return { success: true };
  }

  // --- GOOGLE OAUTH LOGIN & ONBOARDING ---
  public loginWithGoogle(profile: {
    name: string;
    email: string;
    avatarUrl?: string;
    role?: UserRole;
    storeSlug?: string;
    storeName?: string;
  }): { success: boolean; session: AuthSession; redirectUrl: string } {
    this.loadFromStorage();
    const cleanEmail = profile.email.trim().toLowerCase();

    let user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      user = {
        id: `usr-google-${Date.now()}`,
        name: profile.name,
        email: cleanEmail,
        phone: '',
        role: profile.role || (cleanEmail.includes('yusef') || cleanEmail.includes('abbas') ? 'SUPER_ADMIN' : 'STORE_OWNER'),
        storeId: profile.storeSlug ? `store-${profile.storeSlug}` : undefined,
        storeSlug: profile.storeSlug,
        storeName: profile.storeName,
        status: 'active',
        avatarUrl: profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      this.users.push(user);
      this.saveToStorage(STORAGE_KEYS.USERS, this.users);
    } else {
      user.lastLoginAt = new Date().toISOString();
      if (profile.avatarUrl && !user.avatarUrl) user.avatarUrl = profile.avatarUrl;
      if (profile.storeSlug && !user.storeSlug) {
        user.storeSlug = profile.storeSlug;
        user.storeName = profile.storeName;
      }
      this.updateUser(user.id, user);
    }

    const session: AuthSession = {
      user,
      token: `g_tok_${user.id}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.currentSession = session;
    this.saveToStorage(STORAGE_KEYS.CURRENT_SESSION, session);

    let redirectUrl = '/profile';
    if (user.role === 'SUPER_ADMIN') {
      redirectUrl = '/admin';
    } else if (user.role === 'STORE_OWNER' || user.role === 'STORE_STAFF') {
      redirectUrl = user.storeSlug ? `/merchant/${user.storeSlug}` : '/create-store';
    } else if (user.role === 'CUSTOMER') {
      redirectUrl = user.storeSlug ? `/store/${user.storeSlug}` : '/profile';
    }

    return { success: true, session, redirectUrl };
  }

  // --- CUSTOMER SELF-REGISTRATION ---
  public registerCustomer(data: { name: string; email?: string; phone: string; password?: string; storeId?: string; storeSlug?: string; storeName?: string }): { success: boolean; session?: AuthSession; redirectUrl?: string; error?: string } {
    this.loadFromStorage();
    const cleanPhone = data.phone.replace(/[^0-9]/g, '');

    const existing = this.users.find(
      (u) => (u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone) || (data.email && u.email.toLowerCase() === data.email.toLowerCase())
    );

    if (existing) {
      return this.login(data.phone, data.password);
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email || `${cleanPhone}@customer.seen.store`,
      phone: data.phone,
      password: data.password || '1234',
      role: 'CUSTOMER',
      storeId: data.storeId,
      storeSlug: data.storeSlug,
      storeName: data.storeName,
      status: 'active',
      totalSpent: 0,
      ordersCount: 0,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.saveToStorage(STORAGE_KEYS.USERS, this.users);

    return this.login(newUser.phone, newUser.password);
  }

  public getCurrentSession(): AuthSession | null {
    this.loadFromStorage();
    return this.currentSession;
  }

  public getCurrentUser(): User | null {
    this.loadFromStorage();
    return this.currentSession ? this.currentSession.user : null;
  }

  public logout(): void {
    this.currentSession = null;
    if (this.isClient) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  }

  public getUsers(storeId?: string, role?: string): User[] {
    this.loadFromStorage();
    let filtered = this.users;
    if (storeId) {
      filtered = filtered.filter((u) => u.storeId === storeId);
    }
    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    return filtered;
  }

  public updateUser(userId: string, updates: Partial<User>): User | undefined {
    this.loadFromStorage();
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return undefined;

    this.users[idx] = { ...this.users[idx], ...updates };
    this.saveToStorage(STORAGE_KEYS.USERS, this.users);

    if (this.currentSession && this.currentSession.user.id === userId) {
      this.currentSession.user = this.users[idx];
      this.saveToStorage(STORAGE_KEYS.CURRENT_SESSION, this.currentSession);
    }

    return this.users[idx];
  }

  public createUserByAdmin(data: Omit<User, 'id' | 'createdAt' | 'lastLoginAt' | 'status'>): User {
    this.loadFromStorage();
    const newUser: User = {
      ...data,
      id: `usr-${Date.now()}`,
      status: 'active',
      avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.users = [newUser, ...this.users];
    this.saveToStorage(STORAGE_KEYS.USERS, this.users);
    return newUser;
  }

  public deleteUser(userId: string) {
    this.loadFromStorage();
    this.users = this.users.filter((u) => u.id !== userId);
    this.saveToStorage(STORAGE_KEYS.USERS, this.users);
  }

  public toggleUserStatus(userId: string): User | undefined {
    this.loadFromStorage();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return undefined;
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    return this.updateUser(userId, { status: newStatus });
  }
}

export const authEngine = new AuthEngine();
