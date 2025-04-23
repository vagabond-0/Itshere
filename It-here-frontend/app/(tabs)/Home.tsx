import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';

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
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('http://192.168.79.208:8000/api/getallposts');
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {posts.map((post, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.userInfo}>
            <Image source={{ uri: post.user.profile_picture }} style={styles.avatar} />
            <View>
              <Text style={styles.username}>{post.user.username}</Text>
              <Text style={styles.date}>{post.date}</Text>
            </View>
          </View>

          {post.image_link?<Image source={{ uri: post.image_link }} style={styles.postImage} />:<></>}

          <View style={styles.details}>
            {post.place?<Text style={styles.place}>{post.place}</Text>:<></>}
            <Text style={styles.description}>{post.description}</Text>
          </View>
          <View style={styles.connection}>
          <TouchableOpacity style={styles.commentButton} onPress={() => console.log('Connect pressed')}>
            <Text style={styles.connectText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.connectButton} onPress={() => console.log('Connect pressed')}>
            <Text style={styles.connectText}>Connect</Text>
          </TouchableOpacity>
          </View>
         
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  commentButton:{
    width:'50%',
    backgroundColor: '#3f51b5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
  },
  date: {
    color: '#888',
    fontSize: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
  },
  place: {
    fontWeight: '500',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
  },
  connectButton: {
    width:'50%',
    backgroundColor: '#3f51b5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connection:{
    display:'flex',
    flexDirection:'row',
    gap:10,
    justifyContent:"space-between"
  }
});
