import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** Central navigation hook, kept so route controls share one consistent path. */
export default function useSmoothNavigate() {
  const navigate = useNavigate();
  return useCallback((to, options = {}) => navigate(to, options), [navigate]);
}
