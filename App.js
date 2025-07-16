import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GameScreen from './GameScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <GameScreen />
        <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}


