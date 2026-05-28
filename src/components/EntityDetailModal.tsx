import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { colors } from '../theme/colors';
import { POKE_BORDER, POKE_RADIUS } from '../theme/pokemon';

type Props = {
  visible: boolean;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  imageUrl?: string | null;
  loading: boolean;
  onClose: () => void;
};

export function EntityDetailModal({
  visible,
  title,
  subtitle,
  description,
  imageUrl,
  loading,
  onClose,
}: Props): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetStripe} />
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
          ) : (
            <ScrollView>
              {imageUrl ? (
                <View style={styles.imageWrap}>
                  <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
                </View>
              ) : null}
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              {description ? <Text style={styles.body}>{description}</Text> : null}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.closeText}>CERRAR</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 44, 94, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: POKE_RADIUS,
    padding: 20,
    maxHeight: '80%',
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  sheetStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.accentYellow,
    borderBottomWidth: 2,
    borderBottomColor: colors.cardBorder,
  },
  imageWrap: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  image: { width: 72, height: 72 },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 14,
    fontWeight: '600',
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  closeText: {
    color: colors.textOnPrimary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});
