import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { typeColors } from '../constants/typeColors';
import { colors } from '../theme/colors';
import { formatTypeAbbr } from '../utils/typeEffectiveness';

export type TypePillSize = 'sm' | 'md' | 'lg';

interface TypePillProps {
  typeName: string;
  size?: TypePillSize;
  onPress?: () => void;
  selected?: boolean;
}

const SIZE_MAP: Record<
  TypePillSize,
  { padH: number; padV: number; fontSize: number; minWidth: number }
> = {
  sm: { padH: 6, padV: 4, fontSize: 9, minWidth: 44 },
  md: { padH: 10, padV: 6, fontSize: 11, minWidth: 56 },
  lg: { padH: 16, padV: 10, fontSize: 14, minWidth: 88 },
};

export function TypePill({
  typeName,
  size = 'md',
  onPress,
  selected = false,
}: TypePillProps): React.JSX.Element {
  const bg = typeColors[typeName.toLowerCase()] ?? colors.cardBorder;
  const dims = SIZE_MAP[size];
  const label = formatTypeAbbr(typeName);

  const content = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          paddingHorizontal: dims.padH,
          paddingVertical: dims.padV,
          minWidth: dims.minWidth,
          borderColor: selected ? colors.accent : 'rgba(0,0,0,0.35)',
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { fontSize: dims.fontSize }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} accessibilityRole="button">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 3,
  },
  label: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
