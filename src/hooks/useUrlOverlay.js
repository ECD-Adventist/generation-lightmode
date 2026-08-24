import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useUrlOverlay(key) {
  const location = useLocation();
  const navigate = useNavigate();
  const value = useMemo(() => new URLSearchParams(location.search).get(key), [location.search, key]);

  const open = useCallback((nextValue = "true") => {
    const params = new URLSearchParams(location.search);
    const normalized = String(nextValue);
    if (params.get(key) === normalized) return;
    params.set(key, normalized);
    const stack = Array.isArray(location.state?.overlayStack) ? location.state.overlayStack : [];
    navigate({ pathname: location.pathname, search: `?${params.toString()}`, hash: location.hash }, {
      state: { ...location.state, overlayStack: [...stack.filter(item => item !== key), key] },
    });
  }, [key, location, navigate]);

  const close = useCallback(() => {
    if (!value) return;
    const stack = Array.isArray(location.state?.overlayStack) ? location.state.overlayStack : [];
    if (stack[stack.length - 1] === key) {
      navigate(-1);
      return;
    }
    const params = new URLSearchParams(location.search);
    params.delete(key);
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "", hash: location.hash }, {
      replace: true,
      state: { ...location.state, overlayStack: stack.filter(item => item !== key) },
    });
  }, [key, location, navigate, value]);

  const clearInvalid = useCallback(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has(key)) return;
    params.delete(key);
    const stack = Array.isArray(location.state?.overlayStack) ? location.state.overlayStack : [];
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "", hash: location.hash }, {
      replace: true,
      state: { ...location.state, overlayStack: stack.filter(item => item !== key) },
    });
  }, [key, location, navigate]);

  return { value, isOpen: value !== null, open, close, clearInvalid };
}