// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    console.log(`[API_CALL] ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP error! status: ${response.status}`);
    }

    console.log(`[API_CALL] Response status: ${response.status}`, data);

    if (!response.ok) {
      const errorMsg = data.message || data.error || `HTTP error! status: ${response.status}`;
      console.error(`[API_CALL] Error ${response.status}:`, errorMsg);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // Handle connection errors with helpful messages
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_INTERNET_DISCONNECTED')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra xem backend đã được khởi động chưa (port 5000).');
    }
    
    // If it's already an Error object, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(error.message || 'An unknown error occurred');
  }
};

export { API_BASE_URL, getToken, apiCall };

