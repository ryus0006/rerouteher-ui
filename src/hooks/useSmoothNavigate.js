import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** Shared navigation hook used by route controls. */
export default function useSmoothNavigate() {
  const navigate = useNavigate();
  return useCallback((to, options = {}) => navigate(to, options), [navigate]);
}
