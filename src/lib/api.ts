import axios from "axios"

// Create axios instance with default config
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Get the auth token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Attempt to refresh the token
        const refreshToken = localStorage.getItem("refresh_token")
        const { data } = await axios.post("/api/auth/refresh", { refreshToken })
        
        // Store the new tokens
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("refresh_token", data.refreshToken)
        
        // Update the failed request with new token and retry
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return api(originalRequest)
      } catch (error) {
        // If refresh fails, redirect to login
        localStorage.removeItem("auth_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
) 