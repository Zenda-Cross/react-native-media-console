import React, {useCallback, useState, useEffect, useRef, useMemo} from 'react';
import {View} from 'react-native';
import Video, {
  OnLoadData,
  OnLoadStartData,
  OnProgressData,
  OnSeekData,
  ResizeMode,
  VideoRef,
} from 'react-native-video';
import {useControlTimeout, useJSAnimations, usePanResponders} from './hooks';
import {
  Error,
  Loader,
  TopControls,
  BottomControls,
  PlayPause,
  Overlay,
} from './components';
import {PlatformSupport} from './OSSupport';
import {_onBack} from './utils';
import {_styles} from './styles';
import type {VideoPlayerProps, WithRequiredProperty} from './types';
import Gestures from '@8man/react-native-media-console/src/components/Gestures';

const volumeWidth = 150;
const iconOffset = 0;

const AnimatedVideoPlayer = (
  props: WithRequiredProperty<VideoPlayerProps, 'animations'>,
) => {
  const {
    animations,
    toggleResizeModeOnFullscreen,
    doubleTapTime = 130,
    resizeMode = ResizeMode.CONTAIN,
    isFullscreen = false,
    showOnStart = false,
    showOnEnd = false,
    alwaysShowControls = false,
    paused = false,
    muted = false,
    volume = 1,
    title = {primary: '', secondary: ''},
    rate = 1,
    showDuration = false,
    showTimeRemaining = false,
    showHours = false,
    onSeek,
    onError,
    onBack,
    onEnd,
    onEnterFullscreen = () => {},
    onExitFullscreen = () => {},
    onHideControls = () => {},
    onShowControls = () => {},
    onPause,
    onPlay,
    onLoad,
    onLoadStart,
    onProgress,
    controlTimeoutDelay = 15000,
    tapAnywhereToPause = false,
    videoStyle = {},
    containerStyle = {},
    seekColor = '',
    source,
    disableBack = false,
    disableVolume = false,
    disableFullscreen = false,
    disableTimer = false,
    disableSeekbar = false,
    disablePlayPause = false,
    disableSeekButtons = false,
    disableOverlay,
    navigator,
    rewindTime = 15,
    pan: {horizontal: horizontalPan, inverted: invertedPan} = {},
    testID,
    disableGesture = false,
    hideAllControlls = false,
  } = props;

  const mounted = useRef(false);
  const _videoRef = useRef<VideoRef>(null);
  const controlTimeout = useRef<ReturnType<typeof setTimeout>>(
    setTimeout(() => {}),
  ).current;
  const tapActionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [_resizeMode, setResizeMode] = useState<ResizeMode>(resizeMode);
  const [_paused, setPaused] = useState<boolean>(paused);
  const [_muted, setMuted] = useState<boolean>(muted);
  const [_volume, setVolume] = useState<number>(volume);
  const [_isFullscreen, setIsFullscreen] = useState<boolean>(
    isFullscreen || resizeMode === 'cover' || false,
  );
  const [_showTimeRemaining, setShowTimeRemaining] =
    useState<boolean>(showTimeRemaining);
  const [volumeTrackWidth, setVolumeTrackWidth] = useState<number>(0);
  const [volumeFillWidth, setVolumeFillWidth] = useState<number>(0);
  const [seekerFillWidth, setSeekerFillWidth] = useState<number>(0);
  const [showControls, setShowControls] = useState(showOnStart);
  const [volumePosition, setVolumePositionState] = useState(0);
  const [seekerPosition, setSeekerPositionState] = useState(0);
  const [volumeOffset, setVolumeOffset] = useState(0);
  const [seekerOffset, setSeekerOffset] = useState(0);
  const [seekerWidth, setSeekerWidth] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [cachedDuration, setCachedDuration] = useState(0);
  const [cachedPosition, setCachedPosition] = useState(0);

  const videoRef = props.videoRef || _videoRef;

  const {clearControlTimeout, resetControlTimeout, setControlTimeout} =
    useControlTimeout({
      controlTimeout,
      controlTimeoutDelay,
      mounted: mounted.current,
      showControls,
      setShowControls,
      alwaysShowControls,
    });

  const toggleFullscreen = useCallback(
    () => setIsFullscreen((prevState) => !prevState),
    [],
  );
  const toggleControls = useCallback(
    () => setShowControls((prevState) => alwaysShowControls || !prevState),
    [alwaysShowControls],
  );
  const toggleTimer = useCallback(
    () => setShowTimeRemaining((prevState) => !prevState),
    [],
  );
  const togglePlayPause = useCallback(() => {
    setPaused((prevState) => !prevState);
  }, []);

  const styles = useMemo(
    () => ({
      videoStyle,
      containerStyle: containerStyle,
    }),
    [videoStyle, containerStyle],
  );

  const _onSeek = useCallback(
    (obj: OnSeekData) => {
      if (!seeking) {
        setControlTimeout();
      }
      setCurrentTime(obj.currentTime);
      console.log(obj);

      if (typeof onSeek === 'function') {
        onSeek(obj);
      }
    },
    [seeking, setControlTimeout, onSeek],
  );

  const _onEnd = useCallback(() => {
    if (currentTime < duration) {
      setCurrentTime(duration);
      setPaused(!props.repeat);

      if (showOnEnd) {
        setShowControls(!props.repeat);
      }
    }

    if (typeof onEnd === 'function') {
      onEnd();
    }
  }, [currentTime, duration, props.repeat, showOnEnd, onEnd]);

  const _onError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  const _onLoadStart = useCallback(
    (e: OnLoadStartData) => {
      setLoading(true);

      if (typeof onLoadStart === 'function') {
        onLoadStart(e);
      }
    },
    [onLoadStart],
  );

  const _onLoad = useCallback(
    (data: OnLoadData) => {
      setDuration(data.duration);
      setLoading(false);

      if (showControls) {
        setControlTimeout();
      }

      if (typeof onLoad === 'function') {
        onLoad(data);
      }
    },
    [showControls, setControlTimeout, onLoad],
  );

  const _onProgress = useCallback(
    (data: OnProgressData) => {
      setLoading(false);
      if (!seeking && !buffering) {
        setCurrentTime(data.currentTime);
        setCachedDuration(data.playableDuration);

        if (typeof onProgress === 'function') {
          onProgress(data);
        }
      }
    },
    [seeking, buffering, onProgress],
  );

  const _onScreenTouch = useCallback(() => {
    if (tapActionTimeout.current) {
      // This is a double tap - clear timeout and toggle fullscreen
      clearTimeout(tapActionTimeout.current);
      tapActionTimeout.current = null;
      toggleFullscreen();
      if (showControls) {
        resetControlTimeout();
      }
    } else {
      // This is a single tap - set timeout to handle single tap action
      tapActionTimeout.current = setTimeout(() => {
        if (tapAnywhereToPause && showControls) {
          togglePlayPause();
          resetControlTimeout();
        } else {
          toggleControls();
        }
        tapActionTimeout.current = null;
      }, doubleTapTime);
    }
  }, [
    toggleFullscreen,
    showControls,
    resetControlTimeout,
    tapAnywhereToPause,
    togglePlayPause,
    toggleControls,
    doubleTapTime,
  ]);

  const _onPlaybackRateChange = useCallback(
    (playBack: {playbackRate: number}) => {
      if (playBack.playbackRate === 0 && !buffering) {
        setTimeout(() => {
          !buffering && setPaused(true);
        });
      } else {
        setPaused(false);
      }
      console.log(playBack);
    },
    [buffering],
  );

  const events = useMemo(
    () => ({
      onError: onError || _onError,
      onBack: (onBack || _onBack(navigator)) as () => void,
      onEnd: _onEnd,
      onScreenTouch: _onScreenTouch,
      onEnterFullscreen,
      onExitFullscreen,
      onShowControls,
      onHideControls,
      onLoadStart: _onLoadStart,
      onProgress: _onProgress,
      onSeek: _onSeek,
      onLoad: _onLoad,
      onPause,
      onPlay,
      onPlaybackRateChange: _onPlaybackRateChange,
    }),
    [
      onError,
      _onError,
      onBack,
      navigator,
      _onEnd,
      _onScreenTouch,
      onEnterFullscreen,
      onExitFullscreen,
      onShowControls,
      onHideControls,
      _onLoadStart,
      _onProgress,
      _onSeek,
      _onLoad,
      onPause,
      onPlay,
      _onPlaybackRateChange,
    ],
  );

  const constrainToSeekerMinMax = useCallback(
    (val = 0) => {
      if (val <= 0) {
        return 0;
      } else if (val >= seekerWidth) {
        return seekerWidth;
      }
      return val;
    },
    [seekerWidth],
  );

  const constrainToVolumeMinMax = useCallback((val = 0) => {
    if (val <= 0) {
      return 0;
    } else if (val >= volumeWidth + 9) {
      return volumeWidth + 9;
    }
    return val;
  }, []);

  const setSeekerPosition = useCallback(
    (position = 0) => {
      const positionValue = constrainToSeekerMinMax(position);
      setSeekerPositionState(positionValue);
      setSeekerOffset(positionValue);
      setSeekerFillWidth(positionValue);
    },
    [constrainToSeekerMinMax],
  );

  const setVolumePosition = useCallback(
    (position = 0) => {
      const positionValue = constrainToVolumeMinMax(position);
      setVolumePositionState(positionValue + iconOffset);

      if (positionValue < 0) {
        setVolumeFillWidth(0);
      } else {
        setVolumeFillWidth(positionValue);
      }
    },
    [constrainToVolumeMinMax],
  );

  const {volumePanResponder, seekPanResponder} = usePanResponders({
    duration,
    seekerOffset,
    volumeOffset,
    loading,
    seekerWidth,
    seeking,
    seekerPosition,
    seek: videoRef?.current?.seek,
    clearControlTimeout,
    setVolumePosition,
    setSeekerPosition,
    setSeeking,
    setControlTimeout,
    onEnd: events.onEnd,
    horizontal: horizontalPan,
    inverted: invertedPan,
  });

  useEffect(() => {
    if (currentTime >= duration && duration > 0) {
      videoRef?.current?.seek(0);
    }
  }, [currentTime, duration, videoRef]);

  useEffect(() => {
    if (toggleResizeModeOnFullscreen) {
      setResizeMode(_isFullscreen ? ResizeMode.CONTAIN : ResizeMode.COVER);
    }

    if (mounted.current) {
      if (_isFullscreen) {
        typeof events.onEnterFullscreen === 'function' &&
          events.onEnterFullscreen();
      } else {
        typeof events.onExitFullscreen === 'function' &&
          events.onExitFullscreen();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_isFullscreen, toggleResizeModeOnFullscreen]);

  useEffect(() => {
    setIsFullscreen(isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    setPaused(paused);
  }, [paused]);

  useEffect(() => {
    if (_paused) {
      typeof events.onPause === 'function' && events.onPause();
    } else {
      typeof events.onPlay === 'function' && events.onPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_paused]);

  useEffect(() => {
    if (!seeking && currentTime && duration) {
      const percent = currentTime / duration;
      const position = seekerWidth * percent;
      const cachedPercent = cachedDuration / duration;
      const _cachedPosition = seekerWidth * cachedPercent;
      const newCachedPosition = constrainToSeekerMinMax(_cachedPosition);
      setCachedPosition(newCachedPosition);
      setSeekerPosition(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, seekerWidth, setSeekerPosition]);

  // set current time when seeking
  useEffect(() => {
    if (seeking && seekerPosition && seekerWidth && duration) {
      const percent = seekerPosition / seekerWidth;
      const newTime = duration * percent;
      setCurrentTime(newTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeking, seekerPosition]);

  useEffect(() => {
    if (showControls) {
      animations.showControlAnimation();
      setControlTimeout();
      typeof events.onShowControls === 'function' && events.onShowControls();
    } else {
      animations.hideControlAnimation();
      clearControlTimeout();
      typeof events.onHideControls === 'function' && events.onHideControls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showControls, loading]);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const newVolume = volumePosition / volumeWidth;

    if (newVolume <= 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }

    setVolume(newVolume);
    setVolumeOffset(volumePosition);

    const newVolumeTrackWidth = volumeWidth - volumeFillWidth;

    if (newVolumeTrackWidth > 150) {
      setVolumeTrackWidth(150);
    } else {
      setVolumeTrackWidth(newVolumeTrackWidth);
    }
  }, [volumeFillWidth, volumePosition]);

  useEffect(() => {
    const position = volumeWidth * _volume;
    setVolumePosition(position);
    setVolumeOffset(position);
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearControlTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rewind = useCallback(
    (time?: number) => {
      const newTime =
        typeof time === 'number'
          ? currentTime - time
          : currentTime - rewindTime;
      setCurrentTime(newTime);
      videoRef?.current?.seek(newTime);
    },
    [currentTime, rewindTime, videoRef],
  );

  const forward = useCallback(
    (time?: number) => {
      const newTime =
        typeof time === 'number'
          ? currentTime + time
          : currentTime + rewindTime;
      setCurrentTime(newTime);
      videoRef?.current?.seek(newTime);
    },
    [currentTime, rewindTime, videoRef],
  );

  // Memoize onBuffer callback
  const onBuffer = useCallback((e: {isBuffering: boolean}) => {
    setBuffering(e.isBuffering);
    if (!e.isBuffering) {
      setPaused(false);
    }
  }, []);

  // Memoize source URI for dependency comparison - use deep comparison for stability
  const sourceUri = useMemo(() => {
    if (!source) return null;
    if (typeof source === 'object' && 'uri' in source) {
      return source.uri;
    }
    if (typeof source === 'object') {
      // For other source objects, create a stable string representation
      return JSON.stringify(source);
    }
    return String(source);
  }, [source]);

  // Keep track of previous source to prevent unnecessary resets
  const prevSourceUri = useRef(sourceUri);
  const hasInitialized = useRef(false);

  // reset on url change - only reset if source actually changed and component has initialized
  useEffect(() => {
    if (
      hasInitialized.current &&
      sourceUri !== prevSourceUri.current &&
      sourceUri !== null
    ) {
      prevSourceUri.current = sourceUri;
      setLoading(true);
      setSeekerFillWidth(0);
      setSeekerPosition(0);
      setCachedPosition(0);
      setCurrentTime(0);
    } else if (!hasInitialized.current) {
      prevSourceUri.current = sourceUri;
      hasInitialized.current = true;
    }
  }, [sourceUri, setSeekerPosition]);

  return (
    <PlatformSupport
      showControls={showControls}
      containerStyles={styles.containerStyle}
      onScreenTouch={events.onScreenTouch}
      testID={testID}>
      <View style={[_styles.player.container, styles.containerStyle]}>
        <Video
          {...props}
          {...events}
          ref={videoRef || _videoRef}
          resizeMode={resizeMode}
          volume={_volume}
          paused={_paused}
          muted={_muted}
          rate={rate}
          style={[_styles.player.video, styles.videoStyle]}
          source={source}
          onBuffer={onBuffer}
        />
        {
          <>
            <Error error={error} />
            {!hideAllControlls && (
              <>
                {!disableOverlay && <Overlay animations={animations} />}
                <TopControls
                  title={title}
                  panHandlers={volumePanResponder.panHandlers}
                  animations={animations}
                  disableBack={disableBack}
                  disableVolume={disableVolume}
                  volumeFillWidth={volumeFillWidth}
                  volumeTrackWidth={volumeTrackWidth}
                  volumePosition={volumePosition}
                  onBack={events.onBack}
                  resetControlTimeout={resetControlTimeout}
                  showControls={showControls}
                />
                {loading ? (
                  <Loader color={seekColor} />
                ) : (
                  <PlayPause
                    animations={animations}
                    disablePlayPause={disablePlayPause}
                    disableSeekButtons={disableSeekButtons}
                    paused={_paused}
                    // pauseLabel={pauseLabel}
                    togglePlayPause={togglePlayPause}
                    resetControlTimeout={resetControlTimeout}
                    showControls={showControls}
                    onPressRewind={rewind}
                    onPressForward={forward}
                    buffering={buffering}
                    primaryColor={seekColor}
                  />
                )}
                <Gestures
                  forward={forward}
                  rewind={rewind}
                  togglePlayPause={togglePlayPause}
                  doubleTapTime={doubleTapTime}
                  seekerWidth={seekerWidth}
                  rewindTime={rewindTime}
                  toggleControls={toggleControls}
                  tapActionTimeout={tapActionTimeout}
                  tapAnywhereToPause={tapAnywhereToPause}
                  showControls={showControls}
                  disableGesture={disableGesture}
                />
                <BottomControls
                  animations={animations}
                  panHandlers={seekPanResponder.panHandlers}
                  disableTimer={disableTimer}
                  disableSeekbar={disableSeekbar}
                  showHours={showHours}
                  showDuration={showDuration}
                  paused={_paused}
                  showTimeRemaining={_showTimeRemaining}
                  currentTime={currentTime}
                  duration={duration}
                  seekColor={seekColor}
                  toggleTimer={toggleTimer}
                  resetControlTimeout={resetControlTimeout}
                  seekerFillWidth={seekerFillWidth}
                  seekerPosition={seekerPosition}
                  setSeekerWidth={setSeekerWidth}
                  cachedPosition={cachedPosition}
                  isFullscreen={isFullscreen}
                  disableFullscreen={disableFullscreen}
                  toggleFullscreen={toggleFullscreen}
                  showControls={showControls}
                />
              </>
            )}
          </>
        }
      </View>
    </PlatformSupport>
  );
};

const CustomAnimations = ({
  useAnimations,
  controlAnimationTiming = 450,
  ...props
}: WithRequiredProperty<VideoPlayerProps, 'useAnimations'>) => {
  const animations = useAnimations(controlAnimationTiming);
  return <AnimatedVideoPlayer animations={animations} {...props} />;
};

const JSAnimations = (props: VideoPlayerProps) => {
  const animations = useJSAnimations(props.controlAnimationTiming);

  return <AnimatedVideoPlayer animations={animations} {...props} />;
};

export const VideoPlayer = (props: Omit<VideoPlayerProps, 'animations'>) => {
  if (props?.useAnimations) {
    return <CustomAnimations useAnimations={props?.useAnimations} {...props} />;
  }

  return <JSAnimations {...props} />;
};
