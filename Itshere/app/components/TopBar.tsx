import React from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

const TopBar = () => {
  // Get auth context
  const { userInfo, isLoading, signIn, signOut } = useAuth();

  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#eee"
    }}>
      <Text style={{
        fontSize: 18,
        fontFamily: "Poppins_900Black",
      }}>It's Here</Text>
      
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : userInfo ? (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {userInfo.picture && (
            <Image
              source={{ uri: userInfo.picture }}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
            />
          )}
          <View style={{ marginRight: 12 }}>
            <Text style={{ 
              fontFamily: "Poppins_900Black", 
              fontSize: 14 
            }}>
              {userInfo.name}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: "#666" 
            }}>
              {userInfo.email}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: "#f0f0f0",
              borderRadius: 4
            }}
            onPress={signOut}
          >
            <Text style={{ fontFamily: "Poppins_900Black" }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#4285F4",
            borderRadius: 4,
          }}
          onPress={signIn}
        >
          <Text style={{ 
            color: "white", 
            fontFamily: "Poppins_900Black" 
          }}>
            Sign In
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TopBar;