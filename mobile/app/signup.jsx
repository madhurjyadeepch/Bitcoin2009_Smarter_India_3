import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function SignupScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password || !passwordConfirm) { Alert.alert("Incomplete", "Please fill all fields."); return; }
        if (password !== passwordConfirm) { Alert.alert("Mismatch", "Passwords don't match."); return; }
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/signup`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, passwordConfirm }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Signup failed.");
            login(data.data.user, data.token);
            router.replace('/(tabs)/home');
        } catch (error) { Alert.alert("Signup Failed", error.message); }
        finally { setIsLoading(false); }
    };

    const fields = [
        { icon: "person-outline", placeholder: "Full Name", value: name, setter: setName, capitalize: "words" },
        { icon: "mail-outline", placeholder: "Email", value: email, setter: setEmail, keyboard: "email-address", capitalize: "none" },
        { icon: "lock-closed-outline", placeholder: "Password", value: password, setter: setPassword, secure: true },
        { icon: "shield-checkmark-outline", placeholder: "Confirm Password", value: passwordConfirm, setter: setPasswordConfirm, secure: true },
    ];

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <TouchableOpacity onPress={() => router.back()} style={s.back} hitSlop={15}>
                        <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
                    </TouchableOpacity>

                    <View style={s.decoRow}>
                        <View style={[s.decoCircle, { backgroundColor: '#F4845F' }]} />
                        <View style={[s.decoCircle, { backgroundColor: '#89CFF0', width: 44, height: 44 }]} />
                        <View style={[s.decoCircle, { backgroundColor: '#F2CC8F', width: 24, height: 24 }]} />
                    </View>

                    <Text style={s.title}>Create Account</Text>
                    <Text style={s.subtitle}>Join the community and make a difference</Text>

                    <View style={s.card}>
                        {fields.map((f, i) => (
                            <View key={i}>
                                <View style={s.inputWrap}>
                                    <Ionicons name={f.icon} size={20} color="#8E8E93" />
                                    <TextInput style={s.input} placeholder={f.placeholder} placeholderTextColor="#C7C7CC" value={f.value} onChangeText={f.setter} secureTextEntry={f.secure} keyboardType={f.keyboard} autoCapitalize={f.capitalize} />
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity style={[s.btn, isLoading && { opacity: 0.7 }]} onPress={handleSignup} disabled={isLoading} activeOpacity={0.85}>
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
                        </TouchableOpacity>
                    </View>

                    <View style={s.footer}>
                        <Text style={s.footerText}>Already on Lok Samadhan? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={s.footerLink}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAF8F5' },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },
    back: { marginTop: 12, marginBottom: 20, width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },

    decoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    decoCircle: { width: 36, height: 36, borderRadius: 50 },

    title: { fontFamily: 'Poppins-Bold', fontSize: 28, color: '#1A1A2E', letterSpacing: -0.5 },
    subtitle: { fontFamily: 'Poppins-Regular', fontSize: 15, color: '#6B6B80', marginTop: 4, marginBottom: 24, lineHeight: 22 },

    card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#1A1A2E', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3, gap: 14 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3F0', borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10 },
    input: { flex: 1, fontFamily: 'Poppins-Regular', fontSize: 15, color: '#1A1A2E', height: '100%' },

    btn: { backgroundColor: '#1A1A2E', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    btnText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#FFFFFF' },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6B6B80' },
    footerLink: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#4F46E5' },
});