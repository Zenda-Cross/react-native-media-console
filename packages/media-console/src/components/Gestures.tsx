import {
  View,
  Text,
  Pressable,
  GestureResponderEvent,
  Dimensions,
} from 'react-native';
import React, {useState, useRef, useEffect} from 'react';
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

const Ripple = ({
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
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
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
  }, [visible]);

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    //@ts-ignore
    transform: [{scale: scale.value}],
  }));

  return visible ? (
    <View
      style={{
        position: 'absolute',
        top: showControls ? -70 : -45,
        left: isLeft ? '-10%' : undefined,
        right: isLeft ? undefined : '-10%',
        width: SCREEN_WIDTH / 2.5,
        height: SCREEN_HEIGHT,
        zIndex: 999,
      }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: SCREEN_HEIGHT / 2,
          },
          rippleStyle,
        ]}>
        <Icon
          name={isLeft ? 'fast-rewind' : 'fast-forward'}
          size={28}
          color="white"
        />
        {!isNaN(totalTime) && totalTime > 0 && (
          <Text style={{color: 'white', marginTop: 8, fontSize: 12}}>
            {Math.floor(totalTime)}s
          </Text>
        )}
      </Animated.View>
    </View>
  ) : null;
};

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
  // const [ripplePosition,setRipplePosition] = useState({x: 0, y: 0});
  const [isLeftRipple, setIsLeftRipple] = useState(false);
  const [totalSkipTime, setTotalSkipTime] = useState(0);
  const initialTapPosition = useRef({x: 0, y: 0});
  const isDoubleTapRef = useRef(false);
  const currentSideRef = useRef<'left' | 'right' | null>(null);
  const tapCountRef = useRef(0);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef(0);

  const {width: SCREEN_WIDTH} = Dimensions.get('window');

  const resetState = () => {
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
  };

  const handleSkip = async () => {
    try {
      const count = Number(tapCountRef.current) - 1;
      const baseTime = Number(rewindTime);
      const skipTime = baseTime * count;

      console.log('Skip calculation:', {
        count,
        baseTime,
        skipTime,
        side: currentSideRef.current,
        isValidNumber: !isNaN(skipTime) && skipTime > 0,
      });

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
  };

  const handleTap = (e: GestureResponderEvent, side: 'left' | 'right') => {
    const now = Date.now();
    const touchX = e.nativeEvent.locationX;
    const touchY = e.nativeEvent.locationY;

    console.log('Tap details:', {
      touchX,
      side,
      isDoubleTap: isDoubleTapRef.current,
      timeSinceLastTap: now - lastTapTimeRef.current,
    });

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

        console.log('Multiple tap calculation:', {
          count,
          baseTime,
          newSkipTime,
          tapCount: tapCountRef.current,
          side,
        });

        setTotalSkipTime(newSkipTime);
        setRippleVisible(true);
        // setRipplePosition(initialTapPosition.current);
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
  };

  React.useEffect(() => {
    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
      if (tapActionTimeout.current) {
        clearTimeout(tapActionTimeout.current);
      }
    };
  }, []);

  const volumeValue = useSharedValue(0);
  const brightnessValue = useSharedValue(0);
  const startVolume = useSharedValue(0);
  const startBrightness = useSharedValue(0);
  const [displayVolume, setDisplayVolume] = useState(0);
  const [displayBrightness, setDisplayBrightness] = useState(0);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const [isBrightnessVisible, setIsBrightnessVisible] = useState(false);

  // Store original values in refs to maintain latest values for cleanup
  const originalSettings = useRef({
    volume: 0,
    brightness: 0,
  });

  React.useEffect(() => {
    const initializeSettings = async () => {
      try {
        const currentVolume = await SystemSetting.getVolume();
        const currentBrightness = await SystemSetting.getBrightness();
        volumeValue.value = currentVolume;
        brightnessValue.value = currentBrightness;
        setDisplayVolume(currentVolume);
        setDisplayBrightness(currentBrightness);
      } catch (error) {
        console.error('Error initializing settings:', error);
      }
    };
    initializeSettings();
  }, []);

  const updateSystemVolume = React.useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    SystemSetting.setVolume(clampedVolume);
    setDisplayVolume(clampedVolume);
  }, []);

  const updateSystemBrightness = React.useCallback((newBrightness: number) => {
    const clampedBrightness = Math.max(0, Math.min(1, newBrightness));
    SystemSetting.setAppBrightness(clampedBrightness);
    setDisplayBrightness(clampedBrightness);
  }, []);

  const panGesture = Gesture.Pan()
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
        const newVolume = Math.max(0, Math.min(1, startVolume.value + change));
        volumeValue.value = newVolume;
        runOnJS(updateSystemVolume)(newVolume);
      }
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(setIsVolumeVisible)(false);
      runOnJS(setIsBrightnessVisible)(false);
    });

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
      if (!isVisible) return null;

      return (
        <Animated.View
          // @ts-ignore
          style={{
            position: 'absolute',
            top: '50%',
            left: !isVolume ? undefined : '15%',
            right: !isVolume ? '15%' : undefined,
            transform: [{translateX: 0}, {translateY: showControls ? -20 : 0}],
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 10,
            minWidth: 50,
            padding: 10,
            alignItems: 'center',
            zIndex: 1000,
          }}>
          <Icon
            name={
              isVolume
                ? value === 0
                  ? 'volume-mute'
                  : value < 0.3
                  ? 'volume-down'
                  : 'volume-up'
                : 'brightness-6'
            }
            size={24}
            color="white"
          />
          <Text style={{color: 'white', marginTop: 5}}>
            {Math.round(value * 100)}
          </Text>
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

  if (disableGesture) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{width: '100%', height: '70%'}}>
      <GestureDetector gesture={panGesture}>
        <View
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            flexDirection: 'row',
          }}>
          {/* Left side for brightness */}
          <Pressable
            onPress={(e) => handleTap(e, 'left')}
            style={{
              flex: 1,
              top: 40,
              height: '100%',
              position: 'relative',
            }}>
            <Ripple
              visible={rippleVisible && isLeftRipple}
              showControls={showControls}
              isLeft={true}
              totalTime={totalSkipTime}
            />
          </Pressable>

          {/* Right side for volume */}
          <Pressable
            onPress={(e) => handleTap(e, 'right')}
            style={{
              top: 40,
              flex: 1,
              height: '100%',
              position: 'relative',
            }}>
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
