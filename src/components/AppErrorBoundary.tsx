import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

type Props = { children: ReactNode };

type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('AppErrorBoundary', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.root}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Algo falló</Text>
            <Text style={styles.msg}>
              La app encontró un error. Probá cerrarla y abrirla de nuevo. Si sigue, reinstalá
              el APK más reciente.
            </Text>
            <Text style={styles.detail}>{this.state.error.message}</Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => this.setState({ error: null })}
            >
              <Text style={styles.btnText}>Reintentar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 48 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 12 },
  msg: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: 16 },
  detail: {
    fontSize: 12,
    color: colors.danger,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  btn: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: colors.textOnPrimary, fontWeight: '800' },
});
