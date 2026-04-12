import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function apiCall(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('aria_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });
  return response;
}
