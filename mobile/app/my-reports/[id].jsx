import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const URGENCY_CONFIG = {
    critical: { bg: '#FFF0F0', color: '#E53935', label: 'Critical' },
    high: { bg: '#FFF3E0', color: '#E65100', label: 'High' },
    medium: { bg: '#FFF8E5', color: '#E6A817', label: 'Medium' },
    low: { bg: '#E8F5E9', color: '#2E7D32', label: 'Low' },
};

const SERVER_ROOT = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '');
const AVATAR_COLORS = ['#F2CC8F', '#A8D5BA', '#B8B5E0', '#89CFF0', '#F4845F', '#E8D5C4'];

const STATUS_CONFIG = {
    'pending': { bg: '#FFF0F0', color: '#E53935', dot: '#E53935' },
    'in-progress': { bg: '#FFF8E5', color: '#E6A817', dot: '#E6A817' },
    'resolved': { bg: '#E8F5E9', color: '#2E7D32', dot: '#2E7D32' },
};

export default function MyReportDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [report, setReport] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [r, c] = await Promise.all([api.get(`/reports/${id}`), api.get(`/comments/${id}`)]);
                setReport(r.data.data.report); setComments(c.data.data.comments);
            } catch { Alert.alert("Error", "Could not load data."); }
            finally { setIsLoading(false); }
        })();
    }, [id]);

    const handleComment = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`/comments/${id}`, { text: newComment.trim() });
            setComments(prev => [res.data.data.comment, ...prev]);
            setNewComment("");
        } catch { Alert.alert("Error", "Could not post."); }
        finally { setIsSubmitting(false); }
    };

    if (isLoading) return <SafeAreaView style={s.loadWrap}><ActivityIndicator size="large" color="#4F46E5" /></SafeAreaView>;
    if (!report) return <SafeAreaView style={s.safe}><Text style={{ textAlign: 'center', marginTop: 60, color: '#8E8E93' }}>Not found</Text></SafeAreaView>;

    const sc = STATUS_CONFIG[report.status] || STATUS_CONFIG['pending'];
    const aColor = AVATAR_COLORS[(report.author?.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={15}>
                    <Ionicons name="chevron-back" size={22} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Report</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    <View style={s.authorRow}>
                        <View style={[s.avatar, { backgroundColor: aColor }]}><Text style={s.avatarText}>{report.author?.name?.[0]?.toUpperCase() || 'A'}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.authorName}>{report.author?.name || 'Anonymous'}</Text>
                            <Text style={s.dateText}>{new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                        </View>
                        <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
                            <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
                            <Text style={[s.statusLabel, { color: sc.color }]}>{report.status}</Text>
                        </View>
                    </View>

                    {report.image && <Image source={{ uri: `${SERVER_ROOT}/${report.image}` }} style={s.image} />}

                    <View style={s.detailCard}>
                        <Text style={s.title}>{report.title}</Text>
                        <Text style={s.desc}>{report.description}</Text>

                        {report.aiAnalysis?.urgency && (() => {
                            const ai = report.aiAnalysis;
                            const uc = URGENCY_CONFIG[ai.urgency] || URGENCY_CONFIG.medium;
                            return (
                                <View style={s.aiSection}>
                                    <Text style={s.aiSectionTitle}>AI Analysis</Text>
                                    <View style={s.aiRow}>
                                        <View style={[s.aiBadge, { backgroundColor: uc.bg }]}>
                                            <Text style={[s.aiBadgeText, { color: uc.color }]}>{uc.label} Urgency</Text>
                                        </View>
                                        {ai.priorityScore != null && (
                                            <View style={[s.aiBadge, { backgroundColor: '#1A1A2E' }]}>
                                                <Text style={[s.aiBadgeText, { color: '#FFFFFF' }]}>Score: {ai.priorityScore}/100</Text>
                                            </View>
                                        )}
                                    </View>
                                    {ai.department && <Text style={s.aiDept}>Dept: {ai.department}</Text>}
                                    {ai.aiSummary && <Text style={s.aiSummaryText}>{ai.aiSummary}</Text>}
                                </View>
                            );
                        })()}

                        <View style={s.locRow}>
                            <Ionicons name="location" size={16} color="#4F46E5" />
                            <Text style={s.locText}>{report.address}</Text>
                        </View>
                    </View>

                    <View style={s.commentSection}>
                        <Text style={s.commentHead}>Updates & Comments ({comments.length})</Text>
                        {comments.length === 0 ? (
                            <Text style={s.noComments}>No updates yet.</Text>
                        ) : (
                            comments.map(c => {
                                const cColor = AVATAR_COLORS[(c.author?.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
                                return (
                                    <View key={c._id} style={s.commentItem}>
                                        <View style={[s.commentAv, { backgroundColor: cColor }]}><Text style={s.commentAvText}>{c.author?.name?.[0]?.toUpperCase() || 'A'}</Text></View>
                                        <View style={s.commentBody}>
                                            <View style={s.commentMeta}>
                                                <Text style={s.commentAuthor}>{c.author?.name || 'Anonymous'}</Text>
                                                <Text style={s.commentTime}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                                            </View>
                                            <Text style={s.commentText}>{c.text}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>

                <View style={s.footer}>
                    <View style={s.inputRow}>
                        <TextInput style={s.commentInput} placeholder="Write a comment..." placeholderTextColor="#C7C7CC" value={newComment} onChangeText={setNewComment} multiline />
                        <TouchableOpacity style={[s.sendBtn, (!newComment.trim() || isSubmitting) && { opacity: 0.5 }]} onPress={handleComment} disabled={!newComment.trim() || isSubmitting}>
                            {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={20} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAF8F5' },
    loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    headerTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#1A1A2E' },
    scroll: { paddingBottom: 20 },

    authorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#1A1A2E' },
    authorName: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#1A1A2E', marginBottom: 2 },
    dateText: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#8E8E93' },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    statusLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 12, textTransform: 'capitalize' },

    image: { width: '100%', height: 280, backgroundColor: '#F0EDE8' },

    detailCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: -20, borderRadius: 24, padding: 20, shadowColor: '#1A1A2E', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3, marginBottom: 16 },
    title: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#1A1A2E', marginBottom: 8, lineHeight: 28 },
    desc: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6B6B80', lineHeight: 22, marginBottom: 14 },
    locRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3F0', padding: 12, borderRadius: 12, gap: 8 },
    locText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#6B6B80', flex: 1 },

    aiSection: { marginTop: 16, marginBottom: 16, backgroundColor: '#F9F8F5', borderRadius: 16, padding: 14 },
    aiSectionTitle: { fontFamily: 'Poppins-Bold', fontSize: 13, color: '#4F46E5', marginBottom: 8 },
    aiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    aiBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    aiBadgeText: { fontFamily: 'Poppins-SemiBold', fontSize: 11 },
    aiDept: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#4F46E5', marginBottom: 4 },
    aiSummaryText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#6B6B80', fontStyle: 'italic', lineHeight: 18 },

    commentSection: { paddingHorizontal: 20 },
    commentHead: { fontFamily: 'Poppins-Bold', fontSize: 16, color: '#1A1A2E', marginBottom: 16 },
    noComments: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#8E8E93', fontStyle: 'italic' },
    commentItem: { flexDirection: 'row', marginBottom: 18 },
    commentAv: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    commentAvText: { fontFamily: 'Poppins-Bold', fontSize: 14, color: '#1A1A2E' },
    commentBody: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    commentMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    commentAuthor: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#1A1A2E' },
    commentTime: { fontFamily: 'Poppins-Regular', fontSize: 11, color: '#8E8E93' },
    commentText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6B6B80', lineHeight: 20 },

    footer: { padding: 16, backgroundColor: '#FAF8F5', borderTopWidth: 1, borderTopColor: '#F0EDE8' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFFFFF', borderRadius: 20, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    commentInput: { flex: 1, maxHeight: 100, fontFamily: 'Poppins-Regular', fontSize: 15, color: '#1A1A2E', paddingVertical: 8 },
    sendBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
});
