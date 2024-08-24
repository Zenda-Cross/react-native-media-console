import React from 'react';
import {View, ActivityIndicator} from 'react-native';
import {styles} from './styles';

interface LoaderProps {
  color?: string;
}

export const Loader = ({color = 'tomato'}: LoaderProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={color} size={'large'} />
    </View>
  );
};
