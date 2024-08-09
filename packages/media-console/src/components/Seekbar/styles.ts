import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    height: 20,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 0,
  },
  track: {
    backgroundColor: '#333',
    height: 6,
    position: 'relative',
    top: 14,
    width: '100%',
    borderRadius: 3,
  },
  fill: {
    backgroundColor: '#FFF',
    height: 6,
    width: '100%',
    borderRadius: 3,
  },
  handle: {
    position: 'absolute',
    marginLeft: -7,
    height: 32,
    width: 32,
  },
  circle: {
    borderRadius: 12,
    position: 'relative',
    top: 8,
    left: -5,
    height: 19,
    width: 19,
  },
});
