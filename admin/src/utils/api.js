import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:3000/api/v1",
});

// Use an interceptor to dynamically add the token to every request.
// This ensures the token is read fresh each time, even after login.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt");
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
