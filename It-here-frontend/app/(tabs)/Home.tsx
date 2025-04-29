import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

type UserPublic = {
  _id: {
    $oid: string;
  };
  username: string;
  gmail: string;
  PhoneNumber: string;
  profile_picture: string;
};

type Comment = {
  id: number;
  user_id: string;
  message: string;
};

type Post = {
  id: {
    $oid: string;
  };
  description: string;
  date: string;
  place: string;
  image_link: string;
  user: UserPublic;
  comments: Comment[];
};

export default function Index() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://192.168.1.61:8000/api/getallposts');
      const data = await res.json();
      setPosts(data);
      
      // Start animation when posts are loaded
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();
      
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid date
    }
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#213448', '#1a2a3d', '#152238']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#5e72e4" />
        <Text style={styles.loadingText}>Loading posts...</Text>
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
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5e72e4"]}
            tintColor="#5e72e4"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Lost Items</Text>
          <Text style={styles.headerSubtitle}>Help your neighbors find what they lost</Text>
        </View>
        
        {posts.length > 0 ? (
          posts.map((post, index) => {
            // Calculate staggered animation delay based on index
            const animationDelay = index * 150;
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.cardContainer,
                  { 
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                    // Add a slight delay for each card
                    ...(animationDelay > 0 && { animationDelay: `${animationDelay}ms` })
                  }
                ]}
              >
                <View style={styles.card}>
                  <View style={styles.userInfo}>
                    <Image 
                      source={{ uri: post.user.profile_picture || 'https://via.placeholder.com/150' }} 
                      style={styles.avatar}
                    />
                    <View style={styles.userTextContainer}>
                      <Text style={styles.username}>{post.user.username}</Text>
                      <Text style={styles.date}>{formatDate(post.date)}</Text>
                    </View>
                  </View>

                  {post.image_link && (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: post.image_link }} style={styles.postImage} />
                    </View>
                  )}

                  <View style={styles.details}>
                    {post.place && (
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#5e72e4" />
                        <Text style={styles.place}>{post.place}</Text>
                      </View>
                    )}
                    <Text style={styles.description}>{post.description}</Text>
                  </View>
                  
                  <View style={styles.statsContainer}>
                    <View style={styles.stat}>
                      <Ionicons name="chatbubble-outline" size={16} color="#888" />
                      <Text style={styles.statText}>{post.comments.length} comments</Text>
                    </View>
                    <View style={styles.stat}>
                      <Ionicons name="time-outline" size={16} color="#888" />
                      <Text style={styles.statText}>{formatDate(post.date)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.separator} />
                  
                  <View style={styles.connection}>
                    <TouchableOpacity 
                      style={styles.commentButton} 
                      onPress={() => console.log('Comment pressed')}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Comment</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.connectButton} 
                      onPress={() => console.log('Connect pressed')}
                    >
                      <Ionicons name="link-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color="#5e72e4" />
            <Text style={styles.emptyText}>No posts found</Text>
            <Text style={styles.emptySubtext}>Be the first to post about a lost item!</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Floating action button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/post')}
        activeOpacity={0.8}
      >
        
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#213448",
  },
  scrollContainer: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700", 
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#a0b0c0",
    marginBottom: 16,
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
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    paddingBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#5e72e4',
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontWeight: '700',
    fontSize: 16,
    color: '#333',
  },
  date: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#f0f0f0',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  details: {
    padding: 16,
    paddingTop: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  place: {
    fontWeight: '600',
    fontSize: 14,
    color: '#5e72e4',
    marginLeft: 4,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
  connection: {
    flexDirection: 'row',
    padding: 12,
  },
  commentButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#5e72e4',
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#5e72e4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2dce89',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#2dce89",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0b0c0',
    marginTop: 8,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});