import { lazy } from 'react';

// Lazy load React Confetti to reduce initial bundle size
export const LazyConfetti = lazy(() => import('react-confetti'));

// Confetti loading fallback
export const ConfettiLoader = () => null; // Confetti is decorative, no loader needed