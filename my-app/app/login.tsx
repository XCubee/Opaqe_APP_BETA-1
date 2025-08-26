// File: app/login.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
// Corrected the import path to go up two directories
import { supabase } from '../lib/supabase'; 

const LoginScreen = () => {
  const router = useRouter();

  // State for toggling between Sign In and Sign Up
  const [isSigningUp, setIsSigningUp] = useState(false);

  // State for form inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Supabase Authentication Functions ---

  async function signUpWithEmail() {
    if (loading) return;
    
    // Validation
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      // First, create the user in Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        Alert.alert('Sign Up Error', authError.message);
        return;
      }

      if (authData.user) {
        // Now save additional user data to our custom users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              username: username.trim(),
              email: email.trim(),
              created_at: new Date().toISOString(),
            }
          ]);

               if (profileError) {
         console.error('Error saving user profile:', profileError);
         
         // Check if it's a table not found error
         if (profileError.code === 'PGRST205') {
           Alert.alert(
             'Database Setup Required', 
             'The users table has not been created yet. Please run the supabase-setup-working.sql script in your Supabase dashboard first.',
             [
               {
                 text: 'OK',
                 onPress: () => {
                   // Still redirect to onboarding, user can complete setup later
                   router.replace('/onboarding');
                 }
               }
             ]
           );
         } else if (profileError.message?.includes('Network request failed')) {
           Alert.alert(
             'Database Connection Error', 
             'The users table does not exist. Please run the supabase-setup-working.sql script in your Supabase dashboard first.',
             [
               {
                 text: 'OK',
                 onPress: () => {
                   router.replace('/onboarding');
                 }
               }
             ]
           );
         } else {
           Alert.alert('Warning', 'Account created but profile setup incomplete. Please try logging in.');
           // Still redirect to onboarding
           router.replace('/onboarding');
         }
                } else {
           Alert.alert(
             'Account Created Successfully!', 
             'Please check your email and click the confirmation link before signing in.',
             [
               {
                 text: 'OK',
                 onPress: () => {
                   // Go back to sign in mode
                   setIsSigningUp(false);
                 }
               }
             ]
           );
         }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Check if it's a network error
      if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      } else {
        Alert.alert('Error', 'An unexpected error occurred during signup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail() {
    if (loading) return;
    
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in email and password');
      return;
    }

    setLoading(true);
    
    try {
      // Sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Handle specific email confirmation error
        if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Confirmed', 
            'Please check your email and click the confirmation link before signing in.',
            [
              {
                text: 'Resend Confirmation',
                onPress: () => resendConfirmationEmail(email.trim())
              },
              {
                text: 'OK',
                style: 'cancel'
              }
            ]
          );
        } else {
          Alert.alert('Sign In Error', error.message);
        }
        return;
      }

      if (data.user) {
        // Check if user has a profile in our users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('tagline, skills, domains')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking profile:', profileError);
        }

        // If user has complete profile, go to home, otherwise go to onboarding
        if (profileData && profileData.tagline && profileData.skills?.length > 0 && profileData.domains?.length > 0) {
          router.replace('/home');
        } else {
          router.replace('/onboarding');
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      } else {
        Alert.alert('Error', 'An unexpected error occurred during signin');
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        Alert.alert('Error', 'Failed to resend confirmation email. Please try again.');
      } else {
        Alert.alert('Success', 'Confirmation email sent! Please check your inbox.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend confirmation email. Please try again.');
    }
  }

  // --- Social Login Handlers (placeholders) ---
  const handleGmailSignIn = () => console.log('Continue with Gmail');
  const handleGitHubSignIn = () => console.log('Continue with GitHub');
  const handleLinkedInSignIn = () => console.log('Continue with LinkedIn');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome to OPAQÉ</Text>
        <Text style={styles.subtitle}>
          Let's set up your profile to connect with the best hackathon teams out there.
        </Text>

        {/* Email/Password Form */}
        <View style={styles.formContainer}>
                         {isSigningUp && (
               <TextInput
                 style={styles.input}
                 placeholder="Username"
                 placeholderTextColor="#1A202C"
                 value={username}
                 onChangeText={setUsername}
                 autoCapitalize="none"
                 autoCorrect={false}
               />
             )}
             <TextInput
                 style={styles.input}
                 placeholder="Email"
                 placeholderTextColor="#1A202C"
                 value={email}
                 onChangeText={setEmail}
                 autoCapitalize="none"
                 keyboardType="email-address"
             />
             <TextInput
                 style={styles.input}
                 placeholder="Password"
                 placeholderTextColor="#1A202C"
                 value={password}
                 onChangeText={setPassword}
                 secureTextEntry
             />
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={isSigningUp ? signUpWithEmail : signInWithEmail}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{isSigningUp ? 'Sign Up' : 'Sign In'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSigningUp(!isSigningUp)}>
                <Text style={styles.toggleText}>
                    {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Text>
            </TouchableOpacity>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A202C', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4A5568', textAlign: 'center', marginBottom: 30 },
  formContainer: { width: '100%', marginBottom: 20 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  toggleText: { textAlign: 'center', color: '#007AFF', fontWeight: '500' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 10, color: '#A0AEC0', fontWeight: '500' },
  socialContainer: { width: '100%' },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  socialButtonText: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '500', color: '#2D3748' },
});

export default LoginScreen;
