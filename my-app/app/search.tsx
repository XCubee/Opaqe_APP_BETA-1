import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput,
  FlatList,
  Image,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { 
  AntDesign, 
  FontAwesome, 
  MaterialIcons, 
  Ionicons,
  Feather 
} from '@expo/vector-icons';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  tagline?: string;
  skills: string[];
  domains: string[];
  availability?: string;
  profile_picture?: string;
  created_at: string;
}

interface ConnectionRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  from_user: UserProfile;
}

export default function Search() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);

  useEffect(() => {
    getUser();
    loadConnectionRequests();
  }, []);

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }

  async function loadConnectionRequests() {
    try {
      if (!user) return;

      // Load incoming connection requests
      const { data: requests, error } = await supabase
        .from('connection_requests')
        .select(`
          *,
          from_user:users!connection_requests_from_user_id_fkey(*)
        `)
        .eq('to_user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading connection requests:', error);
      } else {
        setConnectionRequests(requests || []);
      }
    } catch (error) {
      console.error('Error loading connection requests:', error);
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search for users based on username, skills, or domains
      const { data: results, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,skills.cs.{${query}},domains.cs.{${query}}`)
        .neq('id', user?.id) // Exclude current user
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (toUserId: string) => {
    try {
      if (!user) {
        Alert.alert('Error', 'Please log in to send connection requests');
        return;
      }

      // Check if connection request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('to_user_id', toUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing request:', checkError);
        return;
      }

      if (existingRequest) {
        Alert.alert('Already Sent', 'You have already sent a connection request to this user');
        return;
      }

      // Send connection request
      const { error: insertError } = await supabase
        .from('connection_requests')
        .insert([
          {
            from_user_id: user.id,
            to_user_id: toUserId,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ]);

      if (insertError) {
        console.error('Error sending connection request:', insertError);
        Alert.alert('Error', 'Failed to send connection request. Please try again.');
      } else {
        Alert.alert('Success', 'Connection request sent successfully!');
        
        // Send notification (in real app, this would use push notifications)
        await sendNotification(toUserId, 'New Connection Request', 
          `${user.email?.split('@')[0] || 'Someone'} wants to connect with you!`);
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const sendNotification = async (userId: string, title: string, message: string) => {
    try {
      // In a real app, this would integrate with a push notification service
      // For now, we'll just log it
      console.log(`Notification to ${userId}: ${title} - ${message}`);
      
      // You could also store notifications in a database table
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            title: title,
            message: message,
            type: 'connection_request',
            read: false,
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        console.error('Error saving notification:', error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleAcceptConnection = async (requestId: string, fromUserId: string) => {
    try {
      // Update connection request status
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error accepting connection:', updateError);
        Alert.alert('Error', 'Failed to accept connection. Please try again.');
        return;
      }

      // Send notification to the other user
      await sendNotification(fromUserId, 'Connection Accepted', 
        `${user.email?.split('@')[0] || 'Someone'} accepted your connection request!`);

      // Remove from the list
      setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
      
      Alert.alert('Success', 'Connection accepted!');
    } catch (error) {
      console.error('Error accepting connection:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleRejectConnection = async (requestId: string) => {
    try {
      // Update connection request status
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error rejecting connection:', updateError);
        Alert.alert('Error', 'Failed to reject connection. Please try again.');
        return;
      }

      // Remove from the list
      setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
      
      Alert.alert('Success', 'Connection rejected');
    } catch (error) {
      console.error('Error rejecting connection:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const renderUserCard = ({ item }: { item: UserProfile }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.username?.charAt(0) || item.email?.charAt(0) || 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username || item.email?.split('@')[0]}</Text>
          <Text style={styles.userTagline}>{item.tagline || 'No tagline yet'}</Text>
        </View>
      </View>
      
      {item.skills && item.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {item.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillTagText}>{skill}</Text>
            </View>
          ))}
          {item.skills.length > 3 && (
            <Text style={styles.moreSkills}>+{item.skills.length - 3} more</Text>
          )}
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.connectButton}
        onPress={() => sendConnectionRequest(item.id)}
      >
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConnectionRequest = ({ item }: { item: ConnectionRequest }) => (
    <View style={styles.connectionRequestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestAvatar}>
          <Text style={styles.requestAvatarText}>
            {item.from_user?.username?.charAt(0) || item.from_user?.email?.charAt(0) || 'U'}
          </Text>
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>
            {item.from_user?.username || item.from_user?.email?.split('@')[0]}
          </Text>
          <Text style={styles.requestTagline}>
            {item.from_user?.tagline || 'No tagline yet'}
          </Text>
        </View>
      </View>
      
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => handleRejectConnection(item.id)}
        >
          <Text style={styles.rejectButtonText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptConnection(item.id, item.from_user_id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
          <Text style={styles.profileButtonText}>
            {user?.email?.charAt(0) || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#4A5568" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people by name, skills, or interests..."
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Connection Requests */}
        {connectionRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Requests</Text>
            <FlatList
              data={connectionRequests}
              renderItem={renderConnectionRequest}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Search Results */}
        {searchQuery.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {loading ? 'Searching...' : `Search Results (${searchResults.length})`}
            </Text>
            
            {searchResults.length === 0 && !loading && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No users found matching "{searchQuery}"</Text>
                <Text style={styles.noResultsSubtext}>Try searching for different skills or interests</Text>
              </View>
            )}
            
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                renderItem={renderUserCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            )}
          </View>
        )}

        {/* Popular Skills */}
        {searchQuery.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Skills</Text>
            <View style={styles.popularSkills}>
              {['React', 'Python', 'AI/ML', 'UI/UX', 'Blockchain', 'Cloud Computing'].map((skill, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.popularSkillTag}
                  onPress={() => handleSearch(skill)}
                >
                  <Text style={styles.popularSkillText}>{skill}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/home')}
        >
          <AntDesign name="home" size={24} color="#4A5568" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
        >
          <AntDesign name="search1" size={24} color="#007AFF" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Explore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => console.log('Teams')}
        >
          <AntDesign name="team" size={24} color="#4A5568" />
          <Text style={styles.navLabel}>Teams</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => console.log('Network')}
        >
          <AntDesign name="user" size={24} color="#4A5568" />
          <Text style={styles.navLabel}>Network</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <AntDesign name="user" size={24} color="#4A5568" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 18,
    color: '#4A5568',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A5568',
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 15,
    paddingHorizontal: 24,
  },
  horizontalList: {
    paddingHorizontal: 24,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 15,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  userTagline: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 18,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  skillTag: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  skillTagText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 15,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  requestTagline: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 18,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4299E1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  noResultsText: {
    fontSize: 18,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  popularSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 24,
  },
  popularSkillTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  popularSkillText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {
    // Active state styling
  },
  navLabel: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
}); 