import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  playContainer: {
    width: '35%',
    alignItems: 'center',
  },
  play: {
    height: 72,
    width: 72,
  },
  rewind: {
    height: 60,
    width: 60,
  },
  forward: {
    height: 60,
    width: 60
  },
});
