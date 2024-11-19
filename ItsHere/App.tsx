import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Login from './Components/Login';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';


const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userUUID, setUserUUID] = useState<string | null>(null);
  const user = auth().currentUser
  useEffect(() => {
    const uuid = localStorage.getItem('uuid');
    if (uuid) {
      setIsLoggedIn(true);
      setUserUUID(uuid);
    }
  }, []);

  const handleLogin = (uuid: string) => {
    setIsLoggedIn(true);
    setUserUUID(uuid);
  };

  return (
    <View style={styles.container}>
      {user ? (
        <Text>Welcome, User! Your UUID: {userUUID}</Text>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
