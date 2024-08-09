// @ts-nocheck
import React, {createRef} from 'react';
import {
  Image,
  Platform,
  TouchableHighlight,
  TouchableOpacity,
} from 'react-native';
import {Control} from '../Control';
import {NullControl} from '../NullControl';
import type {VideoAnimations} from '../../types';
import {styles} from './styles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {FontAwesome6} from '@expo/vector-icons';

export const playPauseRef = createRef<TouchableHighlight>();

interface PlayPauseProps {
  animations: VideoAnimations;
  disablePlayPause: boolean;
  disableSeekButtons: boolean;
  paused: boolean;
  togglePlayPause: () => void;
  resetControlTimeout: () => void;
  showControls: boolean;
  onPressForward: () => void;
  onPressRewind: () => void;
}

const play = require('../../assets/img/play.png');
const pause = require('../../assets/img/pause.png');
const rewind = require('../../assets/img/rewind.png');
const forward = require('../../assets/img/forward.png');

export const PlayPause = ({
  animations: {AnimatedView, ...animations},
  disablePlayPause,
  disableSeekButtons,
  paused,
  togglePlayPause,
  resetControlTimeout,
  showControls,
  onPressForward,
  onPressRewind,
}: PlayPauseProps) => {
  let source = paused ? play : pause;

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
          <TouchableOpacity onPress={onPressRewind}>
            <MaterialIcons name="replay-10" size={70} color="white" />
          </TouchableOpacity>
        </Control>
      ) : null}
      <Control
        disabled={!showControls}
        callback={togglePlayPause}
        resetControlTimeout={resetControlTimeout}
        style={styles.playContainer}
        controlRef={playPauseRef}
        {...(Platform.isTV ? {hasTVPreferredFocus: showControls} : {})}>
        <TouchableOpacity onPress={togglePlayPause}>
          <FontAwesome6
            name={paused ? 'play' : 'pause'}
            size={60}
            color="white"
          />
        </TouchableOpacity>
      </Control>
      {!disableSeekButtons ? (
        <Control
          disabled={!showControls}
          callback={onPressForward}
          resetControlTimeout={resetControlTimeout}>
          <TouchableOpacity onPress={onPressForward}>
            <MaterialIcons name="forward-10" size={70} color="white" />
          </TouchableOpacity>
        </Control>
      ) : null}
    </AnimatedView>
  );
};
