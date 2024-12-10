import { useState, useEffect } from "react";

export const useWebSocket = (url) => {
  const [ticketAvailability, setTicketAvailability] = useState(0);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTicketAvailability(data.availableTickets);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => ws.close();
  }, [url]);

  return { ticketAvailability };
};
