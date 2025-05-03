import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/user-auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {login,isAuthenticated} = useAuth();
  const router = useRouter();


  useEffect(()=>{
    if(isAuthenticated){
      router.push("/(tabs)/Home");
    }
  },[])
  const handleLogin = () => {
    console.log('Username:', username, 'Password:', password);
    login(username,password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
            color="#ccc"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => console.log('Forgot password')}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.registerText}>
          Don't have an account? <Text style={styles.registerLink}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    color: '#ffd33d',
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  passwordContainer: {
    backgroundColor: '#1c1c1e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
  },
  forgotText: {
    color: '#aaa',
    textAlign: 'right',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#ffd33d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 16,
  },
  registerText: {
    color: '#aaa',
    textAlign: 'center',
  },
  registerLink: {
    color: '#ffd33d',
    fontWeight: 'bold',
  },
});
