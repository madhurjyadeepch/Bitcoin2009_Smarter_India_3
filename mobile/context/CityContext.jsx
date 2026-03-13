import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const CityContext = createContext();

export const CityProvider = ({ children }) => {
    const [city, setCity] = useState(null);
    const [isDetecting, setIsDetecting] = useState(true);

    const initCity = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem('@user_city');
            if (stored) {
                setCity(stored);
                setIsDetecting(false);
                return;
            }

            // Auto-detect if not stored
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                const geo = await Location.reverseGeocodeAsync(loc.coords);
                if (geo.length > 0) {
                    const detected = geo[0].city || geo[0].region || 'Unknown';
                    setCity(detected);
                    await AsyncStorage.setItem('@user_city', detected);
                } else {
                    setCity('All Cities');
                }
            } else {
                setCity('All Cities');
            }
        } catch {
            setCity('All Cities');
        } finally {
            setIsDetecting(false);
        }
    }, []);

    useEffect(() => {
        initCity();
    }, [initCity]);

    const changeCity = async (newCity) => {
        setCity(newCity);
        await AsyncStorage.setItem('@user_city', newCity || 'All Cities');
    };

    return (
        <CityContext.Provider value={{ city, setCity: changeCity, isDetecting }}>
            {children}
        </CityContext.Provider>
    );
};

export const useCity = () => useContext(CityContext);
