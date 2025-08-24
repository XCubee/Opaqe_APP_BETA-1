import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is logged in, check if they have completed onboarding
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('tagline, skills, domains')
          .eq('id', session.user.id)
          .single();

        if (error || !userProfile || !userProfile.tagline || !userProfile.skills || userProfile.skills.length === 0) {
          // User hasn't completed onboarding, redirect to onboarding
          router.replace('/onboarding');
        } else {
          // User has completed onboarding, redirect to home
          router.replace('/home');
        }
      } else {
        // User is not logged in, redirect to login
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      // On error, redirect to login
      router.replace('/login');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Opaque</Text>
      <Text style={styles.subtitle}>Level Up Your Hackathon Game</Text>
      <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
}); 