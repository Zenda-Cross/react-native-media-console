import React, {Dispatch, SetStateAction} from 'react';
import {View, GestureResponderHandlers} from 'react-native';
import {styles} from './styles';
import {styles as globalStyles} from '../styles';
import {formatTime} from '@8man/react-native-media-console/src/utils';
import {Text} from 'react-native';

interface SeekbarProps {
  seekerFillWidth: number;
  seekerPosition: number;
  seekColor: string;
  cachedPosition: number;
  seekerPanHandlers: GestureResponderHandlers;
  setSeekerWidth: Dispatch<SetStateAction<number>>;
  time?: number;
  duration: number;
  showDuration: boolean;
  showTimeRemaining: boolean;
  showHours: boolean;
}

export const Seekbar = ({
  seekColor,
  seekerFillWidth,
  seekerPosition,
  cachedPosition,
  seekerPanHandlers,
  setSeekerWidth,
  showDuration,
  showHours,
  showTimeRemaining,
  time,
  duration,
}: SeekbarProps) => {
  return (
    <View
      style={{
        marginBottom: 55,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}>
      <View>
        <Text style={{...globalStyles.text}}>
          {formatTime({
            duration,
            time,
            showDuration,
            showHours,
            showTimeRemaining,
          })}
        </Text>
      </View>
      <View
        style={{...styles.container, width: '80%'}}
        collapsable={false}
        {...seekerPanHandlers}>
        <View
          style={styles.track}
          onLayout={(event) => setSeekerWidth(event.nativeEvent.layout.width)}
          pointerEvents={'none'}>
          <View
            style={[
              {
                width: cachedPosition,
                backgroundColor: '#dedede',
                height: 4,
                position: 'absolute',
                top: 0,
                borderRadius: 3,
              },
            ]}
            pointerEvents={'none'}
          />
          <View
            style={[
              styles.fill,
              {
                width: seekerFillWidth,
                backgroundColor: seekColor || '#FFF',
              },
            ]}
            pointerEvents={'none'}
          />
        </View>
        <View
          style={[styles.handle, {left: seekerPosition}]}
          pointerEvents={'none'}>
          <View
            style={[styles.circle, {backgroundColor: seekColor || '#FFF'}]}
            pointerEvents={'none'}
          />
        </View>
      </View>
      <View style={{}}>
        <Text style={{...globalStyles.text}}>
          {formatTime({
            duration,
            time: duration,
            showDuration,
            showHours,
            showTimeRemaining,
          })}
        </Text>
      </View>
    </View>
  );
};
