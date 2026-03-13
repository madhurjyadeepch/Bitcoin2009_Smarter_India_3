import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Create a new Axios instance with a base URL
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// Use an interceptor to automatically add the token to every request
api.interceptors.request.use(
  async (config) => {
    // Get the token from secure storage
    const token = await SecureStore.getItemAsync("authToken");

    // If a token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
