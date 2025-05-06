import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Post() {
  const [post, setPost] = useState({
    description: "",
    date: new Date().toISOString().split('T')[0],
    place: "",
    image_link: "",
    user: "",
    comments: []
  });
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fabAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        
        // Animate image appearance
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0.5, duration: 300, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to access image library");
    }
  };

  const uploadImageToCloudinary = async (imageUri: string) => {
    const data = new FormData();
    data.append("file", {
      uri: imageUri,
      name: "upload.jpg",
      type: "image/jpeg"
    } as any);
    data.append("upload_preset", "w9ychwal");
    data.append("cloud_name", "dztokafis");
  
    try {
      // Mock upload progress
      const updateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) clearInterval(interval);
        }, 100);
      };
      updateProgress();

      const res = await fetch("https://api.cloudinary.com/v1_1/dztokafis/image/upload", {
        method: "POST",
        body: data
      });
      const result = await res.json();
      setUploadProgress(100);
      return result.secure_url;
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadProgress(0);
      return null;
    }
  };
  
  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Error retrieving token:", error);
      }
    };

    getToken();
  }, []);

  const handleChange = (field: string, value: any) => {
    setPost({ ...post, [field]: value });
  };

  const handleSubmit = () => {
    Alert.alert(
      "Confirm Post",
      "Are you sure you want to create this post?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Post",
          onPress: createPost
        }
      ],
      { cancelable: true }
    );
  };

  const createPost = async () => {
    if (!post.description) {
      Alert.alert("Error", "Post description is required");
      return;
    }
  
    setIsLoading(true);
  
    try {
      let imageUrl = "";
      if (image) {
        const uploadedUrl = await uploadImageToCloudinary(image);
        if (!uploadedUrl) {
          Alert.alert("Error", "Image upload failed");
          setIsLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }
  
      const fullPost = { ...post, image_link: imageUrl };
  
      const response = await fetch("https://itsherebackend-production.up.railway.app/api/createpost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `auth_token=${token}`
        },
        body: JSON.stringify(fullPost)
      });
  
      const data = await response.json();
  
      if (response.ok) {
        Alert.alert("Success", "Post created successfully!");
        setPost({
          description: "",
          date: new Date().toISOString().split('T')[0],
          place: "",
          image_link: "",
          user: "",
          comments: []
        });
        setImage(null);
        setUploadProgress(0);
      } else {
        Alert.alert("Error", data.message || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <LinearGradient
          colors={['#213448', '#1a2a3d', '#152238']}
          style={styles.gradientBackground}
        />
        
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.headerContainer, 
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Text style={styles.title}>Missing Something?</Text>
            <Text style={styles.subtitle}>Share it with your community</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.formCard, 
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="document-text-outline" size={18} color="#5e72e4" />
                <Text style={styles.label}>Description</Text>
              </View>
              <TextInput
                style={styles.textArea}
                placeholder="What are you looking for?"
                placeholderTextColor="#a0a0a0"
                multiline
                numberOfLines={4}
                value={post.description}
                onChangeText={(text) => handleChange("description", text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location-outline" size={18} color="#5e72e4" />
                <Text style={styles.label}>Location</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Where did you last see it?"
                placeholderTextColor="#a0a0a0"
                value={post.place}
                onChangeText={(text) => handleChange("place", text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="image-outline" size={18} color="#5e72e4" />
                <Text style={styles.label}>Add Image</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={22} color="#ffffff" />
                <Text style={styles.uploadButtonText}>
                  {image ? "Change Image" : "Choose Image"}
                </Text>
              </TouchableOpacity>
            </View>

            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="close-circle" size={28} color="#ff4757" />
                </TouchableOpacity>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                  </View>
                )}
              </View>
            )}
          </Animated.View>
          
          {/* Extra space at the bottom to ensure content isn't hidden behind the FAB */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button (FAB) */}
        <Animated.View 
          style={[
            styles.fabContainer,
            {
              opacity: fabAnim,
              transform: [
                { scale: fabAnim },
                { translateY: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })}
              ]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Ionicons name="send" size={26} color="#fff" />
                <Text style={styles.fabText}>Post</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#213448",
  },
  container: {
    flex: 1,
    backgroundColor: "#213448",
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120, // Extra padding to account for the FAB
  },
  headerContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#a0b0c0",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 22,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    color: '#333',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 120,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    color: '#333',
  },
  uploadButton: {
    backgroundColor: "#5e72e4",
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  imagePreview: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 2,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    height: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#5e72e4',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    zIndex: 1000,
  },
  fab: {
    width: 130,
    height: 54,
    borderRadius: 30,
    backgroundColor: '#5e72e4',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    bottom:50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 8,
  },
  postButtonDisabled: {
    backgroundColor: "#45526e",
  },
});