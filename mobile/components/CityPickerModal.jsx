import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useCity } from '../context/CityContext';

export default function CityPickerModal({ visible, onClose }) {
    const { city, setCity, isDetecting } = useCity();
    const [availableCities, setAvailableCities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            const fetchCities = async () => {
                try {
                    setLoading(true);
                    const r = await api.get('/reports/cities');
                    setAvailableCities(r.data.data?.cities || []);
                } catch {
                } finally {
                    setLoading(false);
                }
            };
            fetchCities();
        }
    }, [visible]);

    const handleSelect = async (c) => {
        await setCity(c);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={s.overlay}>
                <View style={s.card}>
                    <View style={s.header}>
                        <Text style={s.title}>Select City</Text>
                        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                            <Ionicons name="close" size={24} color="#6B6B80" />
                        </TouchableOpacity>
                    </View>

                    {isDetecting || loading ? (
                        <View style={s.loadWrap}><ActivityIndicator color="#4F46E5" /></View>
                    ) : (
                        <ScrollView style={s.scroll}>
                            <TouchableOpacity style={[s.item, (!city || city === 'All Cities') && s.itemActive]} onPress={() => handleSelect('All Cities')}>
                                <Ionicons name="globe-outline" size={20} color={(!city || city === 'All Cities') ? "#4F46E5" : "#6B6B80"} />
                                <Text style={[s.itemText, (!city || city === 'All Cities') && s.itemTextActive]}>All Cities</Text>
                            </TouchableOpacity>

                            {availableCities.map(c => (
                                <TouchableOpacity key={c} style={[s.item, city === c && s.itemActive]} onPress={() => handleSelect(c)}>
                                    <Ionicons name="location-outline" size={20} color={city === c ? "#4F46E5" : "#6B6B80"} />
                                    <Text style={[s.itemText, city === c && s.itemTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    card: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '70%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#1A1A2E' },
    closeBtn: { padding: 4 },
    loadWrap: { height: 100, justifyContent: 'center', alignItems: 'center' },
    scroll: { marginBottom: 16 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4, gap: 12 },
    itemActive: { backgroundColor: '#EDE9FE' },
    itemText: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#6B6B80' },
    itemTextActive: { fontFamily: 'Poppins-SemiBold', color: '#4F46E5' },
});
