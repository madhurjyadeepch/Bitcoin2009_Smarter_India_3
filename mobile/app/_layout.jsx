// app/_layout.jsx

import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { AuthProvider } from "../context/AuthContext"; // <-- For Authentication

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // --- FONT LOADING LOGIC ---
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the splash screen after the fonts have loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Return null while fonts are loading to prevent rendering
  if (!fontsLoaded) {
    return null;
  }

  // --- AUTH AND NAVIGATION SETUP ---
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="report-create" options={{ presentation: "modal" }} />
        <Stack.Screen name="my-reports/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="community/[id]" options={{ presentation: "modal" }} />
      </Stack>
    </AuthProvider>
  );
}