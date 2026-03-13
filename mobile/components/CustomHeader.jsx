// components/CustomHeader.jsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Make sure you have a logo image at this path
const logo = require('../assets/images/logo.jpeg');

export default function CustomHeader() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <View style={styles.headerContainer}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={26} color="#333" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#F4F7FF', // Match the screen's background color
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        // Lowered the heading to fix the refresh icon issue
        paddingTop: Platform.OS === 'android' ? 15 : 10,
        paddingBottom: 10,
        backgroundColor: '#F4F7FF',
    },
    logo: {
        width: 180,
        height: 40,
    },
    notificationButton: {
        padding: 5,
    },
});
