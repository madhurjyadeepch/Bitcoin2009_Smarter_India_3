// components/ReportCard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const getStatusStyle = (status) => {
    switch (status) {
        case "in-progress": return { backgroundColor: "#fffbe6", color: "#f59e0b" };
        case "resolved": return { backgroundColor: "#f0fdf4", color: "#22c55e" };
        case "pending": default: return { backgroundColor: "#fee2e2", color: "#ef4444" };
    }
};

const ReportCard = ({ report, onEdit, onDelete, onOpenMap }) => {
    const router = useRouter();
    
    const imageUrl = `${process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '')}/${report.image}`;
    const statusStyle = getStatusStyle(report.status);

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/my-reports/${report._id}`)}
            activeOpacity={0.9}
        >
            <Image source={{ uri: imageUrl }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.categoryText}>{report.category}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                            {report.status}
                        </Text>
                    </View>
                </View>
                <Text style={styles.cardTitle}>{report.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                    {report.description}
                </Text>
                <View style={styles.locationContainer}>
                    <Ionicons name="location-sharp" size={16} color="#636e72" />
                    <Text style={styles.addressText}>{report.address}</Text>
                </View>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton} onPress={onOpenMap}>
                    <Ionicons name="map-outline" size={20} color="#3498db" />
                    <Text style={[styles.actionText, { color: '#3498db' }]}>Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                    <Ionicons name="create-outline" size={20} color="#f39c12" />
                    <Text style={[styles.actionText, { color: '#f39c12' }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// Styles for the card component
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        padding: 16,
    },
    cardImage: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#eee',
    },
    cardContent: {
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    categoryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: '#6A5AE0',
        textTransform: 'capitalize',
        lineHeight: 20, // <-- ADDED: Fix for text cutoff
    },
    statusBadge: {
        borderRadius: 8,
        paddingHorizontal: 10, // Increased padding
        paddingVertical: 4,   // Increased padding
        marginLeft: 8,
    },
    statusText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        textTransform: 'capitalize',
        lineHeight: 16, // <-- ADDED: Fix for text cutoff
    },
    cardTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        color: '#2d3436',
        marginBottom: 4,
    },
    cardDescription: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#636e72',
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    addressText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#636e72',
        marginLeft: 4,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6, // Increased padding
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: '#F4F7FF',
        marginRight: 8,
    },
    actionText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        marginLeft: 4,
        lineHeight: 18, // <-- ADDED: Fix for text cutoff
    },
});

export default ReportCard;