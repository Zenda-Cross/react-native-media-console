import {
  View,
  Text,
  Pressable,
  GestureResponderEvent,
  Dimensions,
} from 'react-native';
import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  useSharedValue,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
//@ts-ignore
import Icon from '@expo/vector-icons/MaterialIcons';
import SystemSetting from 'react-native-system-setting';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

type GesturesProps = {
  forward: (time?: number) => void;
  rewind: (time?: number) => void;
  togglePlayPause: () => void;
  seekerWidth: number;
  doubleTapTime: number;
  toggleControls: () => void;
  tapActionTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
  tapAnywhereToPause: boolean;
  rewindTime: number;
  showControls: boolean;
  disableGesture: boolean;
};

const SWIPE_RANGE = 370;

const Ripple = React.memo(
  ({
    visible,
    isLeft,
    totalTime,
    showControls,
  }: {
    visible: boolean;
    isLeft: boolean;
    totalTime: number;
    showControls: boolean;
  }) => {
    const screenDimensions = useMemo(() => Dimensions.get('window'), []);
    const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = screenDimensions;

    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
      if (visible) {
        scale.value = withSequence(
          withTiming(1.5, {duration: 400}),
          withDelay(
            400,
            withTiming(0, {
              duration: 400,
            }),
          ),
        );
        opacity.value = withSequence(
          withTiming(0.4, {duration: 400}),
          withDelay(
            400,
            withTiming(0, {
              duration: 400,
            }),
          ),
        );
      }
    }, [visible, scale, opacity]);

    const rippleStyle = useAnimatedStyle(
      () => ({
        opacity: opacity.value,
        //@ts-ignore
        transform: [{scale: scale.value}],
      }),
      [],
    );

    const containerStyle = useMemo(
      () => ({
        position: 'absolute' as const,
        top: showControls ? -70 : -45,
        left: isLeft ? ('-10%' as const) : undefined,
        right: isLeft ? undefined : ('-10%' as const),
        width: SCREEN_WIDTH / 2.5,
        height: SCREEN_HEIGHT,
        zIndex: 999,
      }),
      [showControls, isLeft, SCREEN_WIDTH, SCREEN_HEIGHT],
    );

    const innerStyle = useMemo(
      () => ({
        position: 'absolute' as const,
        width: '100%' as const,
        height: '100%' as const,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderRadius: SCREEN_HEIGHT / 2,
      }),
      [SCREEN_HEIGHT],
    );

    const textStyle = useMemo(
      () => ({
        color: 'white',
        marginTop: 8,
        fontSize: 12,
      }),
      [],
    );

    return visible ? (
      <View style={containerStyle as any}>
        <Animated.View style={[innerStyle, rippleStyle]}>
          <Icon
            name={isLeft ? 'fast-rewind' : 'fast-forward'}
            size={28}
            color="white"
          />
          {!isNaN(totalTime) && totalTime > 0 && (
            <Text style={textStyle}>{Math.floor(totalTime)}s</Text>
          )}
        </Animated.View>
      </View>
    ) : null;
  },
);

