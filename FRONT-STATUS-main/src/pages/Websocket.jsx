import { useEffect } from "react";

// WebSocket service to broadcast updates and receive service status changes
const WebSocketService = ({ url, setServices }) => {
  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("WebSocket connection established.");
    };

    socket.onmessage = (event) => {
      try {
        const serviceUpdate = JSON.parse(event.data);
        console.log("Received service update:", serviceUpdate);

        // Update the services state with the new service status
        setServices((prevServices) => {
          return prevServices.map((service) =>
            service.id === serviceUpdate.service_id
              ? { ...service, status: serviceUpdate.status }
              : service
          );
        });
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    // Cleanup WebSocket connection when component is unmounted
    return () => {
      socket.close();
    };
  }, [url, setServices]);

  return null; // This component doesn't render anything, it just handles the WebSocket logic
};

export default WebSocketService;