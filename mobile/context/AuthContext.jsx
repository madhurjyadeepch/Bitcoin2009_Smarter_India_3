import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUserFromStorage = async () => {
            try {
                const token = await SecureStore.getItemAsync('authToken');
                const storedUser = await AsyncStorage.getItem('user');

                if (token && storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Failed to load user session", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUserFromStorage();
    }, []);

    const login = async (userData, token) => {
        try {
            setUser(userData);
            // If token is provided, update it. Otherwise keep existing.
            if (token) {
                await SecureStore.setItemAsync('authToken', token);
            }
            await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
            console.error("Failed to save user session", e);
        }
    };

    const logout = async () => {
        try {
            setUser(null);
            await SecureStore.deleteItemAsync('authToken');
            await AsyncStorage.removeItem('user');
        } catch (e) {
            console.error("Failed to clear user session", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};