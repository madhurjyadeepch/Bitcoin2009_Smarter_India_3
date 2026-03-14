import {
    View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity,
    Image, Linking, Platform, StatusBar, ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../utils/api";

const SERVER_ROOT = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '');

const STATUS_CONFIG = {
    'received': { bg: '#EDE9FE', color: '#4F46E5', dot: '#4F46E5', label: 'Received' },
    'under-review': { bg: '#FFF8E5', color: '#E6A817', dot: '#E6A817', label: 'Under Review' },
    'assigned': { bg: '#E0F2FE', color: '#0284C7', dot: '#0284C7', label: 'Assigned' },
    'work-in-progress': { bg: '#FFF3E0', color: '#E65100', dot: '#E65100', label: 'In Progress' },
    'verification': { bg: '#F3E8FF', color: '#7C3AED', dot: '#7C3AED', label: 'Verification' },
    'resolved': { bg: '#E8F5E9', color: '#2E7D32', dot: '#2E7D32', label: 'Resolved' },
    'closed': { bg: '#F5F3F0', color: '#8E8E93', dot: '#8E8E93', label: 'Closed' },
    // Backward compat for old DB records
    'pending': { bg: '#EDE9FE', color: '#4F46E5', dot: '#4F46E5', label: 'Received' },
    'in-progress': { bg: '#FFF3E0', color: '#E65100', dot: '#E65100', label: 'In Progress' },
};

const ReportCard = ({ report, onDelete, onOpenMap }) => {
    const router = useRouter();
    const sc = STATUS_CONFIG[report.status] || STATUS_CONFIG['pending'];

    return (
        <View style={s.card}>
            {report.image && (
                <TouchableOpacity activeOpacity={0.95} onPress={() => router.push(`/my-reports/${report._id}`)}>
                    <Image source={{ uri: `${SERVER_ROOT}/${report.image}` }} style={s.cardImg} />
                </TouchableOpacity>
            )}
            <View style={s.cardContent}>
                <View style={s.cardTopRow}>
                    <View style={[s.catPill, { backgroundColor: '#F5F3F0' }]}>
                        <Text style={s.catText}>{report.category}</Text>
                    </View>
                    <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
                        <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
                        <Text style={[s.statusText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                </View>

                <Text style={s.cardTitle}>{report.title}</Text>
                <Text style={s.cardDesc} numberOfLines={2}>{report.description}</Text>

                <View style={s.locRow}>
                    <Ionicons name="location" size={14} color="#8E8E93" />
                    <Text style={s.locText} numberOfLines={1}>{report.address}</Text>
                </View>
            </View>

            <View style={s.actionsRow}>
                <TouchableOpacity style={s.actBtn} onPress={onOpenMap} activeOpacity={0.75}>
                    <Ionicons name="map-outline" size={18} color="#4F46E5" />
                    <Text style={[s.actLabel, { color: '#4F46E5' }]}>Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actBtn} onPress={() => router.push(`/my-reports/${report._id}`)} activeOpacity={0.75}>
                    <Ionicons name="open-outline" size={18} color="#2E7D32" />
                    <Text style={[s.actLabel, { color: '#2E7D32' }]}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actBtn} onPress={onDelete} activeOpacity={0.75}>
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                    <Text style={[s.actLabel, { color: '#E53935' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function MyReportsScreen() {
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadReports = useCallback(async () => {
        setRefreshing(true);
        try { const r = await api.get('/reports/my-reports'); setReports(r.data?.data?.reports || []); }
        catch { Alert.alert("Error", "Could not load reports."); }
        finally { setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { loadReports(); }, [loadReports]));

    const handleDelete = (id) => Alert.alert("Delete Report", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            try { await api.delete(`/reports/${id}`); loadReports(); }
            catch { Alert.alert("Error", "Could not delete."); }
        }},
    ]);

    const openMap = (address) => {
        if (!address) return;
        const e = encodeURIComponent(address);
        const url = Platform.OS === 'ios' ? `maps:0,0?q=${e}` : `geo:0,0?q=${e}`;
        Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${e}`));
    };

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={s.header}>
                <Text style={s.headerTitle}>My Reports</Text>
                <TouchableOpacity style={s.addBtn} onPress={() => router.push('/report-create')} activeOpacity={0.85}>
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            <FlatList
                data={reports}
                renderItem={({ item }) => <ReportCard report={item} onDelete={() => handleDelete(item._id)} onOpenMap={() => openMap(item.address)} />}
                keyExtractor={(item) => item._id}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadReports} tintColor="#4F46E5" />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<View style={s.empty}><Ionicons name="document-text-outline" size={48} color="#C7C7CC" /><Text style={s.emptyText}>No reports yet. Create your first one!</Text></View>}
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAF8F5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    headerTitle: { fontFamily: 'Poppins-Bold', fontSize: 22, color: '#1A1A2E' },
    addBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', marginTop: 80, gap: 12 },
    emptyText: { fontFamily: 'Poppins-Regular', fontSize: 15, color: '#8E8E93' },

    card: { backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 16, overflow: 'hidden', shadowColor: '#1A1A2E', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    cardImg: { width: '100%', height: 200, backgroundColor: '#F0EDE8' },
    cardContent: { padding: 16 },

    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    catPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
    catText: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#6B6B80', textTransform: 'capitalize' },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    statusText: { fontFamily: 'Poppins-SemiBold', fontSize: 12, textTransform: 'capitalize' },

    cardTitle: { fontFamily: 'Poppins-Bold', fontSize: 17, color: '#1A1A2E', marginBottom: 4 },
    cardDesc: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6B6B80', lineHeight: 20, marginBottom: 10 },

    locRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    locText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#8E8E93', flex: 1 },

    actionsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F5F3F0' },
    actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
    actLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 13 },
});