import { useState, useEffect } from "react";
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Image, 
  ActivityIndicator 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Post() {
  const [post, setPost] = useState({
    description: "",
    date: new Date().toISOString().split('T')[0],
    place: "",
    image_link: "",
    user: "",
    comments: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");
  
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
  
  const handleChange = (field:any, value:any) => {
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
      ]
    );
  };
  
  const createPost = async () => {
    if (!post.description) {
      Alert.alert("Error", "Post description is required");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("http://192.168.79.208:8000/api/createpost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `auth_token=${token}`
        },
        body: JSON.stringify(post)
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
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Missing Something Post Here</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What's on your mind?"
            multiline
            numberOfLines={4}
            value={post.description}
            onChangeText={(text) => handleChange("description", text)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Where are you?"
            value={post.place}
            onChangeText={(text) => handleChange("place", text)}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Image URL</Text>
          <TextInput
            style={styles.input}
            placeholder="Add an image link"
            value={post.image_link}
            onChangeText={(text) => handleChange("image_link", text)}
          />
        </View>
        
        {post.image_link ? (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.previewLabel}>Image Preview:</Text>
            <Image
              source={{ uri: post.image_link }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.postButton} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.postButtonText}>Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#213448"
  },
  container: {
    flex: 1,
    padding: 15,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#ffffff",
    textAlign: "center"
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#ffffff",
    fontWeight: "500"
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 16,
  },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 120,
  },
  imagePreviewContainer: {
    marginBottom: 20,
    alignItems: "center"
  },
  previewLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#555",
    fontWeight: "500",
    alignSelf: "flex-start"
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#e0e0e0"
  },
  postButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4e6ef2",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }
});