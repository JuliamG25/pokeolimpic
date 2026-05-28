import { Image } from 'expo-image';
import { StyleProp, ImageStyle, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
};

/** Sprite con caché en disco/memoria (expo-image). */
export function PokeSprite({ uri, style }: Props): React.JSX.Element {
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={120}
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
