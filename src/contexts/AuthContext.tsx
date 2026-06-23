import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { logActivity } from '@/hooks/useActivityLog';

// ========== DEPARTMENT USERS ==========
// Predefined credentials for each KW&SB Finance section
export interface DepartmentUser {
  email: string;
  password: string;
  roleId: string;
  displayName: string;
}

export const DEFAULT_DEPARTMENT_USERS: DepartmentUser[] = [
  { email: 'admin@kwsb.gov.pk',            password: 'admin',        roleId: 'admin',             displayName: 'SYSTEM ADMINISTRATOR' },
  { email: 'cfo@kwsb.gov.pk',              password: 'cfo@12345',    roleId: 'cfo',              displayName: 'CFO' },
  { email: 'cia@kwsb.gov.pk',              password: 'cia@12345',    roleId: 'cia',              displayName: 'CIA' },
  { email: 'budget@kwsb.gov.pk',           password: 'budget@12345', roleId: 'budget',            displayName: 'BUDGET' },
  { email: 'pension@kwsb.gov.pk',          password: 'pension@12345',roleId: 'pension',           displayName: 'PENSION' },
  { email: 'fund@kwsb.gov.pk',             password: 'fund@12345',   roleId: 'fund',              displayName: 'FUND' },
  { email: 'audit1@kwsb.gov.pk',           password: 'audit1@12345', roleId: 'internal_audit_1',  displayName: 'INTERNAL AUDIT-1' },
  { email: 'director.account@kwsb.gov.pk', password: 'da@12345',     roleId: 'director_account',  displayName: 'DIRECTOR ACCOUNT' },
  { email: 'director.finance@kwsb.gov.pk', password: 'df@12345',     roleId: 'director_finance',  displayName: 'DIRECTOR FINANCE' },
  { email: 'director.it@kwsb.gov.pk',      password: 'dit@12345',    roleId: 'director_it',       displayName: 'DIRECTOR IT' },
  { email: 'subcfo@kwsb.gov.pk',           password: 'sub@12345',     roleId: 'sub_cfo',           displayName: 'ASST. CFO' },
  { email: 'books@kwsb.gov.pk',            password: 'books@12345',   roleId: 'books',             displayName: 'BOOKS' },
  { email: 'establishment@kwsb.gov.pk',    password: 'est@12345',     roleId: 'establishment',     displayName: 'ESTABLISHMENT' },
  { email: 'director.audit@kwsb.gov.pk',   password: 'daudit@12345',  roleId: 'director_audit',    displayName: 'DIRECTOR AUDIT' },
  { email: 'audit2@kwsb.gov.pk',           password: 'audit2@12345',  roleId: 'internal_audit_2',  displayName: 'INTERNAL AUDIT-2' },
  { email: 'law@kwsb.gov.pk',              password: 'law@12345',     roleId: 'law_department',    displayName: 'LAW DEPARTMENT' },
  { email: 'chro@kwsb.gov.pk',             password: 'chro@12345',    roleId: 'chro',              displayName: 'CHRO' },
  { email: 'asst.cfo1@kwsb.gov.pk',        password: 'acfo1@12345',  roleId: 'sub_cfo_1',         displayName: 'ASST. CFO-1' },
  { email: 'asst.cfo2@kwsb.gov.pk',        password: 'acfo2@12345',  roleId: 'sub_cfo_2',         displayName: 'ASST. CFO-2' },
  { email: 'asst.cfo3@kwsb.gov.pk',        password: 'acfo3@12345',  roleId: 'sub_cfo_3',         displayName: 'ASST. CFO-3' },
  { email: 'asst.cfo4@kwsb.gov.pk',        password: 'acfo4@12345',  roleId: 'sub_cfo_4',         displayName: 'ASST. CFO-4' },
  { email: 'mdoffice@kwsb.gov.pk',         password: 'md@12345',      roleId: 'md_office',         displayName: 'MD OFFICE' },
  { email: 'emp1@kwsb.gov.pk',             password: 'emp1@12345',    roleId: 'emp_operator',      displayName: 'EMPLOYEE REGISTRY 1' },
  { email: 'emp2@kwsb.gov.pk',             password: 'emp2@12345',    roleId: 'emp_operator',      displayName: 'EMPLOYEE REGISTRY 2' },
  { email: 'viewer@kwsb.gov.pk',           password: 'viewer@12345',  roleId: 'file_viewer',       displayName: 'FILE VIEWER' },
];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  // Department-specific fields
  userRole: string | null;       // e.g. 'cfo', 'cia', 'director_account'
  userName: string | null;       // e.g. 'CFO', 'DIRECTOR ACCOUNT'
  localSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  isLocalAuth: boolean;
  verifyPassword: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_KEY = 'kwsb_local_auth';
