import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop handles scroll restoration.
 * On a PUSH navigation, it scrolls to the top of the window.
 * On a POP navigation (Back/Forward), it lets the browser restore the position.
 */
export default function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === 'PUSH' || navType === 'REPLACE') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navType]);

  return null;
}
