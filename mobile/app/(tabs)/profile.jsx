import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useRouter } from 'expo-router';

const STAT_COLORS = [
    { bg: '#F2CC8F', fg: '#7A5F00', icon: 'document-text' },
    { bg: '#A8D5BA', fg: '#1B5E3B', icon: 'checkmark-circle' },
    { bg: '#B8B5E0', fg: '#3D3680', icon: 'arrow-up' },
];

export default function ProfileScreen() {
    const { user, logout, login } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ totalReports: 0, resolvedReports: 0, totalUpvotes: 0 });
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editModal, setEditModal] = useState(false);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [p, st] = await Promise.all([api.get('/users/me'), api.get('/reports/user-stats')]);
                if (p.data.status === 'success') setProfileData(p.data.data.data);
                if (st.data.status === 'success') setStats(st.data.data);
            } catch {
                try { const p = await api.get('/users/me'); if (p.data.status === 'success') setProfileData(p.data.data.data); } catch {}
            } finally { setIsLoading(false); }
        })();
    }, []);

    const handleLogout = () => Alert.alert("Sign Out", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => { logout(); router.replace('/login'); } },
    ]);

    const handleEditName = async () => {
        if (!editName.trim()) return;
        try {
            const r = await api.patch('/users/updateMe', { name: editName.trim() });
            if (r.data.status === 'success') { setProfileData(r.data.data.user); login(r.data.data.user, null); setEditModal(false); }
        } catch { Alert.alert("Error", "Could not update name."); }
    };

    if (isLoading) return <View style={s.loadWrap}><ActivityIndicator size="large" color="#4F46E5" /></View>;

    const name = profileData?.name || user?.name || 'User';
    const statList = [
        { label: 'Reports', value: stats.totalReports },
        { label: 'Resolved', value: stats.resolvedReports },
        { label: 'Upvotes', value: stats.totalUpvotes },
    ];

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={s.topBar}>
                <Text style={s.topTitle}>Profile</Text>
                <TouchableOpacity onPress={() => { setEditName(name); setEditModal(true); }} hitSlop={10}>
                    <Ionicons name="settings-outline" size={24} color="#1A1A2E" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={s.profileCard}>
                    <View style={s.avatarBig}>
                        <Text style={s.avatarBigText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={s.profileName}>{name}</Text>
                    <Text style={s.profileEmail}>{profileData?.email || user?.email || ''}</Text>
                </View>

                {/* Stats */}
                <View style={s.statsRow}>
                    {statList.map((st, i) => (
                        <View key={i} style={[s.statCard, { backgroundColor: STAT_COLORS[i].bg }]}>
                            <Ionicons name={STAT_COLORS[i].icon} size={22} color={STAT_COLORS[i].fg} />
                            <Text style={[s.statNum, { color: STAT_COLORS[i].fg }]}>{st.value}</Text>
                            <Text style={[s.statLabel, { color: STAT_COLORS[i].fg }]}>{st.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Menu */}
                <View style={s.menuCard}>
                    {[
                        { label: 'My Reports', icon: 'document-text-outline', iconColor: '#F2CC8F', route: '/(tabs)/my-reports' },
                        { label: 'Community Feed', icon: 'people-outline', iconColor: '#89CFF0', route: '/(tabs)/community' },
                        { label: 'New Report', icon: 'add-circle-outline', iconColor: '#A8D5BA', route: '/report-create' },
                    ].map((item, i) => (
                        <TouchableOpacity key={i} style={s.menuRow} onPress={() => router.push(item.route)} activeOpacity={0.7}>
                            <View style={[s.menuIconWrap, { backgroundColor: item.iconColor + '33' }]}>
                                <Ionicons name={item.icon} size={22} color={item.iconColor} />
                            </View>
                            <Text style={s.menuLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                    <Ionicons name="log-out-outline" size={20} color="#E53935" />
                    <Text style={s.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={editModal} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>Edit Name</Text>
                        <View style={s.modalInputWrap}>
                            <TextInput style={s.modalInput} value={editName} onChangeText={setEditName} autoCapitalize="words" placeholder="Your name" placeholderTextColor="#C7C7CC" />
                        </View>
                        <View style={s.modalActions}>
                            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setEditModal(false)}>
                                <Text style={s.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.modalSaveBtn} onPress={handleEditName}>
                                <Text style={s.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAF8F5' },
    loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    topTitle: { fontFamily: 'Poppins-Bold', fontSize: 22, color: '#1A1A2E' },
    scroll: { paddingHorizontal: 20, paddingBottom: 100 },

    profileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 20, shadowColor: '#1A1A2E', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    avatarBig: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    avatarBigText: { fontFamily: 'Poppins-Bold', fontSize: 36, color: '#FFFFFF' },
    profileName: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#1A1A2E' },
    profileEmail: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6B6B80', marginTop: 4 },

    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', gap: 4 },
    statNum: { fontFamily: 'Poppins-Bold', fontSize: 22 },
    statLabel: { fontFamily: 'Poppins-Regular', fontSize: 11 },

    menuCard: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 8, marginBottom: 20, shadowColor: '#1A1A2E', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
    menuIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuLabel: { flex: 1, fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#1A1A2E' },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF0F0', borderRadius: 16, paddingVertical: 16 },
    logoutText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#E53935' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
    modalTitle: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#1A1A2E', marginBottom: 20 },
    modalInputWrap: { backgroundColor: '#F5F3F0', borderRadius: 14, paddingHorizontal: 16, height: 52, justifyContent: 'center', marginBottom: 24 },
    modalInput: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#1A1A2E' },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: { flex: 1, backgroundColor: '#F5F3F0', borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center' },
    modalCancelText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#6B6B80' },
    modalSaveBtn: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center' },
    modalSaveText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#FFFFFF' },
});