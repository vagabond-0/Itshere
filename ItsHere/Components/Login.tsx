import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

interface LoginProps {
  onLogin: (uuid: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Google Sign-In
    GoogleSignin.configure({
      // Get this from Google Cloud Console
      webClientId: '484441928132-4r8mgqkkocg0tji61b4a1i9oqqjb4ir7.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, check if user is already signed in
      await GoogleSignin.hasPlayServices();
      
      // Perform the sign-in
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.user.email) {
        const response = await fetch('http://127.0.0.1:8080/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gmail: userInfo.data?.user.email}),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data from server');
        }

        const data = await response.json();
        const uuid = data.uuid;

        // Save to local storage
        localStorage.setItem('uuid', uuid);
        localStorage.setItem('userEmail', userInfo.data?.user.email);

        // Call the onLogin callback
        onLogin(uuid);
      }
    } catch (error: any) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          setError('Sign in cancelled');
          break;
        case statusCodes.IN_PROGRESS:
          setError('Sign in already in progress');
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          setError('Play services not available');
          break;
        default:
          setError('Something went wrong. Please try again.');
          console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      localStorage.removeItem('uuid');
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Its Here</Text>
      <Text style={styles.para}>Find your lost Item Here</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Button
        title={isLoading ? "Signing in..." : "Sign in with Google"}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#80C4E9',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  para: {
    fontSize: 16,
    marginBottom: 20,
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default Login;