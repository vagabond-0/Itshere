import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, Image, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/context/user-auth';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserInfo = {
  username: string;
  gmail: string;
  PhoneNumber: string;
  profile_picture?: string;
};

export default function TabLayout() {
  const { logout } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);;
  const router = useRouter();
  useEffect(() => {
    const fetchUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        setUserInfo(JSON.parse(user));
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffd33d',
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            {userInfo?.profile_picture && (
              <TouchableOpacity
              onPress={()=>{
                router.push("/profile");
              }} >
              <Image
                source={{ uri: userInfo.profile_picture }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  marginRight: 10,
                  borderWidth: 1,
                  borderColor: '#ffd33d',
                }}
              />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                padding: 6,
                backgroundColor: '#ff4d4d',
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Its Here',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'information-circle' : 'information-circle-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
