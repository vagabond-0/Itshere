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
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Define types for our data
interface Message {
  id: string;
  content: string;
  timestamp: string;
  is_sender: boolean;
}

interface ChatResponse {
  messages: Message[];
}

export default function ChatScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList | null>(null);
  
  // Fetch messages when component mounts or username changes
  useEffect(() => {
    if (username) {
      fetchMessages();
    }
    
    // Set up a message polling interval
    const intervalId = setInterval(fetchMessages, 5000);
    
    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, [username]);
  
  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        router.replace('/');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/chat/${username}`, {
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
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }
      
      const response = await fetch(`http://localhost:8000/api/chat/${username}`, {
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
      
      // Clear input and refresh messages
      setNewMessage('');
      fetchMessages();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
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
        <Text style={styles.headerTitle}>Chat with {username}</Text>
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
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
        renderItem={({item}) => (
          <View style={[
            styles.messageWrapper,
            item.is_sender ? styles.sentMessage : styles.receivedMessage
          ]}>
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
              {new Date(item.timestamp).toLocaleTimeString()}
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
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  messageWrapper: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
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
    marginTop: 5,
    color: 'rgba(255, 255, 255, 0.7)',
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
});