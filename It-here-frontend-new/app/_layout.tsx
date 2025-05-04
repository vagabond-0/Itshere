import React, { useEffect, useCallback } from 'react';
import { AuthProvider } from '@/context/user-auth';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  // Custom back button handler
  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#213448',
            },
            headerTintColor: '#ffd33d',
            headerTitleStyle: {
              fontFamily: 'Poppins-SemiBold',
              fontSize: 18,
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: '#152238' },
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="profile" 
            options={{ 
              headerShown: true,
              title: "Profile",
              headerTransparent: true,
              headerBlurEffect: 'dark',
              headerTitleAlign: 'center',
              // Replace the default back button with a custom one
              headerLeft: () => (
                <TouchableOpacity 
                  onPress={handleGoBack}
                  style={styles.headerButton}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={24} 
                    color="#ffd33d"
                  />
                </TouchableOpacity>
              ),
            }} 
          />
          <Stack.Screen 
            name="register" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="chat" 
            options={{ 
              headerShown: false, // Hide default header since chat has its own
              animation: 'slide_from_right',
              presentation: 'card', 
              contentStyle: { backgroundColor: '#fff' } // White background for chat
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="+not-found"
            options={{
              presentation: 'modal',
              title: 'Not Found',
              headerTitleAlign: 'center',
            }}
          />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#152238',
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
});