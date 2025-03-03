import axios from "axios";

const API_BASE_URL = "http://localhost:8001"; // User Service
const BOOKING_API_URL = "http://localhost:8002"; // Booking Service
const EVENT_API_URL = "http://localhost:8003"; // Event Service
const NOTIFICATION_API_URL = "http://localhost:8004"; // Notification Service

// 🔹 Authentication
export const registerUser = (userData) =>
  axios.post(`${API_BASE_URL}/register`, userData);

export const loginUser = (credentials) =>
  axios.post(`${API_BASE_URL}/login`, credentials);

export const getUserProfile = (token, userId) =>
  axios.get(`${API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// 🔹 Bookings
export const createBooking = (token, bookingData) =>
  axios.post(`${BOOKING_API_URL}/bookings`, bookingData, {
    headers: { Authorization: `Bearer ${token}` },
  });

  export const getBookings = (token, userId) =>
    axios.get(`http://localhost:8002/bookings/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  

// 🔹 Events
export const getEvents = () =>
  axios.get(`${EVENT_API_URL}/events`);

// 🔹 Notifications
export const getNotifications = (userId) =>
  axios.get(`${NOTIFICATION_API_URL}/notifications/${userId}`);
