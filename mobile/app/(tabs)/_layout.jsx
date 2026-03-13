import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { ActivityIndicator, View, Platform } from "react-native";

export default function TabsLayout() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' }}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!user) return null;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#4F46E5",
                tabBarInactiveTintColor: "#B0B0B8",
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 11,
                    marginBottom: Platform.OS === 'ios' ? 0 : 4,
                },
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: "#F0EDE8",
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingTop: 6,
                    elevation: 0,
                    shadowOpacity: 0,
                },
            }}
        >
            <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
            <Tabs.Screen name="my-reports" options={{ title: "Reports", tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} /> }} />
            <Tabs.Screen name="community" options={{ title: "Community", tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
        </Tabs>
    );
}