import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Animated,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/context/user-auth';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

type UserInfo = {
  username: string;
  gmail: string;
  PhoneNumber: string;
  profile_picture?: string;
};

type Post = {
  id: { $oid: string };
  description: string;
  date: string;
  place: string;
  image_link: string;
  comments: any[];
};

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [modalType, setModalType] = useState<'email' | 'phone'>('email');
  const [newValue, setNewValue] = useState('');

  const { logout } = useAuth();
  const router = useRouter();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animation when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (user) {
        const userData = JSON.parse(user);
        setUserInfo(userData);
        fetchUserPosts(userData.username, token);
      }
    } catch (error) {
      console.error('Error retrieving user info:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserPosts = async (username: string, token: string | null) => {
    if (!token) return;
    
    try {
      setPostsLoading(true);
      const response = await fetch(`https://itsherebackend-production.up.railway.app/api/userposts/${username}`, {
        headers: {
          'Cookie': `auth_token=${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPosts(data.posts || []);
      } else {
        console.error('Failed to fetch user posts');
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserInfo();
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  const openEditModal = (type: 'email' | 'phone') => {
    setModalType(type);
    setNewValue(type === 'email' ? userInfo?.gmail || '' : userInfo?.PhoneNumber || '');
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!userInfo || !newValue) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      
      const endpoint = modalType === 'email' 
        ? `https://itsherebackend-production.up.railway.app/api/editusername/${newValue}`
        : `https://itsherebackend-production.up.railway.app/api/editphone/${newValue}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Cookie': `auth_token=${token}`
        }
      });
      
      if (response.ok) {
        // Update local user info
        const updatedUser = {
          ...userInfo,
          [modalType === 'email' ? 'gmail' : 'PhoneNumber']: newValue
        };
        setUserInfo(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        Alert.alert('Success', `Your ${modalType} has been updated!`);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || `Failed to update ${modalType}`);
      }
    } catch (error) {
      console.error(`Error updating ${modalType}:`, error);
      Alert.alert('Error', `Something went wrong while updating your ${modalType}`);
    } finally {
      setEditModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#213448', '#1a2a3d', '#152238']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#5e72e4" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#213448', '#1a2a3d', '#152238']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#5e72e4"]}
            tintColor="#5e72e4"
          />
        }
      >
        {/* Header / Profile Info Section */}
        <Animated.View 
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }]
            }
          ]}
        >
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: userInfo?.profile_picture || 'https://via.placeholder.com/150'
              }}
              style={styles.profileImage}
            />
          </View>
          
          <Text style={styles.username}>{userInfo?.username || 'User'}</Text>
          
          <View style={styles.contactInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={18} color="#a0b0c0" />
              <Text style={styles.infoText}>{userInfo?.gmail || 'No email'}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditModal('email')}
              >
                <Ionicons name="pencil" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={18} color="#a0b0c0" />
              <Text style={styles.infoText}>{userInfo?.PhoneNumber || 'No phone'}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditModal('phone')}
              >
                <Ionicons name="pencil" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* User Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Your Posts</Text>
          
          {postsLoading ? (
            <View style={styles.loadingPosts}>
              <ActivityIndicator size="small" color="#5e72e4" />
              <Text style={styles.loadingPostsText}>Loading your posts...</Text>
            </View>
          ) : userPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="images-outline" size={60} color="#5e72e4" />
              <Text style={styles.emptyPostsTitle}>No posts yet</Text>
              <Text style={styles.emptyPostsText}>
                When you create posts, they will appear here
              </Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => router.push('/post')}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.createPostText}>Create a Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.postsList}>
              {userPosts.map((post, index) => (
                <Animated.View 
                  key={post.id.$oid || index}
                  style={[
                    styles.postCard,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: Animated.multiply(translateYAnim, index * 0.5 + 1) }]
                    }
                  ]}
                >
                  {post.image_link && (
                    <Image 
                      source={{ uri: post.image_link }} 
                      style={styles.postImage}
                    />
                  )}
                  
                  <View style={styles.postContent}>
                    <Text style={styles.postDescription}>{post.description}</Text>
                    
                    <View style={styles.postMeta}>
                      {post.place && (
                        <View style={styles.postMetaItem}>
                          <Ionicons name="location-outline" size={14} color="#5e72e4" />
                          <Text style={styles.postMetaText}>{post.place}</Text>
                        </View>
                      )}
                      
                      <View style={styles.postMetaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#5e72e4" />
                        <Text style={styles.postMetaText}>{formatDate(post.date)}</Text>
                      </View>
                      
                      <View style={styles.postMetaItem}>
                        <Ionicons name="chatbubble-outline" size={14} color="#5e72e4" />
                        <Text style={styles.postMetaText}>
                          {post.comments?.length || 0} comments
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Edit Modal */}
      <Modal
        visible={editModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Update {modalType === 'email' ? 'Email' : 'Phone Number'}
              </Text>
              
              <TextInput
                style={styles.modalInput}
                value={newValue}
                onChangeText={setNewValue}
                placeholder={modalType === 'email' ? "Enter new email" : "Enter new phone number"}
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType={modalType === 'email' ? "email-address" : "phone-pad"}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.updateButton]}
                  onPress={handleUpdate}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#213448',
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: "#a0b0c0",
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#5e72e4',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 10,
  },
  contactInfo: {
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#5e72e4',
    padding: 6,
    borderRadius: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  signOutText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  postsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  loadingPosts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingPostsText: {
    marginTop: 10,
    color: '#a0b0c0',
  },
  emptyPosts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyPostsText: {
    color: '#a0b0c0',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5e72e4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  createPostText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  postsList: {
    marginTop: 10,
  },
  postCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  postImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  postContent: {
    padding: 16,
  },
  postDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  postMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBlur: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(33, 52, 72, 0.9)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#5e72e4',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});