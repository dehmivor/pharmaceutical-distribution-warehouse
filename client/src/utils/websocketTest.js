// Utility function để test WebSocket connection
export const testWebSocketConnection = (backendUrl, recipientId) => {
  return new Promise((resolve) => {
    if (typeof WebSocket === 'undefined') {
      console.log('WebSocket not supported in this environment');
      resolve({ supported: false, connected: false });
      return;
    }

    let wsUrl;
    if (backendUrl.includes('localhost')) {
      wsUrl = backendUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    } else {
      wsUrl = backendUrl.replace('http://', 'wss://').replace('https://', 'wss://');
    }

    const wsEndpoint = `${wsUrl}/ws/notifications/${recipientId}`;
    console.log('Testing WebSocket connection to:', wsEndpoint);

    const testWs = new WebSocket(wsEndpoint);
    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (testWs.readyState === WebSocket.OPEN) {
        testWs.close();
      }
    };

    timeoutId = setTimeout(() => {
      console.log('WebSocket connection timeout');
      cleanup();
      resolve({ supported: true, connected: false, error: 'timeout' });
    }, 5000);

    testWs.onopen = () => {
      console.log('WebSocket test connection successful');
      cleanup();
      resolve({ supported: true, connected: true });
    };

    testWs.onerror = (error) => {
      console.log('WebSocket test connection failed:', error);
      cleanup();
      resolve({ supported: true, connected: false, error: 'connection_failed' });
    };

    testWs.onclose = (event) => {
      console.log('WebSocket test connection closed:', event.code, event.reason);
      cleanup();
      resolve({ supported: true, connected: false, error: 'connection_closed' });
    };
  });
};

// Function để check xem có nên sử dụng WebSocket hay không
export const shouldUseWebSocket = async (backendUrl, recipientId) => {
  try {
    const result = await testWebSocketConnection(backendUrl, recipientId);
    return result.supported && result.connected;
  } catch (error) {
    console.error('Error testing WebSocket:', error);
    return false;
  }
};
