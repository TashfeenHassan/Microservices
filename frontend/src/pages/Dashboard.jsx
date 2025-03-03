import { useState, useEffect } from "react";
import { getUserProfile, getBookings, createBooking, getEvents, getNotifications } from "../api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user"));

    if (userData) {
      setUser(userData);
        
      getUserProfile(token, userData.id).then((res) => setUser(res.data));
      getEvents().then((res) => setEvents(res.data));
      getBookings(token, userData.id).then((res) => {
        console.log("User Bookings:", res.data);
        setBookings(res.data);
      });
      getNotifications(userData.id).then((res) => setNotifications(res.data));
    }
  }, []);
  
  const handleBooking = async () => {
    const token = localStorage.getItem("token");
    try {
      await createBooking(token, { user_id: user.id, event_id: selectedEvent });
      alert("Booking Successful!");
      getBookings(token).then((res) => setBookings(res.data)); 
      getNotifications(user.id).then((res) => setNotifications(res.data)); 
    } catch (err) {
      alert("Error booking event.");
    }
  };

  return (
    <div className="container mt-5">
      {user && <h2>Welcome, {user.name}!</h2>}

      {/* 🔹 Display Available Events */}
      <h3 className="mt-4">Available Events</h3>
      <ul className="list-group">
        {events.map((event) => (
          <li key={event.id} className="list-group-item d-flex justify-content-between">
            {event.name} - {event.date} ({event.location})
            <button
              className="btn btn-primary"
              onClick={() => setSelectedEvent(event.id)}
            >
              Select
            </button>
          </li>
        ))}
      </ul>

      {/* 🔹 Book Selected Event */}
      {selectedEvent && (
        <div className="mt-3">
          <button className="btn btn-success" onClick={handleBooking}>
            Book Event ID: {selectedEvent}
          </button>
        </div>
      )}

      {/* 🔹 Display User Bookings */}
      <h3 className="mt-4">Your Bookings</h3>
      <ul className="list-group">
        {bookings.map((booking) => (
          <li key={booking.id} className="list-group-item">
            Event ID: {booking.event_id} - Status: {booking.status}
          </li>
        ))}
      </ul>

      {/* 🔹 Display Notifications */}
      <h3 className="mt-4">Your Notifications</h3>
      <ul className="list-group">
        {notifications.map((notification) => (
          <li key={notification.id} className="list-group-item">
            {notification.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
