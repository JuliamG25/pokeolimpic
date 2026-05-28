import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../theme/colors';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { getStrengths, getWeaknesses } from '../utils/typeEffectiveness';
import { TypePill } from './TypePill';

interface TypeEffectivenessRowProps {
  typeName: string;
  allTypes: string[];
  onPressType: () => void;
  onPressRelatedType?: (slug: string) => void;
}

/**
 * Fila estilo infografía: [debilidades] → TIPO → [fortalezas]
 */
export function TypeEffectivenessRow({
  typeName,
  allTypes,
  onPressType,
  onPressRelatedType,
}: TypeEffectivenessRowProps): React.JSX.Element {
  const weaknesses = getWeaknesses(typeName, allTypes);
  const strengths = getStrengths(typeName, allTypes);

  return (
    <View style={styles.row}>
      <View style={styles.side}>
        <View style={styles.pillWrap}>
          {weaknesses.length > 0 ? (
            weaknesses.map((t) => (
              <TypePill
                key={`w-${t}`}
                typeName={t}
                size="sm"
                onPress={onPressRelatedType ? () => onPressRelatedType(t) : undefined}
              />
            ))
          ) : (
            <Text style={styles.empty}>—</Text>
          )}
        </View>
      </View>

      <View style={styles.center}>
        <Text style={styles.arrow}>→</Text>
        <TouchableOpacity onPress={onPressType} activeOpacity={0.8}>
          <TypePill typeName={typeName} size="lg" />
        </TouchableOpacity>
        <Text style={styles.arrow}>→</Text>
      </View>

      <View style={styles.side}>
        <View style={styles.pillWrap}>
          {strengths.length > 0 ? (
            strengths.map((t) => (
              <TypePill
                key={`s-${t}`}
                typeName={t}
                size="sm"
                onPress={onPressRelatedType ? () => onPressRelatedType(t) : undefined}
              />
            ))
          ) : (
            <Text style={styles.empty}>—</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: HORIZONTAL_PADDING - 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    minHeight: 76,
    backgroundColor: colors.card,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.cardBorder,
  },
  side: {
    flex: 1,
    justifyContent: 'center',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  arrow: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 2,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
