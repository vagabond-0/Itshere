import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Login from './Components/Login';


const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userUUID, setUserUUID] = useState<string | null>(null);

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
      {isLoggedIn ? (
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
