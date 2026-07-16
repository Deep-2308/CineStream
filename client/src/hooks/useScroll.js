import { useState, useEffect } from 'react';

export function useScroll(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}
