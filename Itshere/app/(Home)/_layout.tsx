import { Slot } from "expo-router";
import { SafeAreaView, Text, View } from "react-native";

export default function layout(){
    return <SafeAreaView>
        <Slot />
    </SafeAreaView>
}