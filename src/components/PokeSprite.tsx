import { Image, StyleProp, ImageStyle, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
};

/** Sprite (Image nativo de RN — más estable en APK release que expo-image). */
export function PokeSprite({ uri, style }: Props): React.JSX.Element {
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="contain"
    />
  );
}

export function PokeSpritePlaceholder({
  style,
}: {
  style?: StyleProp<ImageStyle>;
}): React.JSX.Element {
  return <View style={[styles.ph, style]} />;
}

const styles = StyleSheet.create({
  ph: {
    backgroundColor: colors.cardBorder,
    borderRadius: 8,
  },
});
