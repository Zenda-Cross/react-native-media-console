import React, {Dispatch, SetStateAction} from 'react';
import {View, GestureResponderHandlers} from 'react-native';
import {styles} from './styles';

interface SeekbarProps {
  seekerFillWidth: number;
  seekerPosition: number;
  seekColor: string;
  cachedPosition: number;
  seekerPanHandlers: GestureResponderHandlers;
  setSeekerWidth: Dispatch<SetStateAction<number>>;
}

export const Seekbar = ({
  seekColor,
  seekerFillWidth,
  seekerPosition,
  cachedPosition,
  seekerPanHandlers,
  setSeekerWidth,
}: SeekbarProps) => {
  return (
    <View style={styles.container} collapsable={false} {...seekerPanHandlers}>
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
  );
};
