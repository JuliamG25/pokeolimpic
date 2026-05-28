import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createSavedTeam,
  deleteSavedTeam,
  listSavedTeams,
  loadSavedTeam,
  removeFromTeam,
  renameSavedTeam,
  setActiveTeamId,
  swapTeamSlots,
  type SavedTeam,
  type SavedTeamSlot,
} from '../api/team';
import { fetchPokemon } from '../api/pokeapi';
import {
  getChampionsDexBySlug,
  resolveChampionsSpriteId,
} from '../constants/championsRoster';
import { PokeScreenHeader } from '../components/PokeScreenHeader';
import { PokeSprite, PokeSpritePlaceholder } from '../components/PokeSprite';
import { colors } from '../theme/colors';
import { HORIZONTAL_PADDING } from '../theme/layout';
import { POKE_BORDER } from '../theme/pokemon';
import { pokemonSpriteUrl } from '../constants/sprites';
import { analyzeTeamTypes } from '../utils/teamAnalysis';
import { formatTeamExport } from '../utils/showdown';
import { typeNameEs } from '../utils/i18n';
import {
  computeTeamSpeedTiers,
  speedComparisonSummary,
  type SpeedTierLine,
} from '../utils/speedTiers';

const TEAM_SIZE = 6;

type Props = {
  onBack: () => void;
  onOpenPokemon?: (slug: string) => void;
  refreshKey?: number;
};

