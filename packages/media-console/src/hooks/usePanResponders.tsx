import {Dispatch, SetStateAction, useEffect, useRef} from 'react';
import {PanResponder} from 'react-native';

interface PanRespondersProps {
  duration: number;
  volumeOffset: number;
  loading: boolean;
  seekerPosition: number;
  seek?: (time: number, tolerance?: number) => void;
  seekerWidth: number;
  clearControlTimeout: () => void;
  setVolumePosition: (position: number) => void;
  setSeekerPosition: (position: number) => void;
  setSeeking: Dispatch<SetStateAction<boolean>>;
  setSeekSnapPosition: Dispatch<SetStateAction<number | null>>;
  setControlTimeout: () => void;
  onEnd: () => void;
  onSeekSnap?: () => void;
  horizontal?: boolean;
  inverted?: boolean;
}

export const usePanResponders = ({
  duration,
  volumeOffset,
  loading,
  seekerPosition,
  seek,
  seekerWidth,
  clearControlTimeout,
  setVolumePosition,
  setSeekerPosition,
  setSeeking,
  setSeekSnapPosition,
  setControlTimeout,
  onEnd,
  onSeekSnap,
  horizontal = true,
  inverted = false,
}: PanRespondersProps) => {
  const latestSeekerPosition = useRef(seekerPosition);
  const seekStartPosition = useRef(0);
  const dragStartPosition = useRef(0);
  const seekTrackPageOffset = useRef(0);
  const hasLeftStartPoint = useRef(false);
  const isSnappedToStart = useRef(false);

  const SNAP_ENTER_DISTANCE = 12;
  const SNAP_EXIT_DISTANCE = 24;

  useEffect(() => {
    latestSeekerPosition.current = seekerPosition;
  }, [seekerPosition]);

  const volumePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      clearControlTimeout();
    },
    onPanResponderMove: (_evt, gestureState) => {
      const diff = horizontal ? gestureState.dx : gestureState.dy;
      const position = volumeOffset + diff * (inverted ? -1 : 1);
      setVolumePosition(position);
    },
    onPanResponderRelease: () => {
      setControlTimeout();
    },
  });

  const seekPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setSeeking(true);
      clearControlTimeout();
      const localPointer = horizontal
        ? evt.nativeEvent.locationX
        : evt.nativeEvent.locationY;
      const pagePointer = horizontal
        ? evt.nativeEvent.pageX
        : evt.nativeEvent.pageY;
      // Keep a stable screen-space origin for the complete gesture. Android's
      // locationX/locationY can change coordinate frames when children are
      // added or rerendered while the responder is active (the seek preview is
      // one such child), which makes the thumb stop following the finger.
      seekTrackPageOffset.current = pagePointer - localPointer;
      const position = inverted ? seekerWidth - localPointer : localPointer;
      const playbackPosition = Math.max(
        0,
        Math.min(seekerWidth, latestSeekerPosition.current),
      );
      // The magnetic snap point represents where playback was when seeking
      // began. The touched position is only the initial position of the thumb.
      seekStartPosition.current = playbackPosition;
      dragStartPosition.current = position;
      hasLeftStartPoint.current = false;
      isSnappedToStart.current = false;
      setSeekSnapPosition(playbackPosition);
      latestSeekerPosition.current = position;
      setSeekerPosition(position);
    },
    onPanResponderMove: (_evt, gestureState) => {
      const pagePointer = horizontal ? gestureState.moveX : gestureState.moveY;
      const pointerPosition = pagePointer - seekTrackPageOffset.current;
      const fallbackDiff = horizontal ? gestureState.dx : gestureState.dy;
      const fallbackPosition =
        dragStartPosition.current + fallbackDiff * (inverted ? -1 : 1);
      const rawPosition = Number.isFinite(pointerPosition)
        ? inverted
          ? seekerWidth - pointerPosition
          : pointerPosition
        : fallbackPosition;
      const distanceFromStart = Math.abs(
        rawPosition - seekStartPosition.current,
      );

      if (
        !hasLeftStartPoint.current &&
        distanceFromStart >= SNAP_EXIT_DISTANCE
      ) {
        hasLeftStartPoint.current = true;
      }

      let position = rawPosition;
      if (hasLeftStartPoint.current) {
        if (isSnappedToStart.current) {
          if (distanceFromStart <= SNAP_EXIT_DISTANCE) {
            position = seekStartPosition.current;
          } else {
            isSnappedToStart.current = false;
          }
        } else if (distanceFromStart <= SNAP_ENTER_DISTANCE) {
          isSnappedToStart.current = true;
          position = seekStartPosition.current;
          onSeekSnap?.();
        }
      }

      latestSeekerPosition.current = position;
      setSeekerPosition(position);
      setSeeking(true);
    },
    onPanResponderRelease: () => {
      const constrainedPosition = Math.max(
        0,
        Math.min(seekerWidth, latestSeekerPosition.current),
      );
      const percent = seekerWidth > 0 ? constrainedPosition / seekerWidth : 0;
      const time = duration * percent;

      if (time >= duration && !loading) {
        if (typeof onEnd === 'function') {
          onEnd();
        }
      }

      setSeeking(false);
      setSeekSnapPosition(null);
      seek && seek(time);
      setControlTimeout();
    },
    onPanResponderTerminate: () => {
      const constrainedPosition = Math.max(
        0,
        Math.min(seekerWidth, latestSeekerPosition.current),
      );
      const percent = seekerWidth > 0 ? constrainedPosition / seekerWidth : 0;
      setSeeking(false);
      setSeekSnapPosition(null);
      seek && seek(duration * percent);
      setControlTimeout();
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  });

  return {volumePanResponder, seekPanResponder};
};
