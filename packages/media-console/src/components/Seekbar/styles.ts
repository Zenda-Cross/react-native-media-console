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
    height: 3,
    position: 'relative',
    top: 14,
    width: '100%',
    borderRadius: 3,
  },
  fill: {
    backgroundColor: '#FFF',
    height: 4,
    width: '100%',
    borderRadius: 3,
  },
  handle: {
    position: 'absolute',
    marginLeft: -9.3,
    height: 30,
    width: 30,
  },
  circle: {
    borderRadius: 12,
    position: 'relative',
    top: 10,
    left: -2,
    height: 12,
    width: 12,
  },
});
