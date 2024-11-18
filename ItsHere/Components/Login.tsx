import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

interface LoginProps {
  onLogin: (uuid: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (email) {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('http://127.0.0.1:8080/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gmail: email }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data from server');
        }

        const data = await response.json();
        const uuid = data.uuid;

        localStorage.setItem('uuid', uuid);

        onLogin(uuid);
      } catch (error) {
        setError('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login</Text>
      
  \
      <TextInput
        style={styles.input}
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
      />
      

      {error && <Text style={styles.errorText}>{error}</Text>}
      
  
      <Button 
        title={isLoading ? 'Logging in...' : 'Login'} 
        onPress={handleLogin} 
        disabled={isLoading} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default Login;
