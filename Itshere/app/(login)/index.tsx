import { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import {useFonts, Poppins_900Black,} from "@expo-google-fonts/dev"
import {MaterialIcons,AntDesign} from '@expo/vector-icons';

export default function(){
    let [fontloaded] = useFonts(
        {
            Poppins_900Black
        }
    )
    if(fontloaded){
    return <SafeAreaView>
        <View style={{width:"100%",height:"100%",alignItems:"center",justifyContent:"center",display:"flex",flexDirection:"column"}}>
            <Text style={{fontSize:40,fontFamily:"Poppins_900Black"}}>
                It's Here
            </Text>
            <AntDesign name="google" size={40} color="black" />
        </View>
    </SafeAreaView>
    }
}