import { Platform, StyleSheet } from 'react-native';
import { colors } from './colors';

export const POKE_BORDER = 3;
export const POKE_RADIUS = 16;
export const POKE_RADIUS_SM = 12;

export const pokemonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: POKE_RADIUS,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: colors.cardBorder,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 0,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  cardInset: {
    backgroundColor: colors.accentSoft,
    borderRadius: POKE_RADIUS_SM,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentNavy,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentYellow,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  backBtnText: {
    color: colors.textOnYellow,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: POKE_RADIUS_SM,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: POKE_RADIUS_SM,
    padding: 14,
    marginBottom: 10,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
});
