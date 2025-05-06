import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';

const defaultProfile = 'https://i.ibb.co/s6cs9Qj/profile.png';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    gmail: '',
    PhoneNumber: '',
    profile_picture: '',
    password1: '',
    password2: '',
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (field:any, value:any) => {
    setForm({ ...form, [field]: value });
  };

  const isStrongPassword = (password:any) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    return strongRegex.test(password);
  };

  const handleRegister = async () => {
    const { username, gmail, PhoneNumber, profile_picture, password1, password2 } = form;

    if (password1 !== password2) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!isStrongPassword(password1)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      );
      return;
    }

    const payload = {
      username,
      gmail,
      PhoneNumber,
      profile_picture: profile_picture || defaultProfile,
      password: password1,
    };

    try {
      const response = await fetch('https://itsherebackend-production.up.railway.app/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.push('/');
        }, 2000);
      } else {
        Alert.alert('Error', 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Create Account</Text>

        {/* Profile Picture URL */}
        <TextInput
          style={styles.input}
          placeholder="Profile Picture URL (optional)"
          placeholderTextColor="#aaa"
          value={form.profile_picture}
          onChangeText={(value) => handleChange('profile_picture', value)}
        />
        <Image
          source={{ uri: form.profile_picture || defaultProfile }}
          style={styles.profileImage}
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#aaa"
          value={form.username}
          onChangeText={(value) => handleChange('username', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Gmail"
          placeholderTextColor="#aaa"
          value={form.gmail}
          onChangeText={(value) => handleChange('gmail', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#aaa"
          value={form.PhoneNumber}
          onChangeText={(value) => handleChange('PhoneNumber', value)}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={form.password1}
          onChangeText={(value) => handleChange('password1', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={form.password2}
          onChangeText={(value) => handleChange('password2', value)}
        />

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Login</Text>
        </Text>
      </TouchableOpacity>
      </ScrollView>

      {showSuccess && (
        <View style={styles.animationWrapper}>
          <LottieView
            source={require('@/assets/success.json')}
            autoPlay
            loop={false}
            style={{ width: 150, height: 150 }}
          />
          <Text style={{ color: '#fff', marginTop: 10 }}>Registration Successful!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  title: {
    fontSize: 28,
    color: '#ffd33d',
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#ffd33d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffd33d',
  },
  animationWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loginText: {
    marginTop:10,
    color: '#aaa',
    textAlign: 'center',
},
loginLink: {
    color: '#ffd33d',
    fontWeight: 'bold',
}
});
