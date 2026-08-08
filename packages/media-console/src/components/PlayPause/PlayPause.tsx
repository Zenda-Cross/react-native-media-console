// @ts-nocheck
import React, {createRef} from 'react';
import {Platform, TouchableHighlight} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Svg, {G, Path, Rect} from 'react-native-svg';
import {Control} from '../Control';
import {NullControl} from '../NullControl';
import type {VideoAnimations} from '../../types';
import {styles} from './styles';
import {Loader} from '@8man/react-native-media-console/src/components/Loader';

export const playPauseRef = createRef<TouchableHighlight>();

interface PlayPauseProps {
  animations: VideoAnimations;
  disablePlayPause: boolean;
  disableSeekButtons: boolean;
  paused: boolean;
  // pauseLabel: boolean;
  buffering: boolean;
  togglePlayPause: () => void;
  resetControlTimeout: () => void;
  showControls: boolean;
  onPressForward: () => void;
  onPressRewind: () => void;
  primaryColor: string;
}

const SeekTenIcon = ({
  direction,
  size = 54,
  color = 'white',
}: {
  direction: 'backward' | 'forward';
  size?: number;
  color?: string;
}) => {
  const transform =
    direction === 'backward' ? 'translate(64 0) scale(-1 1)' : undefined;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 68"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round">
      <G opacity={0.72}>
        <G transform={transform}>
          <Path d="M30.1 12.52A25.5 25.5 0 1 0 54 26.03" />
          <Path d="m25 5.5 8 7-8 7m8.5-15L40 12l-6.5 7.5" />
        </G>
        <Path d="M24 44.5v-15l-3.5 2.7" />
        <Rect x="31" y="29.5" width="11" height="16" rx="5.5" />
      </G>
    </Svg>
  );
};

export const PlayPause = ({
  animations: {AnimatedView, ...animations},
  disablePlayPause,
  disableSeekButtons,
  paused,
  // pauseLabel,
  buffering,
  togglePlayPause,
  resetControlTimeout,
  showControls,
  onPressForward,
  onPressRewind,
  primaryColor,
}: PlayPauseProps) => {
  const animatedStyles = {
    zIndex: showControls ? 99999 : 0,
  };

  if (disablePlayPause) {
    return <NullControl />;
  }

  return (
    <AnimatedView
      pointerEvents={'box-none'}
      style={[styles.container, animatedStyles, animations.controlsOpacity]}>
      {!disableSeekButtons ? (
        <Control
          disabled={!showControls}
          callback={onPressRewind}
          resetControlTimeout={resetControlTimeout}>
          <SeekTenIcon direction="backward" />
        </Control>
      ) : null}
      <Control
        disabled={!showControls}
        callback={togglePlayPause}
        resetControlTimeout={resetControlTimeout}
        style={styles.playContainer}
        controlRef={playPauseRef}
        {...(Platform.isTV ? {hasTVPreferredFocus: showControls} : {})}>
        {buffering ? (
          <Loader color={primaryColor} />
        ) : (
          <MaterialIcons
            name={paused ? 'play-arrow' : 'pause'}
            size={70}
            color="rgba(255,255,255,0.94)"
          />
        )}
      </Control>
      {!disableSeekButtons ? (
        <Control
          disabled={!showControls}
          callback={onPressForward}
          resetControlTimeout={resetControlTimeout}>
          <SeekTenIcon direction="forward" />
        </Control>
      ) : null}
    </AnimatedView>
  );
};
