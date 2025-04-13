import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
export default function Index(){
    const router = useRouter();
    
    return(
        <View>
            <Text>Hekii</Text>
            <Link href="/about" >
        Go to About screen
      </Link>

        </View>
    )
}

const styles = StyleSheet.create({

})