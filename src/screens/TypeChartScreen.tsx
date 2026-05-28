/**
 * TypeChartScreen — Guía gráfica de efectividad por tipo.
 * Filas: [debilidades] → TIPO → [fortalezas]
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchType } from '../api/pokeapi';
import { TypeEffectivenessRow } from '../components/TypeEffectivenessRow';
import { POKEMON_TYPES } from '../constants/filters';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { colors } from '../theme/colors';
import { STANDARD_TYPES } from '../utils/typeEffectiveness';

type Props = {
  onBack: () => void;
  onSelectType: (slug: string) => void;
};

type TypeEntry = {
  slug: string;
  id: number;
};

const ALL_TYPE_NAMES: string[] = [...STANDARD_TYPES];

export function TypeChartScreen({ onBack, onSelectType }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [types, setTypes] = useState<TypeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const entries: TypeEntry[] = [];
        const batchSize = 4;
        for (let i = 0; i < POKEMON_TYPES.length; i += batchSize) {
          const chunk = POKEMON_TYPES.slice(i, i + batchSize);
          const results = await Promise.all(
            chunk.map(async (t) => {
              const data = await fetchType(t.slug);
              return { slug: t.slug, id: data.id } satisfies TypeEntry;
            }),
          );
          entries.push(...results);
        }
        if (alive) setTypes(entries);
      } catch {
        if (alive) setError('No se pudieron cargar los tipos.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TypeEntry>) => (
      <TypeEffectivenessRow
        typeName={item.slug}
        allTypes={ALL_TYPE_NAMES}
        onPressType={() => onSelectType(item.slug)}
        onPressRelatedType={onSelectType}
      />
    ),
    [onSelectType],
  );

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <PokeScreenHeader
        compact
        title="Tabla de tipos"
        subtitle="Debilidades → tipo → fortalezas. Toca un tipo para más detalle."
        onBack={onBack}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.muted}>Cargando relaciones…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.err}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={types}
          keyExtractor={(item) => item.slug}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  muted: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  err: {
    color: colors.danger,
    fontSize: 15,
    textAlign: 'center',
  },
});
