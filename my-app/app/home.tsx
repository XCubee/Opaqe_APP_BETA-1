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

interface TeamInvitation {
  id: string;
  teamName: string;
  invitedBy: string;
  description: string;
  requiredSkills: string[];
  teamIcon: string;
}

interface Hackathon {
  id: string;
  name: string;
  date: string;
  location: string;
  banner: string;
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
  const [countdown, setCountdown] = useState({
    days: 7,
    hours: 14,
    minutes: 32,
    seconds: 51
  });

  // Mock data for demonstration - in real app, this would come from Supabase
  const [teamInvitations] = useState<TeamInvitation[]>([
    {
      id: '1',
      teamName: 'CodeCrafters Assemble',
      invitedBy: 'Alex Johnson',
      description: "Hey! We're looking for a skilled backend developer to join our team for the upcoming FinTech Innovations hackathon.",
      requiredSkills: ['Backend', 'Node.js', 'MongoDB', 'APIs'],
      teamIcon: '👨‍💻'
    },
    {
      id: '2',
      teamName: 'Pixel Pioneers',
      invitedBy: 'Maria Garcia',
      description: 'Our UI/UX team needs a visionary designer for the Sustainable Tech Challenge. Are you interested?',
      requiredSkills: ['UI/UX', 'Figma', 'Prototyping', 'User Research'],
      teamIcon: '🎨'
    }
  ]);

  const [upcomingHackathons] = useState<Hackathon[]>([
    {
      id: '1',
      name: 'Global AI Innovators Summit',
      date: 'Nov 15-17, 2024',
      location: 'Virtual & New York',
      banner: '🌍'
    },
    {
      id: '2',
      name: 'Future of Healthcare Hackathon',
      date: 'Dec 2-4, 2024',
      location: 'London, UK',
      banner: '🏥'
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

  const handleAcceptInvitation = (invitationId: string) => {
    // In real app, this would update the database
    console.log('Accepted invitation:', invitationId);
    // Remove from list or mark as accepted
  };

  const handleDeclineInvitation = (invitationId: string) => {
    // In real app, this would update the database
    console.log('Declined invitation:', invitationId);
    // Remove from list or mark as declined
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

  const renderTeamInvitation = ({ item }: { item: TeamInvitation }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <Text style={styles.teamIcon}>{item.teamIcon}</Text>
        <View style={styles.invitationInfo}>
          <Text style={styles.teamName}>{item.teamName}</Text>
          <Text style={styles.invitedBy}>Invited by {item.invitedBy}</Text>
        </View>
      </View>
      <Text style={styles.invitationDescription}>{item.description}</Text>
      <View style={styles.skillsContainer}>
        {item.requiredSkills.map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillTagText}>{skill}</Text>
          </View>
        ))}
      </View>
      <View style={styles.invitationActions}>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleDeclineInvitation(item.id)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptInvitation(item.id)}
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
        </View>
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => handleRegisterHackathon(item.id)}
        >
          <Text style={styles.registerButtonText}>Register</Text>
          <AntDesign name="arrowright" size={16} color="#FFFFFF" />
        </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.welcomeText}>
            Welcome back, {userProfile?.username || user?.email?.split('@')[0] || 'Hacker'}! 👋
          </Text>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Text style={styles.profileButtonText}>
              {userProfile?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
   

        {/* Team Invitations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Invitations</Text>
          <FlatList
            data={teamInvitations}
            renderItem={renderTeamInvitation}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Upcoming Hackathons */}
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

        {/* People Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People You May Want to Work With</Text>
          <FlatList
            data={people}
            renderItem={renderPerson}
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
          style={[styles.navItem, activeTab === 'teams' ? styles.navItemActive : null]}
          onPress={() => {
            setActiveTab('teams');
            // In real app, this would navigate to teams screen
            console.log('Navigate to Teams');
          }}
        >
          <AntDesign name="team" size={24} color={activeTab === 'teams' ? '#007AFF' : '#4A5568'} />
          <Text style={[styles.navLabel, activeTab === 'teams' ? styles.navLabelActive : null]}>Teams</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'hackathons' ? styles.navItemActive : null]}
          onPress={() => {
            setActiveTab('hackathons');
            // In real app, this would navigate to hackathons screen
            console.log('Navigate to Hackathons');
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