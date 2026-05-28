import { Platform, StatusBar } from 'react-native';

/** Padding superior sin react-native-safe-area-context (evita crash nativo en algunos APK). */
export function getTopInset(): number {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight ?? 24;
  }
  return 44;
}

export function getBottomInset(): number {
  return Platform.OS === 'ios' ? 20 : 0;
}

export function getLeftInset(): number {
  return 0;
}

export function getRightInset(): number {
  return 0;
}
