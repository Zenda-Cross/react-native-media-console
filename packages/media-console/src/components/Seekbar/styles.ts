import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    height: 24,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 0,
  },
  track: {
    backgroundColor: '#333',
    height: 4,
    position: 'relative',
    top: 14,
    width: '100%',
    borderRadius: 3,
  },
  fill: {
    backgroundColor: '#FFF',
    height: 5,
    width: '100%',
    borderRadius: 3,
  },
  handle: {
    position: 'absolute',
    marginLeft: -9.3,
    height: 32,
    width: 32,
  },
  circle: {
    borderRadius: 12,
    position: 'relative',
    top: 10,
    left: -5,
    height: 14,
    width: 14,
  },
});
