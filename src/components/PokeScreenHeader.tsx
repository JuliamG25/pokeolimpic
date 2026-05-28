import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { POKE_BORDER } from '../theme/pokemon';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  /** Barra compacta sin gradiente (dentro de pantallas con scroll) */
  compact?: boolean;
};

export function PokeScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = '← Menú',
  compact = false,
}: Props): React.JSX.Element {
  if (compact) {
    return (
      <View style={styles.compactWrap}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={12} activeOpacity={0.85}>
            <Text style={styles.backText}>{backLabel}</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.compactTitle}>{title}</Text>
        {subtitle ? <Text style={styles.compactSub}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.headerGradientStart, colors.headerGradientMid, colors.headerGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.pokeballDecor} pointerEvents="none">
        <View style={styles.pokeballTop} />
        <View style={styles.pokeballLine} />
        <View style={styles.pokeballBottom} />
        <View style={styles.pokeballButton} />
      </View>
      {onBack ? (
        <TouchableOpacity style={styles.backBtnHero} onPress={onBack} hitSlop={12} activeOpacity={0.85}>
          <Text style={styles.backTextHero}>{backLabel}</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSub}>{subtitle}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 20,
    marginBottom: 4,
    overflow: 'hidden',
  },
  pokeballDecor: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 100,
    height: 100,
    opacity: 0.22,
  },
  pokeballTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderWidth: 3,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0,
  },
  pokeballLine: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.cardBorder,
  },
  pokeballBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderWidth: 3,
    borderColor: colors.cardBorder,
    borderTopWidth: 0,
  },
  pokeballButton: {
    position: 'absolute',
    top: 38,
    left: 35,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.cardBorder,
  },
  backBtnHero: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentYellow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  backTextHero: {
    color: colors.textOnYellow,
    fontWeight: '800',
    fontSize: 13,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textOnPrimary,
    textShadowColor: colors.cardBorder,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
    maxWidth: 320,
  },
  compactWrap: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentYellow,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    marginBottom: 10,
  },
  backText: {
    color: colors.textOnYellow,
    fontWeight: '800',
    fontSize: 14,
  },
  compactTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  compactSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
});
