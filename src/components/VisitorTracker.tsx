import { useEffect } from 'react';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

export const VisitorTracker = () => {
  useVisitorTracking();
  return null;
};
