import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { preloadChampionsMeta } from '../api/smogon';
import { getTopInset, getBottomInset } from '../utils/safeArea';
import { colors } from '../theme/colors';
import { POKE_BORDER, POKE_RADIUS } from '../theme/pokemon';

type Props = {
  onPokedex: () => void;
  onBest: () => void;
  onTypes: () => void;
  onMoves: () => void;
  onItems: () => void;
  onAbilities: () => void;
  onTera: () => void;
  onTeam: () => void;
  onCalc: () => void;
  onSearch: () => void;
};

const CARD_DATA: {
  key: string;
  icon: string;
  title: string;
  desc: string;
  accent: string;
  tileBg: string;
  onPress: (p: Props) => () => void;
}[] = [
  {
    key: 'pokedex',
    icon: '◓',
    title: 'Pokédex',
    desc: 'Roster Champions · buscar y filtrar',
    accent: colors.accent,
    tileBg: '#FFF0EE',
    onPress: (p) => p.onPokedex,
  },
  {
    key: 'best',
    icon: '★',
    title: 'Meta y sets',
    desc: 'Top uso, movimientos, objeto y EVs',
    accent: colors.accentYellowDark,
    tileBg: '#FFFBE6',
    onPress: (p) => p.onBest,
  },
  {
    key: 'types',
    icon: '◆',
    title: 'Tipos',
    desc: 'Fortalezas, debilidades y matchups',
    accent: colors.accentBlue,
    tileBg: '#EEF2FF',
    onPress: (p) => p.onTypes,
  },
  {
    key: 'moves',
    icon: '⚡',
    title: 'Ataques',
    desc: 'Movimientos del meta competitivo',
    accent: '#7B3FF2',
    tileBg: '#F3EEFF',
    onPress: (p) => p.onMoves,
  },
  {
    key: 'items',
    icon: '▣',
    title: 'Objetos',
    desc: 'Ítems más equipados en VGC',
    accent: colors.success,
    tileBg: '#EDFAEE',
    onPress: (p) => p.onItems,
  },
  {
    key: 'abilities',
    icon: '◎',
    title: 'Habilidades',
    desc: 'Efectos desde PokeAPI',
    accent: '#00A8A8',
    tileBg: '#E6FAFA',
    onPress: (p) => p.onAbilities,
  },
  {
    key: 'tera',
    icon: '◇',
    title: 'Tera del meta',
    desc: 'Tipos Tera más usados en VGC',
    accent: '#E91E8C',
    tileBg: '#FFE8F5',
    onPress: (p) => p.onTera,
  },
  {
    key: 'team',
    icon: '6',
    title: 'Mi equipo',
    desc: 'Guardá hasta 6 favoritos',
    accent: colors.accentNavy,
    tileBg: '#E8ECF4',
    onPress: (p) => p.onTeam,
  },
  {
    key: 'calc',
    icon: '÷',
    title: 'Calculadora',
    desc: 'Daño Gen 9 con sets del meta VGC',
    accent: '#C62828',
    tileBg: '#FFEBEE',
    onPress: (p) => p.onCalc,
  },
];

function MenuPokeball(): React.JSX.Element {
  return (
    <View style={styles.heroBall} pointerEvents="none">
      <View style={styles.heroBallTop} />
      <View style={styles.heroBallMid} />
      <View style={styles.heroBallBottom} />
      <View style={styles.heroBallBtn} />
    </View>
  );
}

export function MenuScreen({
  onPokedex,
  onBest,
  onTypes,
  onMoves,
  onItems,
  onAbilities,
  onTera,
  onTeam,
  onCalc,
  onSearch,
}: Props) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const useTwoCol = isWeb && width >= 680;
  const props = {
    onPokedex,
    onBest,
    onTypes,
    onMoves,
    onItems,
    onAbilities,
    onTera,
    onTeam,
    onCalc,
    onSearch,
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        preloadChampionsMeta();
      } catch {
        /* precarga opcional */
      }
    }, 2500);
    return () => clearTimeout(handle);
  }, []);

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={[styles.scroll, { paddingTop: getTopInset(), paddingBottom: getBottomInset() + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, isWeb && styles.heroWeb]}>
        <MenuPokeball />
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>CHAMPIONS</Text>
          </View>
          <View style={[styles.heroBadge, styles.heroBadgeYellow]}>
            <Text style={[styles.heroBadgeText, styles.heroBadgeTextDark]}>GEN 9</Text>
          </View>
        </View>
        <Text style={styles.logo}>PokéMeta</Text>
        <Text style={styles.tagline}>
          Tu guía competitiva con estilo Pokémon: Pokédex, meta VGC, tipos y más.
        </Text>
      </View>

      <TouchableOpacity style={styles.searchBar} onPress={onSearch} activeOpacity={0.85}>
        <Text style={styles.searchPlaceholder}>🔍  Buscar Pokémon, meta, movimientos…</Text>
      </TouchableOpacity>

      <View style={[styles.body, isWeb && styles.bodyWeb]}>
        <Text style={styles.sectionLabel}>▶ Elegí un modo</Text>
        <View style={[styles.grid, useTwoCol && styles.grid2]}>
          {CARD_DATA.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[
                styles.tile,
                { backgroundColor: c.tileBg, borderLeftColor: c.accent },
                useTwoCol && styles.tileHalf,
              ]}
              onPress={c.onPress(props)}
              activeOpacity={0.9}
            >
              <View style={[styles.tileIconWrap, { backgroundColor: c.accent }]}>
                <Text style={styles.tileIcon}>{c.icon}</Text>
              </View>
              <Text style={styles.tileTitle}>{c.title}</Text>
              <Text style={styles.tileDesc}>{c.desc}</Text>
              <View style={[styles.tileCta, { backgroundColor: c.accent }]}>
                <Text style={styles.tileCtaText}>ENTRAR</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLine}>pokeapi.co · data.pkmn.cc</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
    overflow: 'hidden',
    backgroundColor: colors.headerGradientMid,
  },
  heroWeb: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: POKE_RADIUS,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  heroBall: {
    position: 'absolute',
    right: 16,
    top: 20,
    width: 88,
    height: 88,
    opacity: 0.35,
  },
  heroBallTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 42,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    borderWidth: 3,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0,
  },
  heroBallMid: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: colors.cardBorder,
  },
  heroBallBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 42,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    borderWidth: 3,
    borderColor: colors.cardBorder,
    borderTopWidth: 0,
  },
  heroBallBtn: {
    position: 'absolute',
    top: 32,
    left: 30,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.cardBorder,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  heroBadgeYellow: {
    backgroundColor: colors.accentYellow,
    borderColor: colors.cardBorder,
  },
  heroBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroBadgeTextDark: {
    color: colors.textOnYellow,
  },
  logo: {
    fontSize: Platform.OS === 'web' ? 44 : 38,
    fontWeight: '900',
    color: colors.textOnPrimary,
    letterSpacing: -1,
    textShadowColor: colors.cardBorder,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  tagline: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 300,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  searchBar: {
    marginHorizontal: 18,
    marginTop: -12,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    elevation: 2,
  },
  searchPlaceholder: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  bodyWeb: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    color: colors.accentNavy,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  grid: {
    gap: 12,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    borderRadius: POKE_RADIUS,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    borderLeftWidth: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.cardBorder,
        shadowOffset: { width: 2, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 0,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  tileHalf: {
    width: '48%',
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileIcon: {
    fontSize: 22,
    color: colors.textOnPrimary,
    fontWeight: '900',
  },
  tileTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  tileDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginBottom: 12,
  },
  tileCta: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  tileCtaText: {
    color: colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerLine: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
