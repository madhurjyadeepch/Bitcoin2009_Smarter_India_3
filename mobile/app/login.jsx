import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, SafeAreaView, StatusBar
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) { Alert.alert("Missing Fields", "Please fill in both email and password."); return; }
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Login failed.");
            login(data.data.user, data.token);
            router.replace('/(tabs)/home');
        } catch (error) { Alert.alert("Login Failed", error.message); }
        finally { setIsLoading(false); }
    };

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>
                <View style={s.container}>
                    {/* Top decorative shapes */}
                    <View style={s.decoRow}>
                        <View style={[s.decoCircle, { backgroundColor: '#A8D5BA' }]} />
                        <View style={[s.decoCircle, { backgroundColor: '#F2CC8F', width: 48, height: 48 }]} />
                        <View style={[s.decoCircle, { backgroundColor: '#B8B5E0', width: 28, height: 28 }]} />
                    </View>

                    <View style={s.headSection}>
                        <Text style={s.brandName}>Lok Samadhan</Text>
                        <Text style={s.tagline}>Report civic issues. Build better cities.</Text>
                    </View>

                    <View style={s.card}>
                        <Text style={s.cardTitle}>Sign In</Text>

                        <Text style={s.label}>Email</Text>
                        <View style={s.inputWrap}>
                            <Ionicons name="mail-outline" size={20} color="#8E8E93" />
                            <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor="#C7C7CC" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        </View>

                        <Text style={s.label}>Password</Text>
                        <View style={s.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />
                            <TextInput style={s.input} placeholder="Your password" placeholderTextColor="#C7C7CC" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[s.btn, isLoading && { opacity: 0.7 }]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
                        </TouchableOpacity>
                    </View>

                    <View style={s.footer}>
                        <Text style={s.footerText}>New here? </Text>
                        <TouchableOpacity onPress={() => router.push('/signup')}>
                            <Text style={s.footerLink}>Create an account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAF8F5' },
    flex: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },

    decoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
    decoCircle: { width: 36, height: 36, borderRadius: 50 },

    headSection: { marginBottom: 32 },
    brandName: { fontFamily: 'Poppins-Bold', fontSize: 30, color: '#1A1A2E', letterSpacing: -0.5 },
    tagline: { fontFamily: 'Poppins-Regular', fontSize: 15, color: '#6B6B80', marginTop: 6, lineHeight: 22 },

    card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#1A1A2E', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    cardTitle: { fontFamily: 'Poppins-Bold', fontSize: 22, color: '#1A1A2E', marginBottom: 20 },

    label: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#6B6B80', marginBottom: 8, marginTop: 14 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3F0', borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10 },
    input: { flex: 1, fontFamily: 'Poppins-Regular', fontSize: 15, color: '#1A1A2E', height: '100%' },

    btn: { backgroundColor: '#1A1A2E', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    btnText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#FFFFFF' },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6B6B80' },
    footerLink: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#4F46E5' },
});