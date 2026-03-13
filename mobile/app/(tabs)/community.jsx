import {
    View, Text, StyleSheet, FlatList, RefreshControl, Share, Alert, ActivityIndicator,
    TouchableOpacity, Image, StatusBar, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const SERVER_ROOT = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '');
const AVATAR_COLORS = ['#F2CC8F', '#A8D5BA', '#B8B5E0', '#89CFF0', '#F4845F', '#E8D5C4'];

const URGENCY_CONFIG = {
    critical: { bg: '#FFF0F0', color: '#E53935', label: 'Critical' },
    high: { bg: '#FFF3E0', color: '#E65100', label: 'High' },
    medium: { bg: '#FFF8E5', color: '#E6A817', label: 'Medium' },
    low: { bg: '#E8F5E9', color: '#2E7D32', label: 'Low' },
};

const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'now'; if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
};

const CommunityCard = ({ item, currentUserId }) => {
    const router = useRouter();
    const [ups, setUps] = useState(item.upvotedBy?.length || 0);
    const [isUp, setIsUp] = useState(item.upvotedBy?.includes(currentUserId));
    const avatarColor = AVATAR_COLORS[(item.author?.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
    const ai = item.aiAnalysis;
    const urgency = ai?.urgency ? URGENCY_CONFIG[ai.urgency] : null;

    const vote = async () => {
        try {
            const res = await api.patch(`/reports/${item._id}/upvote`);
            const r = res.data.data.report;
            setUps(r.upvotedBy?.length || 0);
            setIsUp(r.upvotedBy?.includes(currentUserId));
        } catch { Alert.alert("Error", "Could not vote."); }
    };

    return (
        <View style={s.card}>
            <View style={s.cardHeader}>
                <View style={[s.cardAvatar, { backgroundColor: avatarColor }]}>
                    <Text style={s.cardAvatarText}>{item.author?.name?.[0]?.toUpperCase() || 'A'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.cardAuthor}>{item.author?.name || 'Anonymous'}</Text>
                    <View style={s.cardMetaRow}>
                        {ai?.department && <Text style={s.deptTag}>{ai.department}</Text>}
                    </View>
                </View>
                <Text style={s.cardTime}>{timeAgo(item.createdAt)}</Text>
            </View>

            {/* AI Urgency + Priority Badge */}
            {ai?.urgency && (
                <View style={s.aiBadgeRow}>
                    <View style={[s.urgencyBadge, { backgroundColor: urgency.bg }]}>
                        <View style={[s.urgDot, { backgroundColor: urgency.color }]} />
                        <Text style={[s.urgText, { color: urgency.color }]}>{urgency.label} Priority</Text>
                    </View>
                    {ai.priorityScore != null && (
                        <View style={s.scoreBadge}>
                            <Text style={s.scoreText}>{ai.priorityScore}</Text>
                            <Text style={s.scoreLabel}>/100</Text>
                        </View>
                    )}
                </View>
            )}

            {item.image && (
                <TouchableOpacity activeOpacity={0.95} onPress={() => router.push(`/community/${item._id}`)}>
                    <Image source={{ uri: `${SERVER_ROOT}/${item.image}` }} style={s.cardImage} />
                </TouchableOpacity>
            )}

            <View style={s.cardBody}>
                <Text style={s.cardTitle}>{item.title}</Text>
                {ai?.aiSummary && <Text style={s.aiSummary}>{ai.aiSummary}</Text>}
                <View style={s.cardLocRow}>
                    <Ionicons name="location" size={14} color="#8E8E93" />
                    <Text style={s.cardLoc} numberOfLines={1}>{item.address}</Text>
                </View>
            </View>

            <View style={s.cardActions}>
                <TouchableOpacity style={s.actionBtn} onPress={vote} hitSlop={10}>
                    <Ionicons name={isUp ? "heart" : "heart-outline"} size={22} color={isUp ? "#E53935" : "#8E8E93"} />
                    <Text style={[s.actionText, isUp && { color: '#E53935' }]}>{ups}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => router.push(`/community/${item._id}`)} hitSlop={10}>
                    <Ionicons name="chatbubble-outline" size={20} color="#8E8E93" />
                    <Text style={s.actionText}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={async () => { try { await Share.share({ message: `Civic Issue: ${item.title} at ${item.address}` }); } catch {} }} hitSlop={10}>
                    <Ionicons name="share-outline" size={20} color="#8E8E93" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function CommunityScreen() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [showCityModal, setShowCityModal] = useState(false);

    const fetchReports = async (city) => {
        try {
            const params = {};
            if (city) params.city = city;
            const r = await api.get('/reports/', { params });
            setReports(r.data.data?.reports || []);
        } catch { Alert.alert("Error", "Failed to fetch."); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const fetchCities = async () => {
        try { const r = await api.get('/reports/cities'); setCities(r.data.data?.cities || []); } catch {}
    };

    useEffect(() => { fetchReports(selectedCity); fetchCities(); }, []);
    const onRefresh = useCallback(() => { setRefreshing(true); fetchReports(selectedCity); }, [selectedCity]);

    const selectCity = (city) => {
        setSelectedCity(city);
        setShowCityModal(false);
        setLoading(true);
        fetchReports(city);
    };

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={s.header}>
                <Text style={s.headerTitle}>Community</Text>
                <TouchableOpacity style={s.cityBtn} onPress={() => setShowCityModal(true)} activeOpacity={0.8}>
                    <Ionicons name="location" size={16} color="#4F46E5" />
                    <Text style={s.cityBtnText}>{selectedCity || 'All Cities'}</Text>
                    <Ionicons name="chevron-down" size={14} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={s.loadWrap}><ActivityIndicator size="large" color="#4F46E5" /></View>
            ) : (
                <FlatList
                    data={reports}
                    renderItem={({ item }) => <CommunityCard item={item} currentUserId={user?._id} />}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={s.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<View style={s.empty}><Ionicons name="people-outline" size={48} color="#C7C7CC" /><Text style={s.emptyText}>No reports found.</Text></View>}
                />
            )}

            {/* City Filter Modal */}
            <Modal visible={showCityModal} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>Filter by City</Text>
                        <ScrollView style={s.modalScroll}>
                            <TouchableOpacity style={[s.modalItem, !selectedCity && s.modalItemActive]} onPress={() => selectCity('')}>
                                <Text style={[s.modalItemText, !selectedCity && s.modalItemTextActive]}>All Cities</Text>
                            </TouchableOpacity>
                            {cities.map(c => (
                                <TouchableOpacity key={c} style={[s.modalItem, selectedCity === c && s.modalItemActive]} onPress={() => selectCity(c)}>
                                    <Text style={[s.modalItemText, selectedCity === c && s.modalItemTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowCityModal(false)}>
                            <Text style={s.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAF8F5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    headerTitle: { fontFamily: 'Poppins-Bold', fontSize: 22, color: '#1A1A2E' },
    cityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    cityBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#4F46E5' },
    loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', marginTop: 80, gap: 12 },
    emptyText: { fontFamily: 'Poppins-Regular', fontSize: 15, color: '#8E8E93' },

    card: { backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 16, overflow: 'hidden', shadowColor: '#1A1A2E', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
    cardAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardAvatarText: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#1A1A2E' },
    cardAuthor: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#1A1A2E' },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    deptTag: { fontFamily: 'Poppins-Regular', fontSize: 11, color: '#4F46E5', backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    cardTime: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#8E8E93' },

    aiBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
    urgencyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
    urgDot: { width: 6, height: 6, borderRadius: 3 },
    urgText: { fontFamily: 'Poppins-SemiBold', fontSize: 11 },
    scoreBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#1A1A2E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    scoreText: { fontFamily: 'Poppins-Bold', fontSize: 14, color: '#FFFFFF' },
    scoreLabel: { fontFamily: 'Poppins-Regular', fontSize: 10, color: '#9CA3AF' },

    cardImage: { width: '100%', height: 260, backgroundColor: '#F0EDE8' },
    cardBody: { padding: 16, paddingTop: 14 },
    cardTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#1A1A2E', marginBottom: 4 },
    aiSummary: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#4F46E5', marginBottom: 8, fontStyle: 'italic', lineHeight: 18 },
    cardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    cardLoc: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#8E8E93', flex: 1 },

    cardActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F5F3F0', gap: 20 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    actionText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#8E8E93' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '60%' },
    modalTitle: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#1A1A2E', marginBottom: 16 },
    modalScroll: { marginBottom: 16 },
    modalItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
    modalItemActive: { backgroundColor: '#EDE9FE' },
    modalItemText: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#6B6B80' },
    modalItemTextActive: { fontFamily: 'Poppins-SemiBold', color: '#4F46E5' },
    modalCloseBtn: { backgroundColor: '#F5F3F0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    modalCloseText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#6B6B80' },
});