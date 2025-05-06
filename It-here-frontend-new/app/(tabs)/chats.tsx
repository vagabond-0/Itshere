import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Updated types to match API response format
interface ChatRoom {
  _id: {
    $oid: string;
  };
  user1: string;
  user2: string;
  created_at: string;
}

export default function ChatRoomsScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get current user and chat rooms when component mounts
    getCurrentUser();
    fetchChatRooms();
  }, []);

  const getCurrentUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user.username);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setError("Please log in to see your chats");
        setLoading(false);
        return;
      }

      console.log("Fetching chats with token:", token.substring(0, 10) + "...");

      const response = await fetch('https://itsherebackend-production.up.railway.app/api/getchat', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth_token=${token}`,
          'Authorization': `Bearer ${token}` // Added for better compatibility
        },
      });

      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        setError(`Server error: ${response.status}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Response data:", JSON.stringify(data).substring(0, 100) + "...");
      
      if (data.status === "success" && Array.isArray(data.chat_rooms)) {
        console.log(`Found ${data.chat_rooms.length} chat rooms`);
        setChatRooms(data.chat_rooms);
      } else {
        console.warn("No chat rooms found or invalid format");
        setChatRooms([]);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setError("Failed to load chats. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  const getOtherUser = (chatRoom: ChatRoom) => {
    if (!currentUser) return chatRoom.user2 || "Unknown";
    
    // If current user is user1, return user2 and vice versa
    if (chatRoom.user1 === currentUser) {
      return chatRoom.user2;
    } else {
      return chatRoom.user1;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      
      // Check if the date is today
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      }
      
      // Check if the date is within the last week
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      if (date > weekAgo) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
      }
      
      // For older dates
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return "Unknown date";
    }
  };

  const navigateToChat = (username: string) => {
    router.push(`/chat?username=${username}`);
  };

  const renderChatItem = ({ item }: { item: ChatRoom }) => {
    const otherUser = getOtherUser(item);
    
    // First letter of the username as avatar
    const avatarLetter = otherUser.charAt(0).toUpperCase();
    
    // Generate a consistent color based on the username
    const colorHash = otherUser.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    const avatarColor = `hsl(${colorHash}, 70%, 40%)`;
    
    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => navigateToChat(otherUser)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.username}>{otherUser}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
          </View>
          
          <View style={styles.messagePreview}>
            <Text 
              style={styles.lastMessage}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Tap to start chatting
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e72e4" />
        <Text style={styles.loadingText}>Loading chat rooms...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#213448', '#1a2a3d', '#152238']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ff5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchChatRooms}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : chatRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={80} color="#5e72e4" />
          <Text style={styles.emptyText}>No chats yet</Text>
          <Text style={styles.emptySubText}>
            Your conversations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item._id.$oid}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor="#5e72e4"
              colors={["#5e72e4"]}
            />
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5e72e4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 12,
    color: '#a0b0c0',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#a0b0c0',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#213448',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#a0b0c0',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#5e72e4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});