const Gestures = ({
  forward,
  rewind,
  togglePlayPause,
  toggleControls,
  doubleTapTime,
  tapActionTimeout,
  tapAnywhereToPause,
  rewindTime = 10,
  showControls,
  disableGesture,
}: GesturesProps) => {
  const [rippleVisible, setRippleVisible] = useState(false);
  const [isLeftRipple, setIsLeftRipple] = useState(false);
  const [totalSkipTime, setTotalSkipTime] = useState(0);
  const [displayVolume, setDisplayVolume] = useState(0);
  const [displayBrightness, setDisplayBrightness] = useState(0);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const [isBrightnessVisible, setIsBrightnessVisible] = useState(false);

  // Memoize screen dimensions
  const screenDimensions = useMemo(() => Dimensions.get('window'), []);
  const {width: SCREEN_WIDTH} = screenDimensions;

  // Refs
  const initialTapPosition = useRef({x: 0, y: 0});
  const isDoubleTapRef = useRef(false);
  const currentSideRef = useRef<'left' | 'right' | null>(null);
  const tapCountRef = useRef(0);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef(0);
  const originalSettings = useRef({
    volume: 0,
    brightness: 0,
  });

  // Shared values
  const volumeValue = useSharedValue(0);
  const brightnessValue = useSharedValue(0);
  const startVolume = useSharedValue(0);
  const startBrightness = useSharedValue(0);

  const resetState = useCallback(() => {
    isDoubleTapRef.current = false;
    currentSideRef.current = null;
    tapCountRef.current = 0;
    lastTapTimeRef.current = 0;
    setTotalSkipTime(0);
    setRippleVisible(false);
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
  }, []);

  const handleSkip = useCallback(async () => {
    try {
      const count = Number(tapCountRef.current) - 1;
      const baseTime = Number(rewindTime);
      const skipTime = baseTime * count;

      if (!isNaN(skipTime) && skipTime > 0) {
        if (currentSideRef.current === 'left') {
          rewind(skipTime);
        } else if (currentSideRef.current === 'right') {
          forward(skipTime);
        }
      }
    } catch (error) {
      console.error('Error while skipping:', error);
    } finally {
      resetState();
    }
  }, [rewindTime, rewind, forward, resetState]);

  const handleTap = useCallback(
    (e: GestureResponderEvent, side: 'left' | 'right') => {
      const now = Date.now();
      const touchX = e.nativeEvent.locationX;
      const touchY = e.nativeEvent.locationY;

      if (now - lastTapTimeRef.current > 500) {
        resetState();
      }

      if (!isDoubleTapRef.current) {
        isDoubleTapRef.current = true;
        initialTapPosition.current = {x: touchX, y: touchY};
        currentSideRef.current = side;
        tapCountRef.current = 1;
        lastTapTimeRef.current = now;

        tapActionTimeout.current = setTimeout(() => {
          if (tapAnywhereToPause) {
            togglePlayPause();
          } else {
            toggleControls();
          }
          resetState();
        }, doubleTapTime);
      } else {
        if (tapActionTimeout.current) {
          clearTimeout(tapActionTimeout.current);
          tapActionTimeout.current = null;
        }

        if (currentSideRef.current === side) {
          tapCountRef.current += 1;
          lastTapTimeRef.current = now;

          const count = Number(tapCountRef.current) - 1;
          const baseTime = Number(rewindTime);
          const newSkipTime = baseTime * count;

          setTotalSkipTime(newSkipTime);
          setRippleVisible(true);
          setIsLeftRipple(side === 'left');

          if (skipTimeoutRef.current) {
            clearTimeout(skipTimeoutRef.current);
          }
          skipTimeoutRef.current = setTimeout(handleSkip, 500);
        } else {
          resetState();
          isDoubleTapRef.current = true;
          initialTapPosition.current = {x: touchX, y: touchY};
          currentSideRef.current = side;
          tapCountRef.current = 1;
          lastTapTimeRef.current = now;

          tapActionTimeout.current = setTimeout(() => {
            resetState();
          }, doubleTapTime);
        }
      }
    },
    [
      resetState,
      tapAnywhereToPause,
      togglePlayPause,
      toggleControls,
      doubleTapTime,
      rewindTime,
      handleSkip,
    ],
  );

  const updateSystemVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    SystemSetting.setVolume(clampedVolume);
    setDisplayVolume(clampedVolume);
  }, []);

  const updateSystemBrightness = useCallback((newBrightness: number) => {
    const clampedBrightness = Math.max(0, Math.min(1, newBrightness));
    SystemSetting.setAppBrightness(clampedBrightness);
    setDisplayBrightness(clampedBrightness);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(10) // Minimum distance before gesture starts
        .onStart((event) => {
          'worklet';
          const isLeftSide = event.x < SCREEN_WIDTH / 2;

          if (isLeftSide) {
            startBrightness.value = brightnessValue.value;
            runOnJS(setIsBrightnessVisible)(true);
          } else {
            startVolume.value = volumeValue.value;
            runOnJS(setIsVolumeVisible)(true);
          }
        })
        .onUpdate((event) => {
          'worklet';
          const isLeftSide = event.x < SCREEN_WIDTH / 2;
          const change = -event.translationY / SWIPE_RANGE;

          if (isLeftSide) {
            // Brightness control
            const newBrightness = Math.max(
              0,
              Math.min(1, startBrightness.value + change),
            );
            brightnessValue.value = newBrightness;
            runOnJS(updateSystemBrightness)(newBrightness);
          } else {
            // Volume control
            const newVolume = Math.max(
              0,
              Math.min(1, startVolume.value + change),
            );
            volumeValue.value = newVolume;
            runOnJS(updateSystemVolume)(newVolume);
          }
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(setIsVolumeVisible)(false);
          runOnJS(setIsBrightnessVisible)(false);
        }),
    [SCREEN_WIDTH, updateSystemBrightness, updateSystemVolume],
  );

  const ControlOverlay = React.memo(
    ({
      value,
      isVisible,
      isVolume,
    }: {
      value: number;
      isVisible: boolean;
      isVolume: boolean;
    }) => {
      const containerStyle = useMemo(
        () => ({
          position: 'absolute' as const,
          top: '50%' as const,
          left: !isVolume ? undefined : ('15%' as const),
          right: !isVolume ? ('15%' as const) : undefined,
          transform: [
            {translateX: 0 as const},
            {translateY: showControls ? -20 : 0},
          ] as const,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 10,
          minWidth: 50,
          padding: 10,
          alignItems: 'center' as const,
          zIndex: 1000,
        }),
        [isVolume, showControls],
      );

      const textStyle = useMemo(
        () => ({
          color: 'white',
          marginTop: 5,
        }),
        [],
      );

      const iconName = useMemo(() => {
        if (isVolume) {
          return value === 0
            ? 'volume-mute'
            : value < 0.3
            ? 'volume-down'
            : 'volume-up';
        }
        return 'brightness-6';
      }, [isVolume, value]);

      if (!isVisible) return null;

      return (
        <Animated.View style={containerStyle as any}>
          <Icon name={iconName} size={24} color="white" />
          <Text style={textStyle}>{Math.round(value * 100)}</Text>
        </Animated.View>
      );
    },
  );

  // Initialize and store original settings
  useEffect(() => {
    let mounted = true;

    const initializeSettings = async () => {
      try {
        const [currentVolume, currentBrightness] = await Promise.all([
          SystemSetting.getVolume(),
          SystemSetting.getBrightness(),
        ]);

        if (mounted) {
          // Store original values
          originalSettings.current = {
            volume: currentVolume,
            brightness: currentBrightness,
          };

          // Set initial values
          volumeValue.value = currentVolume;
          brightnessValue.value = currentBrightness;
          setDisplayVolume(currentVolume);
          setDisplayBrightness(currentBrightness);

          console.log('Original settings stored:🔥', {
            volume: currentVolume,
            brightness: currentBrightness,
          });
        }
      } catch (error) {
        console.error('Error initializing settings:', error);
      }
    };

    initializeSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // Cleanup useEffect
  useEffect(() => {
    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
      if (tapActionTimeout.current) {
        clearTimeout(tapActionTimeout.current);
      }
    };
  }, []);

  // Initialize and store original settings
  useEffect(() => {
    let mounted = true;

    const initializeSettings = async () => {
      try {
        const [currentVolume, currentBrightness] = await Promise.all([
          SystemSetting.getVolume(),
          SystemSetting.getBrightness(),
        ]);

        if (mounted) {
          // Store original values
          originalSettings.current = {
            volume: currentVolume,
            brightness: currentBrightness,
          };

          // Set initial values
          volumeValue.value = currentVolume;
          brightnessValue.value = currentBrightness;
          setDisplayVolume(currentVolume);
          setDisplayBrightness(currentBrightness);

          console.log('Original settings stored:🔥', {
            volume: currentVolume,
            brightness: currentBrightness,
          });
        }
      } catch (error) {
        console.error('Error initializing settings:', error);
      }
    };

    initializeSettings();

    // Cleanup function
    // return () => {
    //   mounted = false;

    //   const resetSettings = async () => {
    //     try {
    //       //   console.log('Resetting to original settings:🔥', originalSettings.current);

    //       await Promise.all([
    //         // SystemSetting.setVolume(originalSettings.current.volume),
    //         SystemSetting.setAppBrightness(originalSettings.current.brightness),
    //       ]);

    //       //   console.log('Settings reset successfully');
    //     } catch (error) {
    //       console.error('Error resetting settings:', error);
    //     }
    //   };

    //   resetSettings();
    // };
  }, []);

  // Memoize container styles
  const containerStyle = useMemo(
    () => ({
      width: '100%' as const,
      height: '70%' as const,
    }),
    [],
  );

  const gestureContainerStyle = useMemo(
    () => ({
      position: 'relative' as const,
      width: '100%' as const,
      height: '100%' as const,
      flexDirection: 'row' as const,
    }),
    [],
  );

  const leftPressableStyle = useMemo(
    () => ({
      flex: 1,
      top: 40,
      height: '100%' as const,
      position: 'relative' as const,
    }),
    [],
  );

  const rightPressableStyle = useMemo(
    () => ({
      top: 40,
      flex: 1,
      height: '100%' as const,
      position: 'relative' as const,
    }),
    [],
  );

  // Memoized handler functions
  const handleLeftTap = useCallback(
    (e: GestureResponderEvent) => {
      handleTap(e, 'left');
    },
    [handleTap],
  );

  const handleRightTap = useCallback(
    (e: GestureResponderEvent) => {
      handleTap(e, 'right');
    },
    [handleTap],
  );

  if (disableGesture) {
    return null;
  }
  return (
    <GestureHandlerRootView style={containerStyle}>
      <GestureDetector gesture={panGesture}>
        <View style={gestureContainerStyle}>
          {/* Left side for brightness */}
          <Pressable onPress={handleLeftTap} style={leftPressableStyle}>
            <Ripple
              visible={rippleVisible && isLeftRipple}
              showControls={showControls}
              isLeft={true}
              totalTime={totalSkipTime}
            />
          </Pressable>

          {/* Right side for volume */}
          <Pressable onPress={handleRightTap} style={rightPressableStyle}>
            <Ripple
              visible={rippleVisible && !isLeftRipple}
              showControls={showControls}
              isLeft={false}
              totalTime={totalSkipTime}
            />
          </Pressable>
        </View>
      </GestureDetector>
      {/* Overlays */}
      <ControlOverlay
        value={displayVolume}
        isVisible={isVolumeVisible}
        isVolume={true}
      />
      <ControlOverlay
        value={displayBrightness}
        isVisible={isBrightnessVisible}
        isVolume={false}
      />
    </GestureHandlerRootView>
  );
};

export default Gestures;
