import { useNavigate } from "react-router-dom";

export const TRANSITION_DELAY = 300;

export function useNavigateWithTransition() {
  const navigate = useNavigate();

  const navigateWithTransition = (to, options = {}) => {
    const { delay = TRANSITION_DELAY, replace = false } = options;
    
    if (typeof to === "number") {
      if (delay === 0) {
        navigate(to);
      } else {
        setTimeout(() => navigate(to), delay);
      }
      return;
    }
    
    if (delay === 0) {
      navigate(to, { replace });
    } else {
      setTimeout(() => {
        navigate(to, { replace });
      }, delay);
    }
  };

  return navigateWithTransition;
}