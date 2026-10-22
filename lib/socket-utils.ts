/**
 * Socket.io utility functions for better error handling and diagnostics
 */

const defaultSocketUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002";

export const SOCKET_CONFIG = {
  url: defaultSocketUrl,
  options: {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    timeout: 5000,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    forceNew: true, // Prevent connection reuse issues
  }
};

export const logSocketEvent = (event: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`🔗 [${timestamp}] Socket ${event}:`, data || '');
};

export const handleSocketError = (error: Error) => {
  logSocketEvent('Error', error.message);

  // Common error types and suggestions
  if (error.message.includes('ECONNREFUSED')) {
    console.warn('💡 Socket server not running. Start the socket server on port 8080');
  } else if (error.message.includes('timeout')) {
    console.warn('💡 Socket connection timeout. Check server availability');
  } else if (error.message.includes('CORS')) {
    console.warn('💡 CORS error. Check socket server CORS configuration');
  }
};

export const checkSocketServerHealth = async (): Promise<boolean> => {
  try {
    // Try to fetch from socket.io health endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SOCKET_URL || defaultSocketUrl}/socket.io/`
    );
    return response.ok;
  } catch (error) {
    console.warn('Socket server health check failed:', error);
    return false;
  }
};
