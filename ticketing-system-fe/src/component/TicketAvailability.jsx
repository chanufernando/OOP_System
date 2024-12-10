// src/components/TicketAvailability.jsx
import React, { useState, useEffect } from "react";
import { useSystem } from "../context/SystemContext";

const TicketAvailability = () => {
  const { isSystemRunning } = useSystem();
  const [ticketData, setTicketData] = useState({
    available: 0,
    total: 0,
    reserved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState({
    numberOfTickets: 1,
    name: "",
    email: "",
    phone: "",
  });
  const [bookingStatus, setBookingStatus] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTicketData((prevData) => ({
        ...prevData,
        available: data.availableTickets,
      }));
      setLoading(false);
    };

    fetchTicketData();

    return () => ws.close();
  }, []);

  const fetchTicketData = async () => {
    try {
      const response = await fetch(
        "http://localhost:3001/api/tickets/available"
      );
      if (!response.ok) throw new Error("Failed to fetch ticket data");
      const data = await response.json();
      setTicketData(data);
      setError(null);
    } catch (err) {
      setError("Failed to load ticket information");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBooking((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setIsBooking(true);
    setBookingStatus(null);

    try {
      const response = await fetch("http://localhost:3001/api/tickets/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numberOfTickets: parseInt(booking.numberOfTickets),
          userDetails: {
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setBookingStatus({
        type: "success",
        message: `Successfully booked ${booking.numberOfTickets} ticket(s)`,
      });

      // Reset form
      setBooking({
        numberOfTickets: 1,
        name: "",
        email: "",
        phone: "",
      });

      // Refresh ticket data
      fetchTicketData();
    } catch (error) {
      setBookingStatus({
        type: "error",
        message: error.message,
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="ticket-dashboard">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading ticket information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-dashboard">
      <div className="ticket-header">
        <h2 className="ticket-title">Ticket Availability</h2>
        <p className="ticket-subtitle">Book your tickets now</p>
      </div>

      <div className="ticket-counter">
        <div className="ticket-count">{ticketData.available}</div>
        <div className="ticket-label">Available Tickets</div>
      </div>

      <div className="ticket-status">
        <div className="status-item">
          <div className="status-value">{ticketData.total}</div>
          <div className="status-label">Total Tickets</div>
        </div>
        <div className="status-item">
          <div className="status-value">{ticketData.reserved}</div>
          <div className="status-label">Reserved</div>
        </div>
      </div>

      <div className="booking-section">
        <form onSubmit={handleBooking} className="booking-form">
          <div className="form-row">
            <label className="form-label">Number of Tickets</label>
            <input
              type="number"
              name="numberOfTickets"
              min="1"
              max={ticketData.available}
              value={booking.numberOfTickets}
              onChange={handleInputChange}
              className={
                !isSystemRunning ? "form-input disabled-content" : "form-input"
              }
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              value={booking.name}
              onChange={handleInputChange}
              className={
                !isSystemRunning ? "form-input disabled-content" : "form-input"
              }
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={booking.email}
              onChange={handleInputChange}
              className={
                !isSystemRunning ? "form-input disabled-content" : "form-input"
              }
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="phone"
              value={booking.phone}
              onChange={handleInputChange}
              className={
                !isSystemRunning ? "form-input disabled-content" : "form-input"
              }
              required
            />
          </div>

          <button
            type="submit"
            className={
              !isSystemRunning ? "book-button disabled-content" : "book-button"
            }
            disabled={isBooking || ticketData.available === 0}
          >
            {isBooking ? "Booking..." : "Book Tickets"}
          </button>
        </form>

        {bookingStatus && (
          <div className={`booking-${bookingStatus.type}`}>
            {bookingStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketAvailability;
