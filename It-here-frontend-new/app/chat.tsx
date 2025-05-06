import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Define types for our data
interface BackendMessage {
  _id: {
    $oid: string;
  };
  char_id: string;
  sender: string;
  send_at: string;
  message: string;
  is_read: boolean;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  is_sender: boolean;
  sender: string;
}

interface ChatResponse {
  status: string;
  messages: BackendMessage[];
}

// Simple UUID generator function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to properly format message timestamps
const formatMessageTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', timestamp);
      return 'Invalid time';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid time';
  }
};

export default function ChatScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList | null>(null);
  const lastSyncTimeRef = useRef<Date>(new Date());
  const [currentUser, setCurrentUser] = useState<string>('');
  
  // Get current user during component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // Try different storage keys to find username
        const username = await AsyncStorage.getItem('username');
        const email = await AsyncStorage.getItem('email');
        const user = await AsyncStorage.getItem('user');

        if (username) {
          console.log('Found username in storage:', username);
          setCurrentUser(username);
        } else if (email) {
          console.log('Found email in storage:', email);
          setCurrentUser(email);
        } else if (user) {
          // Try to parse user object if stored as JSON
          try {
            const userData = JSON.parse(user);
            console.log('Found user data:', userData);
            if (userData.username) {
              setCurrentUser(userData.username);
            } else if (userData.email) {
              setCurrentUser(userData.email);
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
            setCurrentUser(user);
          }
        } else {
          console.warn('No user identifier found in storage');
        }
      } catch (err) {
        console.error('Error getting user info:', err);
      }
    };

    getUserInfo();
  }, []);

  // Initial fetch of messages when component mounts
  useEffect(() => {
    if (username) {
      fetchMessages();
      
      const intervalId = setInterval(syncWithBackend, 10000);
      
      return () => clearInterval(intervalId);
    }
  }, [username, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
 // Fix the transformMessages function to ensure is_sender is always a boolean

const transformMessages = (backendMessages: BackendMessage[]): Message[] => {
  if (!currentUser) {
    console.warn('Current user is not set, message sender status may be incorrect');
  }
  
  return backendMessages.map(msg => {
    // Ensure this is a boolean by using strict comparison and explicitly converting to boolean
    const isSender = Boolean(currentUser && msg.sender === currentUser);
    console.log(`Message from ${msg.sender}, currentUser=${currentUser}, isSender=${isSender}`);
    
    return {
      id: msg._id.$oid,
      content: msg.message,
      timestamp: msg.send_at,
      is_sender: isSender, // Now guaranteed to be a boolean
      sender: msg.sender
    };
  });
};
  
  // Complete fetch of all messages from backend
  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        router.replace('/');
        return;
      }
      
      console.log(`Fetching messages for chat with ${username}`);
      
      const response = await fetch(`https://itsherebackend-production.up.railway.app/api/chat/${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data: ChatResponse = await response.json();
      console.log('Received chat data:', data); // Debug log
      
      if (data.status === 'success' && data.messages) {
        const transformedMessages = transformMessages(data.messages);
        setMessages(transformedMessages);
        lastSyncTimeRef.current = new Date();
      } else {
        console.warn('Unexpected response format:', data);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Sync only new messages since last sync
  const syncWithBackend = async () => {
    if (!currentUser) {
      console.warn('Current user not set, skipping sync');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const lastSync = lastSyncTimeRef.current.toISOString();
      
      const response = await fetch(
        `https://itsherebackend-production.up.railway.app/api/chat/${username}?since=${lastSync}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `auth-token=${token}`
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) return;
      
      const data: ChatResponse = await response.json();
      
      if (data.status === 'success' && data.messages && data.messages.length > 0) {
        const newTransformedMessages = transformMessages(data.messages);
        
        // Filter out any duplicates by ID
        const newMessagesMap = new Map(newTransformedMessages.map(msg => [msg.id, msg]));
        const currentMessagesMap = new Map(messages.map(msg => [msg.id, msg]));
        
        // Merge the maps giving priority to new messages
        const mergedMessages = [...currentMessagesMap.values()];
        newMessagesMap.forEach((value, key) => {
          if (!currentMessagesMap.has(key)) {
            mergedMessages.push(value);
          }
        });
        
        // Sort by timestamp
        mergedMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setMessages(mergedMessages);
      }
      
      lastSyncTimeRef.current = new Date();
    } catch (err) {
      console.error('Error syncing messages:', err);
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        Alert.alert('Error', 'You need to be logged in to send messages');
        return;
      }
      
      // Optimistically add message to local state
      const tempId = generateUUID();
      const now = new Date().toISOString();
      
      const newMsg: Message = {
        id: tempId,
        content: newMessage,
        timestamp: now,
        is_sender: true,
        sender: currentUser
      };
      
      // Update UI immediately with the new message
      setMessages(prevMessages => [...prevMessages, newMsg]);
      setNewMessage('');
      
      // Scroll to bottom to show new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Then send to backend
      const response = await fetch(`https://itsherebackend-production.up.railway.app/api/chat/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ message: newMessage })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Optional: If backend returns the created message, update it
      const data = await response.json();
      console.log('Send message response:', data);
      
      if (data.message && data.message._id && data.message._id.$oid) {
        // Replace our temp message with the one from the server
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempId ? {
              id: data.message._id.$oid, 
              content: data.message.message,
              timestamp: data.message.send_at,
              is_sender: true,
              sender: data.message.sender
            } : msg
          )
        );
      }
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
      
      // Remove the optimistic message on error
      // setMessages(prevMessages => 
      //   prevMessages.filter(msg => msg.id !== tempId)
      // );
      
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading conversation...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chat with {username}</Text>
          {currentUser && (
            <Text style={styles.subHeaderText}>You are logged in as: {currentUser}</Text>
          )}
        </View>
        <View style={{width: 24}} />
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesContainer}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyMessagesContainer : { paddingBottom: 10 }
        }
        ListEmptyComponent={() => (
          <View style={styles.noMessagesContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.noMessagesText}>No messages yet</Text>
            <Text style={styles.noMessagesSubtext}>Start the conversation!</Text>
          </View>
        )}
        renderItem={({item}) => (
          <View style={[
            styles.messageWrapper,
            item.is_sender ? styles.sentMessage : styles.receivedMessage
          ]}>
            {!item.is_sender && (
              <Text style={styles.senderName}>
                {item.sender.split('@')[0]}
              </Text>
            )}
            <Text style={[
              styles.messageText,
              !item.is_sender && styles.receivedMessageText
            ]}>
              {item.content}
            </Text>
            <Text style={[
              styles.timestampText,
              !item.is_sender && styles.receivedTimestampText
            ]}>
              {formatMessageTime(item.timestamp)}
            </Text>
          </View>
        )}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            !newMessage.trim() && styles.sendButtonDisabled
          ]} 
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={24} color={newMessage.trim() ? "white" : "#cccccc"} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subHeaderText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: '#ffcccc',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#cc0000',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  emptyMessagesContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  noMessagesSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  messageWrapper: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    borderTopRightRadius: 2,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderTopLeftRadius: 2,
  },
  senderName: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333', // darker text for received messages on white background
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  receivedTimestampText: {
    color: 'rgba(0, 0, 0, 0.5)', // darker timestamp for received messages
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  }
});