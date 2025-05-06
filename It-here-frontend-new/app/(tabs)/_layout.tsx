import React, { useEffect, useState, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { 
  TouchableOpacity, 
  Image, 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/user-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

type UserInfo = {
  username: string;
  gmail: string;
  PhoneNumber: string;
  profile_picture?: string;
};

const ICON_SIZE = 24;
const { width } = Dimensions.get('window');

export default function TabLayout() {
  const { logout } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const router = useRouter();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        setUserInfo(JSON.parse(user));
        
        // Animate profile picture when loaded
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          })
        ]).start();
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    // Rotate animation for logout button
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      logout();
      rotateAnim.setValue(0);
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  // Custom tab bar button for the center add button
  const CustomTabButton = ({ children, onPress }: any) => (
    <TouchableOpacity
      style={styles.customTabButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#ffd33d', '#ffaa33']}
        style={styles.customTabButtonInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#ffd33d',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerTitleAlign: 'center',
        tabBarStyle: {
          backgroundColor: '#1a2a3d',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        headerStyle: {
          backgroundColor: '#213448',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
          height: 100,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 22,
          color: '#ffd33d',
        },
        tabBarItemStyle: {
          padding: 4,
        },
        headerLeft: () => (
          <View style={styles.headerLeftContainer}>
            <LinearGradient
              colors={['#ffd33d', '#ffaa33']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>IH</Text>
            </LinearGradient>
          </View>
        ),
        headerTitle: () => (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>ItsHere</Text>
            <Text style={styles.headerSubtitleText}>Find what's lost</Text>
          </View>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            {userInfo?.profile_picture && (
              <TouchableOpacity
                onPress={() => {
                  router.push("/profile");
                }}
                activeOpacity={0.8}
                style={styles.profileButtonContainer}
              >
                <Animated.View
                  style={[
                    styles.profileAnimContainer,
                    { transform: [{ scale: scaleAnim }] }
                  ]}
                >
                  <Image
                    source={{ uri: userInfo.profile_picture }}
                    style={styles.profileImage}
                  />
                </Animated.View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                color={color} 
                size={ICON_SIZE} 
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="add" color="#213448" size={ICON_SIZE + 4} />
          ),
          tabBarButton: (props) => <CustomTabButton {...props} />
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons
                name={focused ? 'notifications-circle' : 'notifications-circle-outline'}
                color={color}
                size={ICON_SIZE}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    marginLeft: 16,
  },
  logoGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#213448',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#ffd33d',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitleText: {
    color: '#a0b0c0',
    fontSize: 12,
    marginTop: -2,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  profileButtonContainer: {
    marginRight: 12,
  },
  profileAnimContainer: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffd33d',
    overflow: 'hidden',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#ff4757',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#ff4757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: 60,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffd33d',
  },
  customTabButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#ffaa33",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  customTabButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#1a2a3d',
  },
});