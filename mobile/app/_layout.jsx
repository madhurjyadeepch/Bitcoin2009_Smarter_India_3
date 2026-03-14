// app/_layout.jsx

import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, Component } from 'react';
import { View, Text } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { AuthProvider } from "../context/AuthContext";
import { CityProvider } from "../context/CityContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';

class GlobalErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("FATAL APP CRASH:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 10 }}>App Crashed!</Text>
          <Text style={{ textAlign: 'center', color: '#333' }}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const hideSplash = async () => {
      try { await SplashScreen.hideAsync(); } catch (e) {}
    };
    
    if (fontsLoaded || fontError) {
      hideSplash();
      setForceRender(true);
    }
    
    // Fallback: force hide splash screen and render app after 1.5 seconds no matter what
    const timer = setTimeout(() => {
        if (isMounted) {
            hideSplash();
            setForceRender(true);
        }
    }, 1500);
    return () => {
        isMounted = false;
        clearTimeout(timer);
    };
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError && !forceRender) {
    // Only return null temporarily while we wait for fonts.
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <CityProvider>
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
        </CityProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}