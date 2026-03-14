import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
    Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, SafeAreaView, StatusBar, ActionSheetIOS
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import api from "../utils/api";

const CATEGORIES = [
    { label: "Pothole", icon: "warning", bg: "#F2CC8F", fg: "#7A5F00" },
    { label: "Garbage", icon: "trash", bg: "#A8D5BA", fg: "#1B5E3B" },
    { label: "Streetlight", icon: "flash", bg: "#B8B5E0", fg: "#3D3680" },
    { label: "Drainage", icon: "water", bg: "#89CFF0", fg: "#1A5276" },
    { label: "Vandalism", icon: "alert-circle", bg: "#F4845F", fg: "#7A2D14" },
    { label: "General", icon: "flag", bg: "#E8D5C4", fg: "#6B4226" },
];

export default function ReportCreateScreen() {
    const router = useRouter();
    const { preCategory } = useLocalSearchParams();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [address, setAddress] = useState("");
    const [category, setCategory] = useState(preCategory || "Pothole");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isAutofilling, setIsAutofilling] = useState(false);

    useEffect(() => { if (preCategory) setCategory(preCategory); }, [preCategory]);

    const getAutoLocation = useCallback(async () => {
        setIsFetchingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
            try {
                const loc = await Location.getCurrentPositionAsync({});
                const geo = await Location.reverseGeocodeAsync(loc.coords);
                if (geo.length > 0) {
                    const g = geo[0];
                    setAddress(`${g.name || g.street || ''}, ${g.city || ''}, ${g.postalCode || ''}`);
                }
            } catch {}
        }
        setIsFetchingLocation(false);
    }, []);

    const showImagePicker = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
                (idx) => { if (idx === 1) pickImage(true); else if (idx === 2) pickImage(false); }
            );
        } else {
            Alert.alert("Add Photo", "Choose an option", [
                { text: "Camera", onPress: () => pickImage(true) },
                { text: "Gallery", onPress: () => pickImage(false) },
                { text: "Cancel", style: "cancel" },
            ]);
        }
    };

    const pickImage = async (useCamera) => {
        const fn = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
        const result = await fn({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const handleSmartFill = async () => {
        if (!description && !image) {
            Alert.alert("Smart Fill", "Please add a photo or write a brief description first.");
            return;
        }
        setIsAutofilling(true);
        try {
            const textHint = description || `A civic issue at ${address || 'an unknown location'}`;
            const res = await api.post('/reports/ai-autofill', { text: textHint, address });
            const { suggestedTitle, suggestedDescription, suggestedCategory } = res.data.data;

            if (suggestedTitle) setTitle(suggestedTitle);
            if (suggestedDescription) setDescription(suggestedDescription);
            if (suggestedCategory) {
                const match = CATEGORIES.find(c => c.label.toLowerCase() === suggestedCategory.toLowerCase());
                setCategory(match ? match.label : "General");
            }
        } catch {
            Alert.alert("Error", "Could not generate details. Try again.");
        } finally {
            setIsAutofilling(false);
        }
    };

    const handleSubmit = async () => {
        if (!image || !title || !description || !address) { Alert.alert("Incomplete", "Please fill all fields and add a photo."); return; }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('title', title); formData.append('description', description);
        formData.append('category', category); formData.append('address', address);
        const filename = image.split('/').pop();
        formData.append("image", { uri: image, name: filename, type: `image/${filename.split('.').pop() || 'jpeg'}` });
        try {
            await api.post('/reports/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            router.replace("/(tabs)/my-reports");
        } catch { Alert.alert("Error", "Could not submit report."); }
        finally { setIsSubmitting(false); }
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="dark-content" />
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} hitSlop={15}>
                    <Ionicons name="close" size={24} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>New Report</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                    {/* Photo Section */}
                    <TouchableOpacity style={s.photoArea} onPress={showImagePicker} activeOpacity={0.9}>
                        {image ? (
                            <View>
                                <Image source={{ uri: image }} style={s.photoPreview} />
                                <TouchableOpacity style={s.photoRemoveBtn} onPress={() => setImage(null)}>
                                    <Ionicons name="close-circle" size={28} color="#1A1A2E" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={s.photoPlaceholder}>
                                <View style={s.photoIconWrap}>
                                    <Ionicons name="camera" size={32} color="#1A1A2E" />
                                </View>
                                <Text style={s.photoText}>Tap to add a photo</Text>
                                <Text style={s.photoHint}>Camera or Gallery</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Fields */}
                    <Text style={s.label}>Title</Text>
                    <View style={s.inputWrap}>
                        <TextInput style={s.input} placeholder="What's the issue?" placeholderTextColor="#C7C7CC" value={title} onChangeText={setTitle} />
                    </View>

                    <Text style={s.label}>Description</Text>
                    <View style={[s.inputWrap, { height: 100, alignItems: 'flex-start', paddingTop: 14 }]}>
                        <TextInput style={[s.input, { height: '100%' }]} placeholder="Describe the issue briefly..." placeholderTextColor="#C7C7CC" value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
                    </View>

                    {/* Smart Fill Button */}
                    <TouchableOpacity style={s.smartFillBtn} onPress={handleSmartFill} disabled={isAutofilling} activeOpacity={0.85}>
                        {isAutofilling ? (
                            <ActivityIndicator size="small" color="#1A1A2E" />
                        ) : (
                            <>
                                <Ionicons name="sparkles-outline" size={18} color="#1A1A2E" />
                                <Text style={s.smartFillText}>Improve with Smart Fill</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Categories */}
                    <Text style={s.label}>Category</Text>
                    <View style={s.catGrid}>
                        {CATEGORIES.map((cat, i) => (
                            <TouchableOpacity key={i} style={[s.catCard, category === cat.label && { borderWidth: 2.5, borderColor: cat.fg }]} onPress={() => setCategory(cat.label)} activeOpacity={0.85}>
                                <View style={[s.catIconWrap, { backgroundColor: cat.bg }]}>
                                    <Ionicons name={cat.icon} size={22} color={cat.fg} />
                                </View>
                                <Text style={[s.catLabel, category === cat.label && { color: cat.fg, fontFamily: 'Poppins-Bold' }]}>{cat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Location */}
                    <Text style={s.label}>Location</Text>
                    <View style={s.locRow}>
                        <View style={[s.inputWrap, { flex: 1, marginBottom: 0 }]}>
                            <TextInput style={s.input} placeholder="Enter address" placeholderTextColor="#C7C7CC" value={address} onChangeText={setAddress} />
                        </View>
                        <TouchableOpacity style={s.locBtn} onPress={getAutoLocation} activeOpacity={0.85}>
                            {isFetchingLocation ? <ActivityIndicator color="#1A1A2E" /> : <Ionicons name="navigate" size={22} color="#1A1A2E" />}
                        </TouchableOpacity>
                    </View>
                    <Text style={s.locHint}>Tap the arrow to auto-detect your current location</Text>

                </ScrollView>

                <View style={s.footer}>
                    <TouchableOpacity style={[s.submitBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.85}>
                        {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.submitText}>Submit Report</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAF8F5' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    headerTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#1A1A2E' },
    scroll: { paddingHorizontal: 20, paddingBottom: 20 },

    photoArea: { width: '100%', borderRadius: 20, overflow: 'hidden', marginBottom: 24, backgroundColor: '#FFFFFF', shadowColor: '#1A1A2E', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    photoPreview: { width: '100%', height: 220, borderRadius: 20 },
    photoRemoveBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 14 },
    photoPlaceholder: { height: 180, justifyContent: 'center', alignItems: 'center' },
    photoIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F0EDE8', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    photoText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#1A1A2E' },
    photoHint: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#8E8E93', marginTop: 4 },

    label: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#1A1A2E', marginBottom: 8 },
    inputWrap: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, height: 52, justifyContent: 'center', marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    input: { fontFamily: 'Poppins-Regular', fontSize: 15, color: '#1A1A2E' },

    smartFillBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#F2CC8F', borderRadius: 12, height: 44, marginBottom: 24,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
    },
    smartFillText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#1A1A2E' },

    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    catCard: { width: '30.5%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    catIconWrap: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    catLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#6B6B80' },

    locRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    locBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F0EDE8', justifyContent: 'center', alignItems: 'center' },
    locHint: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#8E8E93', marginBottom: 24, paddingLeft: 4 },

    footer: { padding: 20, backgroundColor: '#FAF8F5' },
    submitBtn: { backgroundColor: '#1A1A2E', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
    submitText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#FFFFFF' },
});