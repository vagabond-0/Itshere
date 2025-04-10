import { Slot } from "expo-router";
import { SafeAreaView, Text, View } from "react-native";
import { AuthProvider } from "../context/AuthContext";

export default function layout() {
    return <SafeAreaView>
        <AuthProvider>
            <Slot />
        </AuthProvider>
    </SafeAreaView>
}