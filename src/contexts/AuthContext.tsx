import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import api, { User, AuthTokens } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAnonymous: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  registerAnonymous: () => Promise<void>;
  upgradeAccount: (email: string, password: string, name?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_GOOGLE_IOS_CLIENT_ID';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_GOOGLE_ANDROID_CLIENT_ID';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isAnonymous: false,
  });

  // Configure Google Auth
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle auth error - redirect to login
  useEffect(() => {
    api.setAuthErrorHandler(() => {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAnonymous: false,
      });
    });
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      handleGoogleSignIn(id_token);
    }
  }, [googleResponse]);

  const checkAuthStatus = async () => {
    try {
      const hasToken = await api.hasValidToken();
      if (hasToken) {
        // Try to get user from storage first
        const storedUser = await api.getStoredUser();
        if (storedUser) {
          setState({
            user: storedUser,
            isAuthenticated: true,
            isLoading: false,
            isAnonymous: !storedUser.email,
          });
        }
        
        // Refresh from server in background
        try {
          const user = await api.getProfile();
          setState(prev => ({
            ...prev,
            user,
            isAnonymous: !user.email,
          }));
        } catch (e) {
          // Token might be invalid, clear and require re-auth
          if (!storedUser) {
            await api.clearTokens();
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isAnonymous: false,
            });
          }
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isAnonymous: false,
        });
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAnonymous: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await api.login(email, password);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isAnonymous: false,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await api.register(email, password, name);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isAnonymous: false,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await api.logout();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAnonymous: false,
      });
    }
  };

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received');
      }

      // Extract name if provided (first sign-in only)
      const name = credential.fullName?.givenName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
        : undefined;

      const response = await api.signInWithApple(credential.identityToken, name);
      
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isAnonymous: false,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled - don't throw
        return;
      }
      throw new Error(error.message || 'Apple Sign-In failed');
    }
  };

  const signInWithGoogle = async () => {
    if (!googleRequest) {
      throw new Error('Google Sign-In not configured');
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await promptGoogleAsync();
      // Response is handled in useEffect
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error.message || 'Google Sign-In failed');
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      const response = await api.signInWithGoogle(idToken);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isAnonymous: false,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      console.error('Google sign-in failed:', error);
    }
  };

  const registerAnonymous = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await api.registerAnonymous();
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isAnonymous: true,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error.response?.data?.message || 'Anonymous registration failed');
    }
  };

  const upgradeAccount = async (email: string, password: string, name?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const user = await api.upgradeAccount(email, password, name);
      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
        isAnonymous: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error.response?.data?.message || 'Account upgrade failed');
    }
  };

  const forgotPassword = async (email: string) => {
    return api.forgotPassword(email);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword);
  };

  const refreshUser = async () => {
    try {
      const user = await api.getProfile();
      setState(prev => ({
        ...prev,
        user,
        isAnonymous: !user.email,
      }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const updateUser = (data: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...data } : null,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        signInWithApple,
        signInWithGoogle,
        registerAnonymous,
        upgradeAccount,
        forgotPassword,
        changePassword,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
