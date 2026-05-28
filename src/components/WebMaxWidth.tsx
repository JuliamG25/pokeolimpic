import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

/** Ancho máximo en navegador para que el contenido no quede en una franja vacía a la derecha */
export const WEB_MAX_WIDTH = 960;

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Por defecto WEB_MAX_WIDTH; puedes usar otro para listas más estrechas */
  maxWidth?: number;
};

export function WebMaxWidth({ children, style, maxWidth = WEB_MAX_WIDTH }: Props) {
  if (Platform.OS !== 'web') {
    return <View style={[{ flex: 1, minWidth: 0 }, style]}>{children}</View>;
  }
  return (
    <View
      style={[
        {
          flex: 1,
          width: '100%',
          alignItems: 'center',
          minHeight: '100%',
        },
        style,
      ]}
    >
      <View style={{ width: '100%', maxWidth, flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}
