import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
// Import new dependencies
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer';

// ----- INTERFACES (Hackathon updated) -----
interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  tagline?: string | null;
  availability?: string | null;
  profile_picture?: string | null;
  created_at?: string | null;
}

interface Skill { id: string; user_id: string; skill: string }

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image?: string | null;
  github_url?: string | null;
  devpost_url?: string | null;
}

interface Endorsement {
  id: string;
  user_id: string;
  author: string;
  role: string;
  text: string;
  avatar?: string | null;
}

interface Hackathon {
  id: string;
  user_id: string;
  name: string;
  date: string;
  image?: string | null; // <-- ADDED image property
}

// ----- HOOKS & HELPERS -----
function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay = 700) {
  const timer = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ----- UI COMPONENTS -----
const Chip = ({ label, onRemove }: { label: string; onRemove?: () => void }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
    {onRemove ? (
      <TouchableOpacity style={styles.chipRemove} onPress={onRemove}>
        <AntDesign name="close" size={12} color="#4A5568" />
      </TouchableOpacity>
    ) : null}
  </View>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const InlineTextInput = ({
  value,
  placeholder,
  onChangeText,
  multiline = false,
  style,
}: {
  value?: string | null;
  placeholder?: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
  style?: any;
}) => {
  const [text, setText] = useState(value || '');
  useEffect(() => setText(value || ''), [value]);
  return (
    <TextInput
      value={text}
      onChangeText={(t) => {
        setText(t);
        onChangeText(t);
      }}
      placeholder={placeholder}
      placeholderTextColor="#9AA1A9"
      multiline={multiline}
      style={[styles.input, multiline && styles.inputMultiline, style]}
    />
  );
};

// ----- MAIN PROFILE COMPONENT -----
export default function Profile() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState<string | null>(null); // To track which image is uploading

  // ------- Data Fetching Effect -------
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setAuthUser(user);
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: existing } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
        if (!existing) {
          await supabase.from('users').insert({ id: user.id, email: user.email, username: user.user_metadata?.user_name || user.email?.split('@')[0] });
        }

        const [p, s, pr, e, h] = await Promise.all([
          supabase.from('users').select('*').eq('id', user.id).single(),
          supabase.from('user_skills').select('*').eq('user_id', user.id).order('skill'),
          supabase.from('user_projects').select('*').eq('user_id', user.id).order('id', { ascending: false }),
          supabase.from('user_endorsements').select('*').eq('user_id', user.id).order('id', { ascending: false }),
          supabase.from('user_hackathons').select('*').eq('user_id', user.id).order('id', { ascending: false }),
        ]);

        if (p.data) setProfile(p.data as any);
        if (s.data) setSkills(s.data as any);
        if (pr.data) setProjects(pr.data as any);
        if (e.data) setEndorsements(e.data as any);
        if (h.data) setHackathons(h.data as any);
      } catch (err) {
        console.error('Load error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ------- Image Picking & Uploading Logic -------
  const pickAndUploadImage = async (bucket: string, itemId: string) => {
    setImageUploading(itemId);
    try {
      // 1. Request permissions and pick image
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: bucket === 'profile_images' ? [1, 1] : [16, 9], // Square for profile, wide for others
        quality: 0.6,
        base64: true, // Needed for Supabase upload
      });

      if (result.canceled || !result.assets?.[0]?.base64) {
        return null;
      }

      // 2. Upload to Supabase
      const asset = result.assets[0];
      const fileExt = asset.uri?.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${authUser.id}/${itemId}-${Date.now()}.${fileExt}`;
      const contentType = asset.mimeType ?? `image/${fileExt}`;
      const base64 = asset.base64;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, Buffer.from(base64, 'base64'), { contentType, upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrl;
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
      return null;
    } finally {
      setImageUploading(null);
    }
  };

  const changeProfilePicture = async () => {
    const publicUrl = await pickAndUploadImage('profile_images', 'profile-pic');
    if (publicUrl && authUser) {
      const { error } = await supabase.from('users').update({ profile_picture: publicUrl }).eq('id', authUser.id);
      if (error) return Alert.alert('Error', error.message);
      setProfile(p => p ? { ...p, profile_picture: publicUrl } : null);
    }
  };

  const changeProjectImage = async (projectId: string) => {
    const publicUrl = await pickAndUploadImage('profile_images', projectId); // Using profile_images as requested
    if (publicUrl) {
      const { error } = await supabase.from('user_projects').update({ image: publicUrl }).eq('id', projectId);
      if (error) return Alert.alert('Error', error.message);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, image: publicUrl } : p));
    }
  };

  const changeHackathonImage = async (hackathonId: string) => {
    const publicUrl = await pickAndUploadImage('hackathon_images', hackathonId);
    if (publicUrl) {
      const { error } = await supabase.from('user_hackathons').update({ image: publicUrl }).eq('id', hackathonId);
      if (error) return Alert.alert('Error', error.message);
      setHackathons(prev => prev.map(h => h.id === hackathonId ? { ...h, image: publicUrl } : h));
    }
  };


  // ------- Profile Autosave -------
  const debouncedUpdateProfile = useDebouncedCallback(async (patch: Partial<UserProfile>) => {
    if (!authUser) return;
    setSaving(true);
    const { error } = await supabase.from('users').update(patch).eq('id', authUser.id);
    if (error) Alert.alert('Save failed', error.message);
    setSaving(false);
  }, 700);

  const onChangeUsername = (username: string) => {
    setProfile((p) => (p ? { ...p, username } : p));
    debouncedUpdateProfile({ username });
  };
  const onChangeTagline = (tagline: string) => {
    setProfile((p) => (p ? { ...p, tagline } : p));
    debouncedUpdateProfile({ tagline });
  };

  // ------- Skills CRUD -------
  const [skillInput, setSkillInput] = useState('');
  const addSkill = async () => {
    const s = skillInput.trim();
    if (!s || !authUser) return;
    const { data, error } = await supabase.from('user_skills').insert({ user_id: authUser.id, skill: s }).select().single();
    if (error) return Alert.alert('Error', error.message);
    setSkills((prev) => [...prev, data as Skill]);
    setSkillInput('');
  };
  const removeSkill = async (id: string) => {
    const prev = skills;
    setSkills((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from('user_skills').delete().eq('id', id);
    if (error) { Alert.alert('Error', error.message); setSkills(prev); }
  };

  // ------- Projects CRUD -------
  const addProject = async () => {
    if (!authUser) return;
    const { data, error } = await supabase.from('user_projects').insert({ user_id: authUser.id, title: 'New Project', description: 'Describe your project...' }).select().single();
    if (error) return Alert.alert('Error', error.message);
    setProjects((prev) => [data as Project, ...prev]);
  };
  const updateProject = useDebouncedCallback(async (id: string, patch: Partial<Project>) => {
    const { error } = await supabase.from('user_projects').update(patch).eq('id', id);
    if (error) Alert.alert('Save failed', error.message);
  }, 600);
  const removeProject = async (id: string) => {
    const prev = projects;
    setProjects((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from('user_projects').delete().eq('id', id);
    if (error) { Alert.alert('Error', error.message); setProjects(prev); }
  };

  // ------- Hackathons CRUD -------
  const addHackathon = async () => {
    if (!authUser) return;
    const { data, error } = await supabase.from('user_hackathons').insert({ user_id: authUser.id, name: 'New Hackathon', date: 'Month YYYY' }).select().single();
    if (error) return Alert.alert('Error', error.message);
    setHackathons((prev) => [data as Hackathon, ...prev]);
  };
  const updateHackathon = useDebouncedCallback(async (id: string, patch: Partial<Hackathon>) => {
    const { error } = await supabase.from('user_hackathons').update(patch).eq('id', id);
    if (error) Alert.alert('Save failed', error.message);
  }, 600);
  const removeHackathon = async (id: string) => {
    const prev = hackathons;
    setHackathons((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from('user_hackathons').delete().eq('id', id);
    if (error) { Alert.alert('Error', error.message); setHackathons(prev); }
  };

  // ------- Endorsements CRUD -------
  const addEndorsement = async () => {
    if (!authUser) return;
    const { data, error } = await supabase.from('user_endorsements').insert({ user_id: authUser.id, author: 'Name', role: 'Role / relation', text: '"Great collaborator..."', avatar: '🧑‍💻' }).select().single();
    if (error) return Alert.alert('Error', error.message);
    setEndorsements((prev) => [data as Endorsement, ...prev]);
  };
  const updateEndorsement = useDebouncedCallback(async (id: string, patch: Partial<Endorsement>) => {
    const { error } = await supabase.from('user_endorsements').update(patch).eq('id', id);
    if (error) Alert.alert('Save failed', error.message);
  }, 600);
  const removeEndorsement = async (id: string) => {
    const prev = endorsements;
    setEndorsements((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase.from('user_endorsements').delete().eq('id', id);
    if (error) { Alert.alert('Error', error.message); setEndorsements(prev); }
  };

  // ----- RENDER LOGIC -----
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ color: '#4A5568', marginTop: 8 }}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={changeProfilePicture} style={styles.profilePictureContainer}>
            {profile?.profile_picture ? (
              <Image source={{ uri: profile.profile_picture }} style={styles.profilePictureImg} />
            ) : (
              <View style={styles.profilePicture}>
                <Text style={styles.profileInitial}>{(profile?.username || profile?.email || 'A').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {imageUploading === 'profile-pic' ? <ActivityIndicator color="#fff" /> : <Feather name="camera" size={18} color="#fff" />}
            </View>
          </TouchableOpacity>

          <InlineTextInput value={profile?.username || ''} placeholder="Your name" onChangeText={onChangeUsername} style={styles.nameInput} />
          <InlineTextInput value={profile?.tagline || ''} placeholder="Add a headline..." onChangeText={onChangeTagline} style={styles.taglineInput} multiline />

          {saving && <Text style={{ color: '#718096', fontSize: 12, marginTop: 10 }}>Saving…</Text>}
        </View>

        {/* Skills */}
        <Section title="Skills">
          <View style={styles.skillInputRow}>
            <TextInput placeholder="Add a skill" placeholderTextColor="#9AA1A9" value={skillInput} onChangeText={setSkillInput} onSubmitEditing={addSkill} style={[styles.input, { flex: 1 }]} returnKeyType="done" />
            <TouchableOpacity style={styles.addBtn} onPress={addSkill}><AntDesign name="plus" size={18} color="#fff" /></TouchableOpacity>
          </View>
          <View style={styles.chipsWrap}>
            {skills.length === 0 ? <Text style={{ color: '#718096' }}>No skills yet. Add your first skill.</Text> : skills.map((s) => <Chip key={s.id} label={s.skill} onRemove={() => removeSkill(s.id)} />)}
          </View>
        </Section>

        {/* Hackathon History */}
        <Section title="Hackathon History">
          <TouchableOpacity style={styles.smallAdd} onPress={addHackathon}>
            <AntDesign name="pluscircleo" size={16} color="#4A5568" />
            <Text style={styles.smallAddText}>Add Hackathon</Text>
          </TouchableOpacity>
          {hackathons.length === 0 ? <Text style={{ color: '#718096' }}>No hackathons added.</Text> : hackathons.map((h) => (
            <View key={h.id} style={styles.hackathonCard}>
              <TouchableOpacity onPress={() => changeHackathonImage(h.id)}>
                {h.image ? <Image source={{ uri: h.image }} style={styles.hackathonImage} /> : <View style={styles.hackathonImagePlaceholder}><Ionicons name="image" size={24} color="#A0AEC0" /></View>}
                {imageUploading === h.id && <View style={styles.imageUploadingOverlay}><ActivityIndicator /></View>}
              </TouchableOpacity>
              <View style={styles.hackathonContent}>
                <InlineTextInput value={h.name} onChangeText={(name) => { setHackathons(prev => prev.map(x => x.id === h.id ? { ...x, name } : x)); updateHackathon(h.id, { name }); }} style={{ fontWeight: '600' }} />
                <InlineTextInput value={h.date} onChangeText={(date) => { setHackathons(prev => prev.map(x => x.id === h.id ? { ...x, date } : x)); updateHackathon(h.id, { date }); }} style={{ fontSize: 12, color: '#718096' }} />
              </View>
              <TouchableOpacity onPress={() => removeHackathon(h.id)} style={{ padding: 8, marginLeft: 'auto' }}><AntDesign name="delete" size={18} color="#A0AEC0" /></TouchableOpacity>
            </View>
          ))}
        </Section>

        {/* Projects */}
        <Section title="Projects">
          <TouchableOpacity style={styles.smallAdd} onPress={addProject}>
            <AntDesign name="pluscircleo" size={16} color="#4A5568" />
            <Text style={styles.smallAddText}>Add Project</Text>
          </TouchableOpacity>
          {projects.length === 0 ? <Text style={{ color: '#718096' }}>No projects yet.</Text> : projects.map((p) => (
            <View key={p.id} style={styles.projectCard}>
              <TouchableOpacity onPress={() => changeProjectImage(p.id)}>
                {p.image ? <Image source={{ uri: p.image }} style={styles.projectImage} resizeMode="cover" /> : <View style={[styles.projectImage, styles.projectImagePlaceholder]}><Ionicons name="image" size={28} color="#A0AEC0" /></View>}
                {imageUploading === p.id && <View style={styles.imageUploadingOverlay}><ActivityIndicator /></View>}
              </TouchableOpacity>
              <View style={styles.projectContent}>
                <InlineTextInput value={p.title} onChangeText={(title) => { setProjects(prev => prev.map(x => x.id === p.id ? { ...x, title } : x)); updateProject(p.id, { title }); }} style={styles.projectTitle} />
                <InlineTextInput value={p.description} onChangeText={(description) => { setProjects(prev => prev.map(x => x.id === p.id ? { ...x, description } : x)); updateProject(p.id, { description }); }} style={styles.projectDescription} multiline />
                <View style={styles.linksRow}>
                  <View style={{ flex: 1 }}>
                    <InlineTextInput value={p.github_url || ''} placeholder="GitHub URL" onChangeText={(github_url) => { setProjects(prev => prev.map(x => x.id === p.id ? { ...x, github_url } : x)); updateProject(p.id, { github_url }); }} />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <InlineTextInput value={p.devpost_url || ''} placeholder="Devpost URL" onChangeText={(devpost_url) => { setProjects(prev => prev.map(x => x.id === p.id ? { ...x, devpost_url } : x)); updateProject(p.id, { devpost_url }); }} />
                  </View>
                </View>
                <View style={styles.cardActions}><TouchableOpacity onPress={() => removeProject(p.id)} style={styles.deleteBtn}><AntDesign name="delete" size={16} color="#A0AEC0" /><Text style={styles.deleteText}>Remove</Text></TouchableOpacity></View>
              </View>
            </View>
          ))}
        </Section>

        {/* Endorsements */}
        <Section title="Endorsements">
          <TouchableOpacity style={styles.smallAdd} onPress={addEndorsement}>
            <AntDesign name="pluscircleo" size={16} color="#4A5568" />
            <Text style={styles.smallAddText}>Add Endorsement</Text>
          </TouchableOpacity>
          {endorsements.length === 0 ? <Text style={{ color: '#718096' }}>No endorsements yet.</Text> : endorsements.map((en) => (
            <View key={en.id} style={styles.endorseCard}>
              <View style={styles.endorseHeader}>
                <View style={styles.endorseAvatar}><Text style={{ fontSize: 18 }}>{en.avatar || '👤'}</Text></View>
                <View style={{ flex: 1 }}>
                  <InlineTextInput value={en.author} onChangeText={(author) => { setEndorsements(prev => prev.map(x => x.id === en.id ? { ...x, author } : x)); updateEndorsement(en.id, { author }); }} />
                  <InlineTextInput value={en.role} onChangeText={(role) => { setEndorsements(prev => prev.map(x => x.id === en.id ? { ...x, role } : x)); updateEndorsement(en.id, { role }); }} />
                </View>
                <TouchableOpacity onPress={() => removeEndorsement(en.id)} style={{ padding: 8 }}><AntDesign name="delete" size={18} color="#A0AEC0" /></TouchableOpacity>
              </View>
              <InlineTextInput value={en.text} onChangeText={(text) => { setEndorsements(prev => prev.map(x => x.id === en.id ? { ...x, text } : x)); updateEndorsement(en.id, { text }); }} multiline />
            </View>
          ))}
        </Section>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}><AntDesign name="home" size={22} color="#4A5568" /><Text style={styles.navLabel}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/search')}><AntDesign name="search1" size={22} color="#4A5568" /><Text style={styles.navLabel}>Explore</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/teams')}><AntDesign name="team" size={22} color="#4A5568" /><Text style={styles.navLabel}>Teams</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/network')}><AntDesign name="user" size={22} color="#4A5568" /><Text style={styles.navLabel}>Network</Text></TouchableOpacity>
        <View style={styles.navItem}><AntDesign name="user" size={22} color="#007AFF" /><Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text></View>
      </View>
    </SafeAreaView>
  );
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  profileHeader: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  profilePictureContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 14 },
  profilePicture: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E6F2FF', alignItems: 'center', justifyContent: 'center' },
  profilePictureImg: { width: 100, height: 100, borderRadius: 50 },
  profileInitial: { fontSize: 40, fontWeight: '700', color: '#2B6CB0' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  nameInput: { fontSize: 24, fontWeight: '700', textAlign: 'center', borderWidth: 0, marginTop: 4 },
  taglineInput: { fontSize: 14, textAlign: 'center', color: '#4A5568', marginTop: 6, minHeight: 40 },

  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C', marginBottom: 12 },

  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, color: '#1A202C', backgroundColor: '#fff' },
  inputMultiline: { minHeight: 44, textAlignVertical: 'top' },

  skillInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addBtn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2F7', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  chipText: { color: '#4A5568', fontWeight: '500' },
  chipRemove: { marginLeft: 6 },
  smallAdd: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, alignSelf: 'flex-start' },
  smallAddText: { color: '#4A5568', fontWeight: '600' },

  // Hackathons (new styles)
  hackathonCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10 },
  hackathonImage: { width: 60, height: 60, borderRadius: 8 },
  hackathonImagePlaceholder: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  hackathonContent: { flex: 1 },

  // Projects
  projectCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  projectImage: { width: '100%', height: 180, backgroundColor: '#F1F5F9' },
  projectImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  projectContent: { padding: 14 },
  projectTitle: { fontSize: 16, fontWeight: '700' },
  projectDescription: { marginTop: 8 },
  linksRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8 },
  deleteText: { color: '#A0AEC0' },
  imageUploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8 },

  // Endorsements
  endorseCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, marginBottom: 12 },
  endorseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  endorseAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E6F2FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },

  // Bottom nav
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  navItem: { alignItems: 'center' },
  navLabel: { fontSize: 12, color: '#4A5568', marginTop: 2 },
  navLabelActive: { color: '#007AFF', fontWeight: '700' },
});