import { Text, StyleSheet, View, type ViewStyle, type TextStyle } from 'react-native';
import { getTypeColor, getTypeLabelColor } from '../constants/typeColors';

type Props = {
  slug: string;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const PAD = { sm: [5, 8] as const, md: [7, 11] as const, lg: [9, 14] as const };
const FS = { sm: 10, md: 11, lg: 13 };

export function TypeBadge({ slug, label, size = 'sm', style, textStyle }: Props) {
  const bg = getTypeColor(slug);
  const fg = getTypeLabelColor(slug);
  const [py, px] = PAD[size];

  return (
    <View style={[styles.wrap, { backgroundColor: bg, paddingVertical: py, paddingHorizontal: px }, style]}>
      <Text
        style={[
          styles.txt,
          { color: fg, fontSize: FS[size] },
          fg === '#ffffff' && styles.txtShadow,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 6,
    margin: 2,
    maxWidth: '100%',
  },
  txt: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  txtShadow: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
