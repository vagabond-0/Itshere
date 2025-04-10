import React, { useEffect } from "react";

import { View, Text, TouchableOpacity, Button } from "react-native";
import * as webBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
//web 676766196369-53q01p2s8htgrkkdh3f6ucnog09qe5gu.apps.googleusercontent.com
//ios 676766196369-85na8q6sve5dqqgih8ugf02gmvcr5fuc.apps.googleusercontent.com
//android 676766196369-7s8da08ap9rorb665ua5knskal293umo.apps.googleusercontent.com
const TopBar = () => {
    const [userinfo,setuserInfo] = React.useState(null);
    const [request,response,promptAsync] = Google.useAuthRequest({
        androidClientId:"676766196369-7s8da08ap9rorb665ua5knskal293umo.apps.googleusercontent.com",
        iosClientId:"676766196369-85na8q6sve5dqqgih8ugf02gmvcr5fuc.apps.googleusercontent.com",
        webClientId:"676766196369-53q01p2s8htgrkkdh3f6ucnog09qe5gu.apps.googleusercontent.com"
    })

    async function handleSignInGoogle() {
        const user  = await AsyncStorage.getItem("@user");
        if(!user){
            if(response?.type === "success"){

                await getUserInfo(response.authentication?.accessToken);
               
            }
            
        }else{
            setuserInfo(JSON.parse(user));
        }
    }
    useEffect(() => {
        handleSignInGoogle();
    }
    , [response]);

    const getUserInfo = async (token: string | undefined) => {
        if(!token) return;
        const response = await fetch("https://www.googleapis.com/userinfo/v2/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();
        setuserInfo(data);
        await AsyncStorage.setItem("@user", JSON.stringify(data));
    }
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
      <Button title="SignIn" onPress={() => promptAsync()}  />
    </View>
  );
};

export default TopBar;