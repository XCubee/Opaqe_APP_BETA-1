import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Image,
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

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  githubUrl?: string;
  devpostUrl?: string;
}

interface Endorsement {
  id: string;
  author: string;
  role: string;
  text: string;
  avatar: string;
}

interface HackathonHistory {
  id: string;
  name: string;
  date: string;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Mock data for demonstration
  const [projects] = useState<Project[]>([
    {
      id: '1',
      title: 'Opaqe - Team Collaboration App',
      description: 'A mobile application designed to connect hackathon participants, facilitate team formation, and provide a comprehensive workspace.',
      image: 'https://via.placeholder.com/300x200/87CEEB/FFFFFF?text=Opaqe',
      githubUrl: 'https://github.com/opaque-app',
      devpostUrl: 'https://devpost.com/software/opaque'
    },
    {
      id: '2',
      title: 'EcoTracker - Carbon Footprint Monitor',
      description: 'Developed a web platform for individuals to monitor and reduce their carbon footprint, offering personalized recommendations.',
      image: 'https://via.placeholder.com/300x200/98FB98/FFFFFF?text=EcoTracker',
      githubUrl: 'https://github.com/ecotracker',
      devpostUrl: 'https://devpost.com/software/ecotracker'
    }
  ]);

  const [endorsements] = useState<Endorsement[]>([
    {
      id: '1',
      author: 'Maria Garcia',
      role: 'Team Lead, Future AI Challenge',
      text: 'Alex is an exceptional backend developer. Their work on NeuralNomads was critical to our success, demonstrating deep technical knowledge and problem-solving skills.',
      avatar: '👩‍💻'
    },
    {
      id: '2',
      author: 'David Lee',
      role: 'Peer, Sustainable City Hack',
      text: 'Working with Alex was a pleasure. Their UI/UX designs are always intuitive and visually appealing, making a huge difference in our project\'s user experience.',
      avatar: '👨‍💻'
    }
  ]);

  const [hackathonHistory] = useState<HackathonHistory[]>([
    {
      id: '1',
      name: 'Future AI Challenge 2023',
      date: 'Oct 2023'
    },
    {
      id: '2',
      name: 'Sustainable City Hack 2022',
      date: 'May 2022'
    },
    {
      id: '3',
      name: 'HealthTech Innovators 2021',
      date: 'Nov 2021'
    }
  ]);

  useEffect(() => {
    getUser();
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

  const handleConnect = () => {
    // In real app, this would send a connection request
    console.log('Connect request sent');
  };

  const handleMessage = () => {
    // In real app, this would open messaging
    console.log('Open messaging');
  };

  const handleEditProfile = () => {
    router.push('/onboarding');
  };

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              <Text style={styles.profileInitial}>
                {userProfile?.username?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.profileName}>
            {userProfile?.username || 'Alex Johnson'}
          </Text>
          
          <Text style={styles.profileTagline}>
            {userProfile?.tagline || 'Full-stack Developer | AI/ML Enthusiast | Hackathon Winner'}
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {userProfile?.skills?.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            )) || [
              'React', 'Node.js', 'Python', 'TensorFlow', 'UI/UX Design', 'Cloud Computing', 'Project Management'
            ].map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hackathon History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hackathon History</Text>
          {hackathonHistory.map((hackathon, index) => (
            <View key={hackathon.id} style={styles.hackathonItem}>
              <View style={styles.hackathonInfo}>
                <Text style={styles.hackathonName}>{hackathon.name}</Text>
                <Text style={styles.hackathonDate}>{hackathon.date}</Text>
              </View>
              <TouchableOpacity style={styles.expandButton}>
                <AntDesign name="down" size={16} color="#4A5568" />
              </TouchableOpacity>
              {index < hackathonHistory.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

        {/* Projects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {projects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              <Image 
                source={{ uri: project.image }} 
                style={styles.projectImage}
                resizeMode="cover"
              />
              <View style={styles.projectContent}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectDescription}>{project.description}</Text>
                <View style={styles.projectButtons}>
                  {project.githubUrl && (
                    <TouchableOpacity style={styles.projectButton}>
                      <AntDesign name="github" size={16} color="#333" />
                      <Text style={styles.projectButtonText}>GitHub</Text>
                    </TouchableOpacity>
                  )}
                  {project.devpostUrl && (
                    <TouchableOpacity style={styles.projectButton}>
                      <Feather name="link" size={16} color="#333" />
                      <Text style={styles.projectButtonText}>Devpost</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Endorsements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endorsements</Text>
          {endorsements.map((endorsement) => (
            <View key={endorsement.id} style={styles.endorsementCard}>
              <View style={styles.endorsementHeader}>
                <View style={styles.endorsementAvatar}>
                  <Text style={styles.endorsementAvatarText}>{endorsement.avatar}</Text>
                </View>
                <View style={styles.endorsementInfo}>
                  <Text style={styles.endorsementAuthor}>{endorsement.author}</Text>
                  <Text style={styles.endorsementRole}>{endorsement.role}</Text>
                </View>
              </View>
              <Text style={styles.endorsementText}>"{endorsement.text}"</Text>
            </View>
          ))}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
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
          style={styles.navItem}
          onPress={() => router.push('/search')}
        >
          <AntDesign name="search1" size={24} color="#4A5568" />
          <Text style={styles.navLabel}>Explore</Text>
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
          style={[styles.navItem, styles.navItemActive]}
        >
          <AntDesign name="user" size={24} color="#007AFF" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profilePictureContainer: {
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 10,
    textAlign: 'center',
  },
  profileTagline: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4A5568',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 15,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillTag: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  skillTagText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  hackathonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  hackathonInfo: {
    flex: 1,
  },
  hackathonName: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
  },
  hackathonDate: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  expandButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 12,
  },
  projectCard: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  projectImage: {
    width: '100%',
    height: 200,
  },
  projectContent: {
    padding: 20,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 10,
  },
  projectDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 15,
  },
  projectButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  projectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  projectButtonText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  endorsementCard: {
    marginBottom: 20,
  },
  endorsementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  endorsementAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  endorsementAvatarText: {
    fontSize: 20,
  },
  endorsementInfo: {
    flex: 1,
  },
  endorsementAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  endorsementRole: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  endorsementText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  editProfileButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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