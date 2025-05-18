import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie'

const api: AxiosInstance = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    timeout: 5000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// Request interceptor
api.interceptors.request.use((config) => {
    const token = Cookies.get('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Remove the expired token
            Cookies.remove('token')
            
            // Redirect to login page
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api;