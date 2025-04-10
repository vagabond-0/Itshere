import { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import {useFonts, Poppins_900Black,} from "@expo-google-fonts/dev"
import {MaterialIcons,AntDesign} from '@expo/vector-icons';
import TopBar from "../components/TopBar";

export default function(){
    let [fontloaded] = useFonts(
        {
            Poppins_900Black
        }
    )
    if(fontloaded){
    return <SafeAreaView>
        <TopBar />
    </SafeAreaView>
    }
}