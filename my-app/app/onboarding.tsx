import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { AntDesign, FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  tagline?: string;
  skills: string[];
  domains: string[];
  availability?: string;
  profile_picture?: string;
}

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    tagline: '',
    skills: [],
    domains: [],
    availability: '',
  });

  useEffect(() => {
    checkDatabaseStatus();
    loadExistingProfile();
    checkUserSession();
  }, []);

  async function checkUserSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No active session, redirect to login
        router.replace('/login');
        return;
      }
    } catch (error) {
      console.error('Error checking session:', error);
      router.replace('/login');
    }
  }

  async function checkDatabaseStatus() {
    try {
      // Simple test query to check if users table exists
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205') {
          setDbStatus('error');
        } else if (error.message?.includes('Network request failed')) {
          setDbStatus('error');
        } else {
          setDbStatus('connected');
        }
      } else {
        setDbStatus('connected');
      }
    } catch (error: any) {
      if (error.message?.includes('Network request failed')) {
        setDbStatus('error');
      } else {
        setDbStatus('error');
      }
    }
  }

  async function loadExistingProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to load existing profile data
        const { data: profileData, error } = await supabase
          .from('users')
          .select('tagline, skills, domains, availability')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          
          // If it's a table not found error, show helpful message
          if (error.code === 'PGRST205') {
            console.log('Users table not found - database setup required');
          }
        } else if (profileData) {
          setProfile({
            tagline: profileData.tagline || '',
            skills: profileData.skills || [],
            domains: profileData.domains || [],
            availability: profileData.availability || '',
          });
        }
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }

  const skills = [
    { id: 'frontend', label: 'Frontend', icon: 'code' },
    { id: 'backend', label: 'Backend', icon: 'dns' },
    { id: 'ml-ai', label: 'ML / AI', icon: 'memory' },
    { id: 'ui-ux', label: 'UI/UX', icon: 'palette' },
    { id: 'hardware', label: 'Hardware', icon: 'build' },
    { id: 'business', label: 'Business', icon: 'business' },
    { id: 'pitching', label: 'Pitching', icon: 'campaign' },
  ];

  const domains = [
    { id: 'ai', label: 'AI', icon: 'auto-awesome' },
    { id: 'blockchain', label: 'Blockchain', icon: 'currency-bitcoin' },
    { id: 'healthtech', label: 'HealthTech', icon: 'favorite' },
    { id: 'sustainability', label: 'Sustainability', icon: 'eco' },
    { id: 'fintech', label: 'FinTech', icon: 'account-balance-wallet' },
  ];

  const toggleSkill = (skillId: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills?.includes(skillId)
        ? prev.skills.filter(id => id !== skillId)
        : [...(prev.skills || []), skillId]
    }));
  };

  const toggleDomain = (domainId: string) => {
    setProfile(prev => ({
      ...prev,
      domains: prev.domains?.includes(domainId)
        ? prev.domains.filter(id => id !== domainId)
        : [...(prev.domains || []), domainId]
    }));
  };

  const handleCompleteSetup = async () => {
    if (loading) return;

    // Validation
    if (!profile.tagline?.trim()) {
      alert('Please add your tagline');
      return;
    }

    if (profile.skills?.length === 0) {
      alert('Please select at least one skill');
      return;
    }

    if (profile.domains?.length === 0) {
      alert('Please select at least one domain');
      return;
    }

    setLoading(true);

    try {
      // Get current user - try multiple methods
      let user = null;
      
      // Method 1: Try to get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        user = currentUser;
      }
      
      // Method 2: If no current user, try to get session
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          user = session.user;
        }
      }
      
      // Method 3: If still no user, check if we're coming from signup
      if (!user) {
        // Wait a bit and try again (sometimes session takes time to establish)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: { user: retryUser } } = await supabase.auth.getUser();
        if (retryUser) {
          user = retryUser;
        }
      }
      
      if (!user) {
        alert('User session not found. Please try signing up again.');
        router.replace('/login');
        return;
      }

      // First try to update existing profile
      let { error } = await supabase
        .from('users')
        .update({
          tagline: profile.tagline?.trim(),
          skills: profile.skills,
          domains: profile.domains,
          availability: profile.availability?.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // If update fails, try to insert (in case user was created but profile wasn't saved)
      if (error) {
        console.log('Update failed, trying insert:', error);
        
        // Try to insert the profile
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              username: user.email?.split('@')[0] || 'user',
              email: user.email || '',
              tagline: profile.tagline?.trim(),
              skills: profile.skills,
              domains: profile.domains,
              availability: profile.availability?.trim(),
              created_at: new Date().toISOString(),
            }
          ]);

        if (insertError) {
          console.error('Error saving profile:', insertError);
          
          if (insertError.code === 'PGRST205') {
            alert('Database setup required. Please contact support or try again later.');
            return;
          } else {
            alert('Failed to save profile. Please try again.');
            return;
          }
        }
      }

      // Profile saved successfully, redirect to home
      alert('Profile saved successfully!');
      router.replace('/home');
    } catch (error: any) {
      console.error('Error during profile setup:', error);
      
      if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
        alert('Connection error. Please check your internet connection and try again.');
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderSkillButton = (skill: { id: string; label: string; icon: string }) => {
    const isSelected = profile.skills?.includes(skill.id);
    return (
      <TouchableOpacity
        key={skill.id}
        style={[styles.skillButton, isSelected && styles.skillButtonSelected]}
        onPress={() => toggleSkill(skill.id)}
      >
        <MaterialIcons 
          name={skill.icon as any} 
          size={20} 
          color={isSelected ? '#007AFF' : '#4A5568'} 
        />
        <Text style={[styles.skillButtonText, isSelected && styles.skillButtonTextSelected]}>
          {skill.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDomainButton = (domain: { id: string; label: string; icon: string }) => {
    const isSelected = profile.domains?.includes(domain.id);
    return (
      <TouchableOpacity
        key={domain.id}
        style={[styles.domainButton, isSelected && styles.domainButtonSelected]}
        onPress={() => toggleDomain(domain.id)}
      >
        <MaterialIcons 
          name={domain.icon as any} 
          size={20} 
          color={isSelected ? '#007AFF' : '#4A5568'} 
        />
        <Text style={[styles.domainButtonText, isSelected && styles.domainButtonTextSelected]}>
          {domain.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Join Opaque, Level Up!</Text>
        <Text style={styles.subtitle}>
          {profile.tagline || profile.skills.length > 0 || profile.domains.length > 0 
            ? 'Update your profile to connect with the best hackathon teams.'
            : 'Let\'s set up your profile to connect with the best hackathon teams.'
          }
        </Text>

        {/* Database Status Indicator */}
        {dbStatus === 'checking' && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Checking database connection...</Text>
          </View>
        )}
        
        {dbStatus === 'error' && (
          <View style={[styles.statusContainer, styles.statusError]}>
            <Text style={styles.statusErrorText}>
              ⚠️ Database not set up. Please run the SQL setup script in Supabase first.
            </Text>
            <TouchableOpacity 
              style={styles.setupButton}
              onPress={() => {
                alert('Please go to your Supabase dashboard → SQL Editor → Run the supabase-setup.sql file');
              }}
            >
              <Text style={styles.setupButtonText}>View Setup Instructions</Text>
            </TouchableOpacity>
          </View>
        )}

     

        {/* Tell Us About Yourself Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell Us About Yourself</Text>
          <Text style={styles.sectionSubtitle}>This helps us find your ideal team.</Text>
          
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              <MaterialIcons name="person" size={40} color="#CBD5E0" />
            </View>
          </View>

          <Text style={styles.inputLabel}>Craft Your Tagline</Text>
                     <TextInput
             style={styles.textInput}
             placeholder="e.g., ML Enthusiast | Seeking Innovators"
             placeholderTextColor="#1A202C"
             value={profile.tagline}
             onChangeText={(text) => setProfile(prev => ({ ...prev, tagline: text }))}
             multiline
             numberOfLines={2}
           />
        </View>

        {/* Your Core Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Core Skills</Text>
          <View style={styles.skillsGrid}>
            {skills.map(skill => renderSkillButton(skill))}
          </View>
        </View>

        {/* Preferred Hackathon Domains Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Hackathon Domains</Text>
          <View style={styles.domainsGrid}>
            {domains.map(domain => renderDomainButton(domain))}
          </View>
        </View>

        {/* Availability Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability Status</Text>
                     <TextInput
             style={styles.textInput}
             placeholder="e.g., Weekends, Evenings after 6 PM"
             placeholderTextColor="#1A202C"
             value={profile.availability}
             onChangeText={(text) => setProfile(prev => ({ ...prev, availability: text }))}
             multiline
             numberOfLines={2}
           />
        </View>

        {/* Complete Setup Button */}
        <TouchableOpacity 
          style={[styles.completeButton, loading && styles.completeButtonDisabled]} 
          onPress={handleCompleteSetup}
          disabled={loading}
        >
          <Text style={styles.completeButtonText}>
            {loading ? 'Saving...' : (profile.tagline || profile.skills.length > 0 || profile.domains.length > 0 ? 'Update Profile' : 'Complete Setup')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 16,
  },
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
  socialButtonText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    marginLeft: 12,
  },
  importText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 50,
    color: '#1A202C', // Dark text color for input
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: '48%',
    justifyContent: 'center',
    gap: 8,
  },
  skillButtonSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#007AFF',
  },
  skillButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  skillButtonTextSelected: {
    color: '#007AFF',
  },
  domainsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  domainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: '48%',
    justifyContent: 'center',
    gap: 8,
  },
  domainButtonSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#007AFF',
  },
  domainButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  domainButtonTextSelected: {
    color: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  completeButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEE6C9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  statusError: {
    borderColor: '#F56565',
    backgroundColor: '#FEF2F2',
  },
  statusErrorText: {
    fontSize: 14,
    color: '#C53030',
    textAlign: 'center',
  },
  setupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 