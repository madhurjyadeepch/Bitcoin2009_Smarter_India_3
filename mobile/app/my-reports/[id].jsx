import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, Linking
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

const STATUS_STEPS = [
    { key: 'received', label: 'Received', icon: 'checkmark-circle' },
    { key: 'under-review', label: 'Under Review', icon: 'search' },
    { key: 'assigned', label: 'Assigned', icon: 'person' },
    { key: 'work-in-progress', label: 'In Progress', icon: 'construct' },
    { key: 'verification', label: 'Verification', icon: 'eye' },
    { key: 'resolved', label: 'Resolved', icon: 'checkmark-done' },
    { key: 'closed', label: 'Closed', icon: 'lock-closed' },
];

// backward compat for old statuses
const normalizeStatus = (status) => {
    if (status === 'pending') return 'received';
    if (status === 'in-progress') return 'work-in-progress';
    return status;
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

    const openMaps = (address) => {
        if (!address) return;
        const e = encodeURIComponent(address);
        const url = Platform.OS === 'ios' ? `maps:0,0?q=${e}` : `geo:0,0?q=${e}`;
        Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${e}`));
    };

    if (isLoading) return <SafeAreaView style={s.loadWrap}><ActivityIndicator size="large" color="#1A1A2E" /></SafeAreaView>;
    if (!report) return <SafeAreaView style={s.safe}><Text style={{ textAlign: 'center', marginTop: 60, color: '#8E8E93' }}>Not found</Text></SafeAreaView>;

    const normalizedStatus = normalizeStatus(report.status);
    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === normalizedStatus);
    const aColor = AVATAR_COLORS[(report.author?.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={15}>
                    <Ionicons name="chevron-back" size={22} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Track Report</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    {/* Author row */}
                    <View style={s.authorRow}>
                        <View style={[s.avatar, { backgroundColor: aColor }]}><Text style={s.avatarText}>{report.author?.name?.[0]?.toUpperCase() || 'A'}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.authorName}>{report.author?.name || 'Anonymous'}</Text>
                            <Text style={s.dateText}>{new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                        </View>
                    </View>

                    {report.image && <Image source={{ uri: `${SERVER_ROOT}/${report.image}` }} style={s.image} />}

                    {/* Detail card */}
                    <View style={s.detailCard}>
                        <Text style={s.title}>{report.title}</Text>
                        <Text style={s.desc}>{report.description}</Text>

                        {/* Location - clickable */}
                        <TouchableOpacity style={s.locRow} onPress={() => openMaps(report.address)} activeOpacity={0.8}>
                            <Ionicons name="location" size={16} color="#1A1A2E" />
                            <Text style={s.locText}>{report.address}</Text>
                            <Ionicons name="open-outline" size={14} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    {/* Status Tracking Stepper */}
                    <View style={s.trackingCard}>
                        <Text style={s.sectionTitle}>Issue Tracking</Text>
                        {STATUS_STEPS.map((step, i) => {
                            const isDone = i <= currentStepIndex;
                            const isCurrent = i === currentStepIndex;
                            return (
                                <View key={step.key} style={s.stepRow}>
                                    <View style={s.stepLeft}>
                                        <View style={[s.stepDot, isDone && s.stepDotDone, isCurrent && s.stepDotCurrent]}>
                                            {isDone && <Ionicons name={i < currentStepIndex ? "checkmark" : step.icon} size={14} color="#FFFFFF" />}
                                            {!isDone && <Text style={s.stepNum}>{i + 1}</Text>}
                                        </View>
                                        {i < STATUS_STEPS.length - 1 && <View style={[s.stepLine, isDone && s.stepLineDone]} />}
                                    </View>
                                    <View style={s.stepContent}>
                                        <Text style={[s.stepLabel, isDone && s.stepLabelDone, isCurrent && s.stepLabelCurrent]}>{step.label}</Text>
                                        {isCurrent && report.statusHistory?.length > 0 && (() => {
                                            const entry = report.statusHistory.filter(h => normalizeStatus(h.status) === step.key).pop();
                                            if (entry) return <Text style={s.stepTime}>{new Date(entry.timestamp).toLocaleString()}</Text>;
                                            return null;
                                        })()}
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Analysis section */}
                    {report.aiAnalysis?.urgency && (() => {
                        const ai = report.aiAnalysis;
                        const uc = URGENCY_CONFIG[ai.urgency] || URGENCY_CONFIG.medium;
                        return (
                            <View style={s.analysisCard}>
                                <Text style={s.sectionTitle}>Analysis</Text>
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

                    {/* Comments */}
                    <View style={s.commentSection}>
                        <Text style={s.sectionTitle}>Updates & Comments ({comments.length})</Text>
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

    image: { width: '100%', height: 280, backgroundColor: '#F0EDE8' },

    detailCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: -20, borderRadius: 24, padding: 20, shadowColor: '#1A1A2E', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3, marginBottom: 16 },
    title: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#1A1A2E', marginBottom: 8, lineHeight: 28 },
    desc: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6B6B80', lineHeight: 22, marginBottom: 14 },
    locRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3F0', padding: 12, borderRadius: 12, gap: 8 },
    locText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#6B6B80', flex: 1 },

    /* Tracking stepper */
    trackingCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#1A1A2E', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    sectionTitle: { fontFamily: 'Poppins-Bold', fontSize: 16, color: '#1A1A2E', marginBottom: 16 },

    stepRow: { flexDirection: 'row', marginBottom: 0 },
    stepLeft: { alignItems: 'center', width: 36 },
    stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0EDE8', justifyContent: 'center', alignItems: 'center' },
    stepDotDone: { backgroundColor: '#1A1A2E' },
    stepDotCurrent: { backgroundColor: '#1A1A2E', shadowColor: '#1A1A2E', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    stepNum: { fontFamily: 'Poppins-SemiBold', fontSize: 11, color: '#8E8E93' },
    stepLine: { width: 2, flex: 1, minHeight: 24, backgroundColor: '#F0EDE8', marginVertical: 4 },
    stepLineDone: { backgroundColor: '#1A1A2E' },
    stepContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
    stepLabel: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#C7C7CC' },
    stepLabelDone: { color: '#6B6B80', fontFamily: 'Poppins-SemiBold' },
    stepLabelCurrent: { color: '#1A1A2E', fontFamily: 'Poppins-Bold' },
    stepTime: { fontFamily: 'Poppins-Regular', fontSize: 11, color: '#8E8E93', marginTop: 2 },

    /* Analysis */
    analysisCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#1A1A2E', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    aiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    aiBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    aiBadgeText: { fontFamily: 'Poppins-SemiBold', fontSize: 11 },
    aiDept: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#1A1A2E', marginBottom: 4 },
    aiSummaryText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#6B6B80', fontStyle: 'italic', lineHeight: 18 },

    /* Comments */
    commentSection: { paddingHorizontal: 20 },
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
    sendBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' },
});
