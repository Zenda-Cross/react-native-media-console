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

const play = require('../../assets/img/playNew.png');
const pause = require('../../assets/img/pauseNew.png');
const rewind = require('../../assets/img/rewind10.png');
const forward = require('../../assets/img/forward10.png');

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
            <Image source={rewind} style={styles.rewind} />
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
          <Image source={
            paused ? play : pause
          } style={styles.play} />
        </TouchableOpacity>
      </Control>
      {!disableSeekButtons ? (
        <Control
          disabled={!showControls}
          callback={onPressForward}
          resetControlTimeout={resetControlTimeout}>
          <TouchableOpacity onPress={onPressForward}>
            <Image source={forward} style={styles.forward} />
          </TouchableOpacity>
        </Control>
      ) : null}
    </AnimatedView>
  );
};
