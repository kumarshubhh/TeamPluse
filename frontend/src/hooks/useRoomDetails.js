import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client.js';
import endpoints from '../api/endpoints.js';

export function useRoomDetails(roomId) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(endpoints.rooms.details(roomId));
      setDetails(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { details, loading, error, fetchDetails };
}

