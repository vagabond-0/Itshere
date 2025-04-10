import React, { createContext, useContext, useState, useEffect } from 'react';
import * as webBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

webBrowser.maybeCompleteAuthSession();

export type UserInfo = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

type AuthContextType = {
  userInfo: UserInfo | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "676766196369-7s8da08ap9rorb665ua5knskal293umo.apps.googleusercontent.com",
    iosClientId: "676766196369-85na8q6sve5dqqgih8ugf02gmvcr5fuc.apps.googleusercontent.com",
    webClientId: "676766196369-53q01p2s8htgrkkdh3f6ucnog09qe5gu.apps.googleusercontent.com",
  });

  
  useEffect(() => {
    loadStoredUser();
  }, []);
  useEffect(() => {
    handleAuthResponse();
  }, [response]);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@user');
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load user data', error);
    }
  };

  const handleAuthResponse = async () => {
    if (response?.type === 'success') {
      setIsLoading(true);
      await getUserInfo(response.authentication?.accessToken);
    }
  };

  const getUserInfo = async (token: string | undefined) => {
    if (!token) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      setUserInfo(data);
      await AsyncStorage.setItem('@user', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to get user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('@user');
      setUserInfo(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        isLoading,
        signIn,
        signOut
      }}
    >
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