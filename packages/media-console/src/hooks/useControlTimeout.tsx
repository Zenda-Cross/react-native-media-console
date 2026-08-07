import {Dispatch, SetStateAction, useCallback, useEffect, useRef} from 'react';

interface ControlTimeoutProps {
  controlTimeoutDelay: number;
  mounted: boolean;
  showControls: boolean;
  setShowControls: Dispatch<SetStateAction<boolean>>;
  alwaysShowControls: boolean;
}

export const useControlTimeout = ({
  controlTimeoutDelay,
  mounted,
  showControls,
  setShowControls,
  alwaysShowControls,
}: ControlTimeoutProps) => {
  const controlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearControlTimeout = useCallback(() => {
    if (controlTimeoutRef.current) {
      clearTimeout(controlTimeoutRef.current);
      controlTimeoutRef.current = null;
    }
  }, []);

  const hideControls = useCallback(() => {
    if (mounted && showControls && !alwaysShowControls) {
      setShowControls(false);
    }
  }, [alwaysShowControls, mounted, setShowControls, showControls]);

  const setControlTimeout = useCallback(() => {
    clearControlTimeout();
    if (showControls && !alwaysShowControls) {
      controlTimeoutRef.current = setTimeout(
        hideControls,
        controlTimeoutDelay,
      );
    }
  }, [
    alwaysShowControls,
    clearControlTimeout,
    controlTimeoutDelay,
    hideControls,
    showControls,
  ]);

  const resetControlTimeout = setControlTimeout;

  useEffect(() => {
    setControlTimeout();
    return clearControlTimeout;
  }, [clearControlTimeout, setControlTimeout]);

  return {
    clearControlTimeout,
    resetControlTimeout,
    hideControls,
    setControlTimeout,
  };
};
