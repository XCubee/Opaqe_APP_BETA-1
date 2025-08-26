import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput,
  Image,
  FlatList,
  Dimensions
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

const { width } = Dimensions.get('window');

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

interface FriendRequest {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  skills: string[];
  avatar: string;
}

interface Hackathon {
  id: string;
  name: string;
  date: string;
  location: string;
  banner: string;
  registered?: boolean;
  teamName?: string;
}

interface Person {
  id: string;
  name: string;
  role: string;
  skills: string[];
  avatar: string;
}

interface ActivityPost {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  avatar: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('home');
  const [showHackathonOptions, setShowHackathonOptions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 7,
    hours: 14,
    minutes: 32,
    seconds: 51
  });
  const [friendCount, setFriendCount] = useState(0);

  // Real data from Supabase - initially empty
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  // Empty registered hackathons since user hasn't registered for any
  const [registeredHackathons, setRegisteredHackathons] = useState<Hackathon[]>([]);
  
  const [upcomingHackathons] = useState<Hackathon[]>([
    {
      id: '2',
      name: 'Future of Healthcare Hackathon',
      date: 'Dec 2-4, 2024',
      location: 'London, UK',
      banner: '🏥',
      registered: false
    },
    {
      id: '3',
      name: 'Sustainable Tech Challenge',
      date: 'Jan 10-12, 2025',
      location: 'San Francisco, CA',
      banner: '🌱',
      registered: false
    }
  ]);

  const [people] = useState<Person[]>([
    {
      id: '1',
      name: 'Emily Chen',
      role: 'Frontend Developer',
      skills: ['React'],
      avatar: '👩‍💻'
    },
    {
      id: '2',
      name: 'David Lee',
      role: 'ML Engineer',
      skills: ['Python'],
      avatar: '👨‍💻'
    },
    {
      id: '3',
      name: 'Sarah Kim',
      role: 'UI/UX Designer',
      skills: ['Figma'],
      avatar: '👩‍🎨'
    }
  ]);


  useEffect(() => {
    getUser();
    fetchFriendRequests();
    fetchFriendCount();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else {
          setUserProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error getting user:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchFriendRequests = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('status', 'pending');
        
      if (error) {
        console.error('Error fetching friend requests:', error);
      } else {
        // Transform the data to match our FriendRequest interface
        const requests = data.map(request => ({
          id: request.id,
          username: request.sender_username || '',
          fullName: request.sender_name || '',
          bio: request.sender_bio || '',
          skills: request.sender_skills || [],
          avatar: '👤' // Default avatar
        }));
        setFriendRequests(requests);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const fetchFriendCount = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching friends count:', error);
      } else {
        setFriendCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching friends count:', error);
    }
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    // In real app, this would update the database
    console.log('Accepted friend request:', requestId);
    // Remove from list or mark as accepted
    setFriendRequests(prev => prev.filter(request => request.id !== requestId));
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    // In real app, this would update the database
    console.log('Declined friend request:', requestId);
    // Remove from list
    setFriendRequests(prev => prev.filter(request => request.id !== requestId));
  };

  const handleConnect = (personId: string) => {
    // In real app, this would send a connection request
    console.log('Connecting with:', personId);
  };

  const handleRegisterHackathon = (hackathonId: string) => {
    // In real app, this would navigate to registration
    console.log('Registering for hackathon:', hackathonId);
  };

  const handleLike = (postId: string) => {
    // In real app, this would update the database
    console.log('Liked post:', postId);
  };

  const handleComment = (postId: string) => {
    // In real app, this would open comment modal
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    // In real app, this would open share modal
    console.log('Share post:', postId);
  };



  const handleProfilePress = () => {
    router.push('/profile');
  };

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <Text style={styles.teamIcon}>{item.avatar}</Text>
        <View style={styles.invitationInfo}>
          <Text style={styles.teamName}>{item.fullName}</Text>
          <Text style={styles.invitedBy}>@{item.username}</Text>
        </View>
      </View>
      <Text style={styles.invitationDescription}>{item.bio}</Text>
      <View style={styles.skillsContainer}>
        {item.skills.map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillTagText}>{skill}</Text>
          </View>
        ))}
      </View>
      <View style={styles.invitationActions}>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleDeclineFriendRequest(item.id)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptFriendRequest(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHackathon = ({ item }: { item: Hackathon }) => (
    <View style={styles.hackathonCard}>
      <View style={styles.hackathonBanner}>
        <Text style={styles.bannerIcon}>{item.banner}</Text>
      </View>
      <View style={styles.hackathonContent}>
        <Text style={styles.hackathonName}>{item.name}</Text>
        <View style={styles.hackathonDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="event" size={16} color="#4A5568" />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={16} color="#4A5568" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          {item.registered && item.teamName && (
            <View style={styles.detailRow}>
              <AntDesign name="team" size={16} color="#4A5568" />
              <Text style={styles.detailText}>Team: {item.teamName}</Text>
            </View>
          )}
        </View>
        {!item.registered ? (
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => handleJoinHackathon(item.id)}
          >
            <Text style={styles.registerButtonText}>Register</Text>
            <AntDesign name="arrowright" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => console.log('View hackathon details:', item.id)}
          >
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
            <AntDesign name="arrowright" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPerson = ({ item }: { item: Person }) => (
    <View style={styles.personCard}>
      <Text style={styles.personAvatar}>{item.avatar}</Text>
      <Text style={styles.personName}>{item.name}</Text>
      <Text style={styles.personRole}>{item.role}</Text>
      <View style={styles.personSkills}>
        {item.skills.map((skill, index) => (
          <View key={index} style={styles.personSkillTag}>
            <AntDesign name="user" size={12} color="#007AFF" />
            <Text style={styles.personSkillText}>{skill}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity 
        style={styles.connectButton}
        onPress={() => handleConnect(item.id)}
      >
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActivityPost = ({ item }: { item: ActivityPost }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityAvatar}>{item.avatar}</Text>
        <View style={styles.activityInfo}>
          <Text style={styles.activityAuthor}>{item.author}</Text>
          <Text style={styles.activityTimestamp}>{item.timestamp}</Text>
        </View>
      </View>
      <Text style={styles.activityContent}>{item.content}</Text>
      <View style={styles.activityActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <AntDesign name="hearto" size={16} color="#4A5568" />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleComment(item.id)}
        >
          <AntDesign name="message1" size={16} color="#4A5568" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(item.id)}
        >
          <AntDesign name="sharealt" size={16} color="#4A5568" />
          <Text style={styles.actionText}>{item.shares}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    // In a real app, this would update the app's theme
  };

  const handleCreateHackathon = async () => {
    setShowHackathonOptions(false);
    
    // In a real app, this would navigate to a form first
    // For now, we'll create a sample hackathon directly
    if (!user) return;
    
    try {
      const newHackathon = {
        name: 'New Hackathon ' + Math.floor(Math.random() * 1000),
        date: 'Dec 15-17, 2024',
        location: 'Virtual',
        banner: '🚀',
        created_by: user.id,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('hackathons')
        .insert(newHackathon)
        .select();
        
      if (error) {
        console.error('Error creating hackathon:', error);
      } else {
        console.log('Hackathon created successfully:', data);
        // Refresh the hackathons list
        fetchUpcomingHackathons();
      }
    } catch (error) {
      console.error('Error creating hackathon:', error);
    }
  };

  const handleJoinHackathon = async (hackathonId = null) => {
    setShowHackathonOptions(false);
    
    if (!user) return;
    if (!hackathonId) {
      console.log('Navigate to Join Hackathon form');
      return;
    }
    
    try {
      const registration = {
        user_id: user.id,
        hackathon_id: hackathonId,
        team_name: 'Solo Team',
        registered_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('hackathon_registrations')
        .insert(registration)
        .select();
        
      if (error) {
        console.error('Error registering for hackathon:', error);
      } else {
        console.log('Registered for hackathon successfully:', data);
        // Refresh the hackathons lists
        fetchRegisteredHackathons();
        fetchUpcomingHackathons();
      }
    } catch (error) {
      console.error('Error registering for hackathon:', error);
    }
  };
  
  const fetchRegisteredHackathons = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('hackathon_registrations')
        .select(`
          *,
          hackathons:hackathon_id (*)
        `)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching registered hackathons:', error);
      } else {
        const hackathons = data.map(reg => ({
          id: reg.hackathons.id,
          name: reg.hackathons.name,
          date: reg.hackathons.date,
          location: reg.hackathons.location,
          banner: reg.hackathons.banner || '🏆',
          registered: true,
          teamName: reg.team_name
        }));
        setRegisteredHackathons(hackathons);
      }
    } catch (error) {
      console.error('Error fetching registered hackathons:', error);
    }
  };
  
  const fetchUpcomingHackathons = async () => {
    try {
      const { data, error } = await supabase
        .from('hackathons')
        .select('*')
        .order('date', { ascending: true })
        .limit(5);
        
      if (error) {
        console.error('Error fetching upcoming hackathons:', error);
      } else {
        // Check which ones the user is registered for
        if (user) {
          const { data: registrations, error: regError } = await supabase
            .from('hackathon_registrations')
            .select('hackathon_id, team_name')
            .eq('user_id', user.id);
            
          if (!regError && registrations) {
            const registeredIds = registrations.reduce((acc, reg) => {
              acc[reg.hackathon_id] = reg.team_name;
              return acc;
            }, {});
            
            const hackathons = data.map(h => ({
              id: h.id,
              name: h.name,
              date: h.date,
              location: h.location,
              banner: h.banner || '🏆',
              registered: registeredIds[h.id] ? true : false,
              teamName: registeredIds[h.id] || undefined
            }));
            
            setUpcomingHackathons(hackathons);
          }
        } else {
          const hackathons = data.map(h => ({
            id: h.id,
            name: h.name,
            date: h.date,
            location: h.location,
            banner: h.banner || '🏆',
            registered: false
          }));
          
          setUpcomingHackathons(hackathons);
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming hackathons:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkModeSafeArea]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkModeHeader]}>
        <View style={styles.headerTop}>
          <Text style={[styles.welcomeText, isDarkMode && styles.darkModeText]}>
            Welcome back, {userProfile?.username || user?.email?.split('@')[0] || 'Hacker'}! 👋
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.darkModeToggle} onPress={toggleDarkMode}>
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color={isDarkMode ? "#FFFFFF" : "#1A202C"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
              <Text style={styles.profileButtonText}>
                {userProfile?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Hackathon Options Modal */}
      {showHackathonOptions && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode && styles.darkModeModal]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkModeText]}>Hackathon Options</Text>
              <TouchableOpacity onPress={() => setShowHackathonOptions(false)}>
                <AntDesign name="close" size={24} color={isDarkMode ? "#FFFFFF" : "#1A202C"} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.modalOption, isDarkMode && styles.darkModeModalOption]} 
              onPress={handleCreateHackathon}
            >
              <AntDesign name="plus" size={24} color={isDarkMode ? "#FFFFFF" : "#1A202C"} />
              <Text style={[styles.modalOptionText, isDarkMode && styles.darkModeText]}>Create a Hackathon</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalOption, isDarkMode && styles.darkModeModalOption]} 
              onPress={handleJoinHackathon}
            >
              <AntDesign name="team" size={24} color={isDarkMode ? "#FFFFFF" : "#1A202C"} />
              <Text style={[styles.modalOptionText, isDarkMode && styles.darkModeText]}>Join a Hackathon as Team</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
   
        {/* Friend Requests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          {friendRequests.length > 0 ? (
            <FlatList
              data={friendRequests}
              renderItem={renderFriendRequest}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>Requests empty</Text>
            </View>
          )}
        </View>

        {/* Registered Hackathons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Registered Hackathons</Text>
          {registeredHackathons.length > 0 ? (
            <FlatList
              data={registeredHackathons}
              renderItem={renderHackathon}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No registered hackathons</Text>
            </View>
          )}
        </View>
        
        {/* Upcoming Hackathons Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Hackathons</Text>
          <FlatList
            data={upcomingHackathons}
            renderItem={renderHackathon}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>



        {/* Activity Feed */}
        
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' ? styles.navItemActive : null]}
          onPress={() => setActiveTab('home')}
        >
          <AntDesign name="home" size={24} color={activeTab === 'home' ? '#007AFF' : '#4A5568'} />
          <Text style={[styles.navLabel, activeTab === 'home' ? styles.navLabelActive : null]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'search' ? styles.navItemActive : null]}
          onPress={() => {
            setActiveTab('search');
            router.push('/search');
          }}
        >
          <AntDesign name="search1" size={24} color={activeTab === 'search' ? '#007AFF' : '#4A5568'} />
          <Text style={[styles.navLabel, activeTab === 'search' ? styles.navLabelActive : null]}>Explore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'friends' ? styles.navItemActive : null]}
          onPress={() => {
            setActiveTab('friends');
            // In real app, this would navigate to friends screen
            console.log('Navigate to Friends');
          }}
        >
          <AntDesign name="user" size={24} color={activeTab === 'friends' ? '#007AFF' : '#4A5568'} />
          <Text style={[styles.navLabel, activeTab === 'friends' ? styles.navLabelActive : null]}>Friends {friendCount > 0 ? `(${friendCount})` : ''}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'hackathons' ? styles.navItemActive : null]}
          onPress={() => {
            setActiveTab('hackathons');
            // Show hackathon options modal
            setShowHackathonOptions(true);
          }}
        >
          <AntDesign name="Trophy" size={24} color={activeTab === 'hackathons' ? '#007AFF' : '#4A5568'} />
          <Text style={[styles.navLabel, activeTab === 'hackathons' ? styles.navLabelActive : null]}>Hackathons</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' ? styles.navItemActive : null]}
          onPress={() => {
            setActiveTab('profile');
            router.push('/profile');
          }}
        >
          <AntDesign name="user" size={24} color={activeTab === 'profile' ? '#007AFF' : '#4A5568'} />
          <Text style={[styles.navLabel, activeTab === 'profile' ? styles.navLabelActive : null]}>Profile</Text>
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
  darkModeSafeArea: {
    backgroundColor: '#1A202C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#4A5568',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 0,
  },
  welcomeText: {
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
    marginRight: 0,
  },
  profileButtonText: {
    fontSize: 18,
    color: '#4A5568',
  },

  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  darkModeScrollView: {
    backgroundColor: '#1A202C',
  },
  darkModeHeader: {
    backgroundColor: '#2D3748',
    borderBottomColor: '#4A5568',
  },
  darkModeText: {
    color: '#FFFFFF',
  },
  darkModeCard: {
    backgroundColor: '#2D3748',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkModeToggle: {
    marginRight: 16,
    padding: 4,
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF8FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkModeModal: {
    backgroundColor: '#2D3748',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  darkModeModalOption: {
    borderBottomColor: '#4A5568',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#1A202C',
  },
     countdownSection: {
     marginBottom: 20,
     paddingHorizontal: 24,
   },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 15,
    paddingHorizontal: 24,
  },
  countdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 10,
  },
  countdownTimer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  timeLabel: {
    fontSize: 14,
    color: '#4A5568',
  },
  viewDetailsButton: {
    backgroundColor: '#4299E1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  horizontalList: {
    paddingHorizontal: 24,
  },
  invitationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 15,
    width: width * 0.8, // Adjust width for horizontal scroll
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  invitationInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  invitedBy: {
    fontSize: 14,
    color: '#718096',
  },
  invitationDescription: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  skillTag: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  skillTagText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  declineButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#4299E1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hackathonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 15,
    width: width * 0.8, // Adjust width for horizontal scroll
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hackathonBanner: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  bannerIcon: {
    fontSize: 80,
  },
  hackathonContent: {
    padding: 20,
  },
  hackathonName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 10,
  },
  hackathonDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 5,
  },
  registerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4299E1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 15,
    width: width * 0.8, // Adjust width for horizontal scroll
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  personAvatar: {
    fontSize: 40,
    marginBottom: 10,
  },
  personName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 5,
  },
  personRole: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 10,
  },
  personSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  personSkillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  personSkillText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
    marginLeft: 5,
  },
  connectButton: {
    backgroundColor: '#4299E1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityAvatar: {
    fontSize: 30,
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
  },
  activityAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  activityTimestamp: {
    fontSize: 12,
    color: '#718096',
  },
  activityContent: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 10,
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 5,
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
  },
  navLabelActive: {
    fontWeight: '600',
  },
});