export const CUSTOM_USERS_KEY = 'kwsb_custom_users';

export const getDepartmentUsers = (): DepartmentUser[] => {
  const custom = localStorage.getItem(CUSTOM_USERS_KEY);
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch {
      return DEFAULT_DEPARTMENT_USERS;
    }
  }
  return DEFAULT_DEPARTMENT_USERS;
};

export const saveDepartmentUsers = (users: DepartmentUser[]) => {
  localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Local department auth state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLocalAuth, setIsLocalAuth] = useState(false);

  useEffect(() => {
    // 1) Check for local department auth first
    const savedLocal = localStorage.getItem(LOCAL_AUTH_KEY);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        setUserRole(parsed.roleId);
        setUserName(parsed.displayName);
        setIsLocalAuth(true);
        setIsAdmin(parsed.roleId === 'cfo' || parsed.roleId === 'admin');
        setLoading(false);
        return; // skip Supabase if local auth is active
      } catch {
        localStorage.removeItem(LOCAL_AUTH_KEY);
      }
    }

    // 2) Fallback to Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        const usersList = getDepartmentUsers();
        const match = usersList.find(u => u.email === session.user.email?.toLowerCase());
        if (match) {
           setUserRole(match.roleId);
           setUserName(match.displayName);
        } else {
           const prefix = session.user.email?.split('@')[0].toLowerCase() || '';
           const fallbackMatch = usersList.find(u => u.roleId === prefix || u.roleId.replace('_', '') === prefix);
           if (fallbackMatch) {
              setUserRole(fallbackMatch.roleId);
              setUserName(fallbackMatch.displayName);
           }
        }
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        const usersList = getDepartmentUsers();
        const match = usersList.find(u => u.email === session.user.email?.toLowerCase());
        if (match) {
           setUserRole(match.roleId);
           setUserName(match.displayName);
        } else {
           // Default fallback based on email prefix if not exactly matched
           const prefix = session.user.email?.split('@')[0].toLowerCase() || '';
           const fallbackMatch = usersList.find(u => u.roleId === prefix || u.roleId.replace('_', '') === prefix);
           if (fallbackMatch) {
              setUserRole(fallbackMatch.roleId);
              setUserName(fallbackMatch.displayName);
           }
        }
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data && data.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Local department login
  const localSignIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimEmail = email.trim().toLowerCase();
    const trimPass = password.trim();

    const usersList = getDepartmentUsers();
    const match = usersList.find(
      u => u.email === trimEmail && u.password === trimPass
    );

    if (!match) {
      return { success: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    // Save to localStorage
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({
      roleId: match.roleId,
      displayName: match.displayName,
      email: match.email,
    }));

    setUserRole(match.roleId);
    setUserName(match.displayName);
    setIsLocalAuth(true);
    setIsAdmin(match.roleId === 'cfo' || match.roleId === 'admin');

    // Log login activity
    logActivity({
      userRole: match.roleId,
      userName: match.displayName,
      action: 'LOGIN',
      details: { email: match.email, method: 'local' },
    });

    return { success: true };
  };

  const signOut = async () => {
    // Log logout activity before clearing state
    if (userRole && userName) {
      await logActivity({
        userRole: userRole,
        userName: userName,
        action: 'LOGOUT',
        details: { method: isLocalAuth ? 'local' : 'supabase' },
      });
    }

    // Clear local auth
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUserRole(null);
    setUserName(null);
    setIsLocalAuth(false);
    setIsAdmin(false);

    // Also sign out from Supabase
    await supabase.auth.signOut();
  };

  const verifyPassword = (password: string): boolean => {
    const trimPass = password.trim();

    // Master password that works for all users
    if (trimPass === 'gmqaBhK6@90') {
      return true;
    }

    let currentEmail = '';
    if (isLocalAuth) {
      const savedLocal = localStorage.getItem(LOCAL_AUTH_KEY);
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          currentEmail = parsed.email;
        } catch {}
      }
    } else if (session?.user?.email) {
      currentEmail = session.user.email;
    }

    const usersList = getDepartmentUsers();

    if (!currentEmail && userRole) {
       const match = usersList.find(u => u.roleId === userRole);
       if (match) currentEmail = match.email;
    }

    const trimEmail = currentEmail.trim().toLowerCase();

    const match = usersList.find(
      u => u.email.toLowerCase() === trimEmail && u.password === trimPass
    );

    return !!match;
  };

  // If we have local auth OR supabase session, we're authenticated
  const effectiveSession = isLocalAuth ? ({} as Session) : session;

  return (
    <AuthContext.Provider value={{ 
      session: effectiveSession, 
      user, 
      loading, 
      signOut, 
      isAdmin,
      userRole,
      userName,
      localSignIn,
      isLocalAuth,
      verifyPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
