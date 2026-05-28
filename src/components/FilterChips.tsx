import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import type { EvolutionPhaseFilter } from '../constants/filters';
import { EVOLUTION_PHASE_OPTIONS } from '../constants/filters';

type Chip = { key: string; label: string };

type Props = {
  title: string;
  subtitle?: string;
  chips: Chip[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  /** scroll: fila horizontal | wrap: rejilla que baja línea (mejor para muchos ítems) */
  layout?: 'scroll' | 'wrap';
};

export function FilterSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.title}>{title}</Text>
      {subtitle ? <Text style={sectionStyles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function FilterChipRow({
  title,
  subtitle,
  chips,
  selectedKey,
  onSelect,
  layout = 'scroll',
}: Props) {
  const body =
    layout === 'wrap' ? (
      <View style={styles.wrapGrid}>
        {chips.map((c) => {
          const selected = selectedKey === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, styles.chipWrap, selected && styles.chipOn]}
              onPress={() => onSelect(selected ? null : c.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]} numberOfLines={1}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={styles.scroll}
      >
        {chips.map((c) => {
          const selected = selectedKey === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, styles.chipScroll, selected && styles.chipOn]}
              onPress={() => onSelect(selected ? null : c.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]} numberOfLines={1}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );

  return (
    <FilterSection title={title} subtitle={subtitle}>
      {body}
    </FilterSection>
  );
}

export function EvolutionFilterRow({
  value,
  onChange,
}: {
  value: EvolutionPhaseFilter;
  onChange: (v: EvolutionPhaseFilter) => void;
}) {
  return (
    <FilterSection
      title="Fase evolutiva"
      subtitle={
        '“Sin evolución previa”: no evoluciona de otra especie. “Con evolución previa”: tiene forma anterior en la cadena.'
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={styles.scroll}
      >
        {EVOLUTION_PHASE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, styles.chipScroll, selected && styles.chipOn]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]} numberOfLines={2}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </FilterSection>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.cardBorder,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
});

const styles = StyleSheet.create({
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
  },
  wrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.bgPattern,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  chipScroll: {
    marginRight: 8,
    marginBottom: 0,
  },
  chipWrap: {
    marginHorizontal: 4,
    marginBottom: 8,
  },
  chipOn: {
    backgroundColor: colors.accentYellow,
    borderColor: colors.cardBorder,
    borderWidth: 3,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextOn: {
    color: colors.textOnYellow,
    fontWeight: '800',
  },
});
