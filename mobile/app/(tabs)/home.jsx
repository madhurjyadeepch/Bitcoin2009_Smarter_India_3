import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
    { label: 'Pothole', icon: 'warning', bg: '#F2CC8F', fg: '#7A5F00' },
    { label: 'Garbage', icon: 'trash', bg: '#A8D5BA', fg: '#1B5E3B' },
    { label: 'Streetlight', icon: 'flash', bg: '#B8B5E0', fg: '#3D3680' },
    { label: 'Drainage', icon: 'water', bg: '#89CFF0', fg: '#1A5276' },
    { label: 'Vandalism', icon: 'alert-circle', bg: '#F4845F', fg: '#7A2D14' },
    { label: 'General', icon: 'flag', bg: '#E8D5C4', fg: '#6B4226' },
];

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.greet}>{greeting},</Text>
                        <Text style={s.userName}>{user?.name || 'Citizen'}</Text>
                    </View>
                    <TouchableOpacity style={s.avatarWrap} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
                        <View style={s.avatar}>
                            <Text style={s.avatarLetter}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Hero Card */}
                <TouchableOpacity style={s.heroCard} activeOpacity={0.9} onPress={() => router.push('/report-create')}>
                    <View style={s.heroLeft}>
                        <Text style={s.heroLabel}>Report an Issue</Text>
                        <Text style={s.heroDesc}>Spotted something wrong? Let us know and help fix your city.</Text>
                        <View style={s.heroBtnRow}>
                            <View style={s.heroBtn}>
                                <Text style={s.heroBtnText}>Start Report</Text>
                                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                            </View>
                        </View>
                    </View>
                    <View style={s.heroGraphic}>
                        <Ionicons name="megaphone" size={48} color="#4F46E5" />
                    </View>
                </TouchableOpacity>

                {/* Categories Grid */}
                <Text style={s.sectionTitle}>Quick Report</Text>
                <View style={s.catGrid}>
                    {CATEGORIES.map((cat, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[s.catCard, { backgroundColor: cat.bg }]}
                            activeOpacity={0.85}
                            onPress={() => router.push({ pathname: '/report-create', params: { preCategory: cat.label } })}
                        >
                            <Ionicons name={cat.icon} size={28} color={cat.fg} />
                            <Text style={[s.catLabel, { color: cat.fg }]}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Access */}
                <Text style={s.sectionTitle}>Quick Access</Text>
                <View style={s.quickRow}>
                    {[
                        { label: 'My Reports', icon: 'document-text', route: '/(tabs)/my-reports', bg: '#FFF5EB' },
                        { label: 'Community', icon: 'people', route: '/(tabs)/community', bg: '#EBF5FF' },
                        { label: 'Profile', icon: 'person', route: '/(tabs)/profile', bg: '#F0EBFF' },
                    ].map((item, i) => (
                        <TouchableOpacity key={i} style={[s.quickCard, { backgroundColor: item.bg }]} onPress={() => router.push(item.route)} activeOpacity={0.85}>
                            <Ionicons name={item.icon} size={24} color="#1A1A2E" />
                            <Text style={s.quickLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAF8F5' },
    scroll: { paddingHorizontal: 20, paddingBottom: 100 },

    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    greet: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6B6B80' },
    userName: { fontFamily: 'Poppins-Bold', fontSize: 22, color: '#1A1A2E', letterSpacing: -0.3 },
    avatarWrap: {},
    avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
    avatarLetter: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#FFFFFF' },

    heroCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 28, shadowColor: '#1A1A2E', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    heroLeft: { flex: 1, marginRight: 16 },
    heroLabel: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#1A1A2E', marginBottom: 6 },
    heroDesc: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#6B6B80', lineHeight: 20, marginBottom: 16 },
    heroBtnRow: {},
    heroBtn: { backgroundColor: '#4F46E5', alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, gap: 6 },
    heroBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#FFFFFF' },
    heroGraphic: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },

    sectionTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#1A1A2E', marginBottom: 14 },

    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
    catCard: { width: '30.5%', borderRadius: 20, paddingVertical: 20, alignItems: 'center', gap: 8 },
    catLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 12 },

    quickRow: { flexDirection: 'row', gap: 12 },
    quickCard: { flex: 1, borderRadius: 20, padding: 18, alignItems: 'center', gap: 8 },
    quickLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#1A1A2E', textAlign: 'center' },
});