export function TeamScreen({ onBack, onOpenPokemon, refreshKey = 0 }: Props) {
  const insets = useSafeAreaInsets();
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [activeTeamId, setActiveTeamIdState] = useState('');
  const [team, setTeam] = useState<SavedTeamSlot[]>([]);
  const [memberTypes, setMemberTypes] = useState<{ slug: string; types: string[] }[]>([]);
  const [speedTiers, setSpeedTiers] = useState<SpeedTierLine[]>([]);
  const [nameModal, setNameModal] = useState<
    { mode: 'create' } | { mode: 'rename'; teamId: string } | null
  >(null);
  const [nameDraft, setNameDraft] = useState('');

  const activeTeam = useMemo(
    () => teams.find((t) => t.id === activeTeamId) ?? teams[0],
    [teams, activeTeamId],
  );

  const reload = useCallback(async () => {
    const { activeTeamId: activeId, teams: allTeams } = await listSavedTeams();
    setTeams(allTeams);
    setActiveTeamIdState(activeId);
    const saved = await loadSavedTeam();
    setTeam(saved);
    const types = await Promise.all(
      saved.map(async (slot) => {
        try {
          const p = await fetchPokemon(slot.slug);
          return {
            slug: slot.slug,
            types: p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
          };
        } catch {
          return { slug: slot.slug, types: [] as string[] };
        }
      }),
    );
    setMemberTypes(types);
    setSpeedTiers(await computeTeamSpeedTiers(saved));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  const analysis = useMemo(
    () => analyzeTeamTypes(memberTypes.map((m) => ({ types: m.types }))),
    [memberTypes],
  );

  const speedLines = useMemo(() => speedComparisonSummary(speedTiers), [speedTiers]);

  const switchTeam = useCallback(
    async (teamId: string) => {
      await setActiveTeamId(teamId);
      await reload();
    },
    [reload],
  );

  const addTeam = useCallback(() => {
    setNameDraft(`Equipo ${teams.length + 1}`);
    setNameModal({ mode: 'create' });
  }, [teams.length]);

  const promptRenameTeam = useCallback(() => {
    if (!activeTeam) return;
    setNameDraft(activeTeam.name);
    setNameModal({ mode: 'rename', teamId: activeTeam.id });
  }, [activeTeam]);

  const submitNameModal = useCallback(async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || !nameModal) return;
    if (nameModal.mode === 'create') {
      await createSavedTeam(trimmed);
    } else {
      await renameSavedTeam(nameModal.teamId, trimmed);
    }
    setNameModal(null);
    setNameDraft('');
    await reload();
  }, [nameDraft, nameModal, reload]);

  const confirmDeleteTeam = useCallback(() => {
    if (!activeTeam) return;
    Alert.alert(
      'Eliminar equipo',
      `¿Eliminar «${activeTeam.name}»?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void deleteSavedTeam(activeTeam.id).then((r) => {
              if (r === 'last') {
                Alert.alert('No se puede', 'Tenés que tener al menos un equipo.');
                return;
              }
              void reload();
            });
          },
        },
      ],
    );
  }, [activeTeam, reload]);

  const remove = useCallback(
    async (slug: string) => {
      await removeFromTeam(slug);
      await reload();
    },
    [reload],
  );

  const moveUp = useCallback(
    async (index: number) => {
      if (index <= 0) return;
      await swapTeamSlots(index, index - 1);
      await reload();
    },
    [reload],
  );

  const moveDown = useCallback(
    async (index: number) => {
      if (index >= team.length - 1) return;
      await swapTeamSlots(index, index + 1);
      await reload();
    },
    [reload],
  );

  const exportTeam = () => {
    void Share.share({
      message: formatTeamExport(team, activeTeam?.name),
      title: activeTeam?.name ?? 'Mi equipo PokéMeta',
    });
  };

  const dex = getChampionsDexBySlug();

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
        title="Mis equipos"
        subtitle={`${team.length}/${TEAM_SIZE} · ↑↓ reordenar · mantener pulsado quitar`}
        onBack={onBack}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.teamTabs}
      >
        {teams.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.teamTab, t.id === activeTeamId && styles.teamTabActive]}
            onPress={() => void switchTeam(t.id)}
            onLongPress={() => {
              if (t.id === activeTeamId) promptRenameTeam();
            }}
          >
            <Text style={[styles.teamTabText, t.id === activeTeamId && styles.teamTabTextActive]}>
              {t.name}
            </Text>
            <Text style={styles.teamTabCount}>{t.slots.length}/6</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.teamTabAdd} onPress={addTeam}>
          <Text style={styles.teamTabAddText}>+ Nuevo</Text>
        </TouchableOpacity>
      </ScrollView>

      {teams.length > 1 ? (
        <View style={styles.teamActions}>
          <TouchableOpacity onPress={promptRenameTeam}>
            <Text style={styles.teamActionText}>Renombrar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDeleteTeam}>
            <Text style={[styles.teamActionText, styles.teamActionDanger]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.teamActions}>
          <TouchableOpacity onPress={promptRenameTeam}>
            <Text style={styles.teamActionText}>Renombrar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {team.length === 0 ? (
          <Text style={styles.hint}>
            Añadí Pokémon desde el detalle del meta (botón «Añadir al equipo»). Podés crear varios
            equipos con «+ Nuevo».
          </Text>
        ) : (
          <>
            {team.map((item, index) => {
              const id = resolveChampionsSpriteId(item.slug, dex);
              const types = memberTypes.find((m) => m.slug === item.slug)?.types ?? [];
              return (
                <View key={`${item.slug}-${index}`} style={styles.slot}>
                  <Text style={styles.slotNum}>{index + 1}</Text>
                  <TouchableOpacity
                    style={styles.slotMain}
                    onPress={() => onOpenPokemon?.(item.slug)}
                    onLongPress={() => {
                      Alert.alert('Quitar del equipo', `¿Quitar a ${item.name}?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Quitar',
                          style: 'destructive',
                          onPress: () => void remove(item.slug),
                        },
                      ]);
                    }}
                  >
                    {id > 0 ? (
                      <PokeSprite uri={pokemonSpriteUrl(id)} style={styles.sprite} />
                    ) : (
                      <PokeSpritePlaceholder style={styles.sprite} />
                    )}
                    <View style={styles.slotBody}>
                      <Text style={styles.name}>{item.name}</Text>
                      {types.length > 0 ? (
                        <Text style={styles.types}>
                          {types.map((t) => typeNameEs(t)).join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.reorderCol}>
                    <TouchableOpacity
                      onPress={() => void moveUp(index)}
                      disabled={index === 0}
                      style={styles.reorderBtn}
                    >
                      <Text style={styles.reorderText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => void moveDown(index)}
                      disabled={index >= team.length - 1}
                      style={styles.reorderBtn}
                    >
                      <Text style={styles.reorderText}>↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {Array.from({ length: TEAM_SIZE - team.length }, (_, i) => (
              <View key={`empty-${i}`} style={styles.slot}>
                <Text style={styles.slotNum}>{team.length + i + 1}</Text>
                <Text style={styles.emptyText}>Vacío</Text>
              </View>
            ))}

            {speedTiers.length > 0 ? (
              <>
                <Text style={styles.section}>Velocidad (sets meta · nivel 50)</Text>
                <View style={styles.analysisCard}>
                  {speedTiers.map((s) => (
                    <Text key={s.slug} style={styles.speedLine}>
                      #{s.rank} {s.name}: {s.speed} Spe
                      {s.item === 'Choice Scarf' ? ' (Scarf)' : ''}
                    </Text>
                  ))}
                  {speedLines.map((line) => (
                    <Text key={line} style={styles.speedHint}>
                      • {line}
                    </Text>
                  ))}
                </View>
              </>
            ) : null}

            {analysis.sharedWeaknesses.length > 0 ? (
              <>
                <Text style={styles.section}>Debilidades compartidas</Text>
                <View style={styles.analysisCard}>
                  {analysis.sharedWeaknesses.slice(0, 6).map((w) => (
                    <Text key={w.attackType} style={styles.analysisLine}>
                      • {w.label}: {w.count} Pokémon débiles
                    </Text>
                  ))}
                </View>
              </>
            ) : null}

            {analysis.offensiveCoverage.length > 0 ? (
              <>
                <Text style={styles.section}>Cobertura ofensiva (×2)</Text>
                <Text style={styles.coverage}>
                  {analysis.offensiveCoverage.slice(0, 12).join(' · ')}
                </Text>
              </>
            ) : null}

            <TouchableOpacity style={styles.exportBtn} onPress={exportTeam}>
              <Text style={styles.exportBtnText}>Exportar equipo (Showdown)</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal visible={nameModal !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {nameModal?.mode === 'create' ? 'Nuevo equipo' : 'Renombrar equipo'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Nombre del equipo"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnGhost}
                onPress={() => {
                  setNameModal(null);
                  setNameDraft('');
                }}
              >
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={() => void submitNameModal()}>
                <Text style={styles.modalBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  teamTabs: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  teamTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    minWidth: 90,
  },
  teamTabActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  teamTabText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  teamTabTextActive: { color: colors.accent },
  teamTabCount: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  teamTabAdd: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  teamTabAddText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  teamActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 8,
  },
  teamActionText: { color: colors.accentBlue, fontWeight: '600', fontSize: 13 },
  teamActionDanger: { color: colors.danger },
  scroll: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 32 },
  hint: { color: colors.textMuted, textAlign: 'center', padding: 24, lineHeight: 22 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  slotNum: { width: 22, fontWeight: '800', color: colors.accent, fontSize: 15 },
  slotMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotBody: { flex: 1 },
  sprite: { width: 48, height: 48 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  types: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyText: { flex: 1, color: colors.textMuted, fontStyle: 'italic' },
  reorderCol: { gap: 4 },
  reorderBtn: { padding: 6 },
  reorderText: { color: colors.accent, fontWeight: '800', fontSize: 16 },
  section: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  analysisCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
    marginBottom: 8,
  },
  analysisLine: { color: colors.text, fontSize: 14, marginBottom: 4 },
  speedLine: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  speedHint: { color: colors.accentBlue, fontSize: 12, marginBottom: 2 },
  coverage: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  exportBtn: {
    marginTop: 8,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: POKE_BORDER,
    borderColor: colors.accent,
  },
  exportBtnText: { color: colors.accent, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: POKE_BORDER,
    borderColor: colors.cardBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtnGhost: { paddingHorizontal: 14, paddingVertical: 10 },
  modalBtnGhostText: { color: colors.textMuted, fontWeight: '600' },
  modalBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalBtnText: { color: colors.textOnPrimary, fontWeight: '800' },
});
