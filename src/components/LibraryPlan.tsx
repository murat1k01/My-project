import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ENTRANCE_ROOM_ID, getRoom, LIBRARY_FLOORS, LIBRARY_ROOMS } from '../data/library';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import Chip from './Chip';
import GlassCard from './GlassCard';

type Props = {
  floor: number;
  onFloorChange: (floor: number) => void;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  /** Подсказка над планом, например «Здесь книга „Чистый код“» */
  highlightText?: string;
};

/**
 * Мини-план этажа библиотеки. Комнаты расположены так, как на этаже (координаты в процентах),
 * их можно нажать и прочитать, что внутри. На 1 этаже отмечен вход — «Вы здесь».
 */
export default function LibraryPlan({ floor, onFloorChange, selectedRoomId, onSelectRoom, highlightText }: Props) {
  const { colors, isDark } = useTheme();
  const { t, tr } = useI18n();
  const rooms = LIBRARY_ROOMS.filter((room) => room.floor === floor);
  const selected = getRoom(selectedRoomId);
  const selectedOnFloor = selected && selected.floor === floor ? selected : undefined;
  const accent = isDark ? colors.pill : colors.round;
  const onAccent = isDark ? colors.onPill : colors.onRound;

  return (
    <View style={styles.container}>
      <View style={styles.floors}>
        {LIBRARY_FLOORS.map((item) => (
          <Chip key={item} label={t('libFloor', { n: item })} icon="layers-outline" selected={item === floor} onPress={() => onFloorChange(item)} />
        ))}
      </View>

      {highlightText ? <Text style={[type.bodyMedium, { color: colors.text }]}>{highlightText}</Text> : null}

      <View style={[styles.plan, { borderColor: colors.text, backgroundColor: colors.surfaceAlt }]}>
        {rooms.map((room) => {
          const isSelected = room.id === selectedOnFloor?.id;
          return (
            <Pressable
              key={room.id}
              onPress={() => onSelectRoom(room.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={tr(room.name)}
              style={[
                styles.room,
                {
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.w}%`,
                  height: `${room.h}%`,
                  borderColor: colors.border,
                  backgroundColor: isSelected ? accent : colors.glass,
                },
              ]}
            >
              <Ionicons name={room.icon} size={16} color={isSelected ? onAccent : colors.text} />
              <Text style={[styles.roomName, { color: isSelected ? onAccent : colors.text }]} numberOfLines={2}>
                {tr(room.name)}
              </Text>
              {room.id === ENTRANCE_ROOM_ID ? (
                <View style={[styles.here, { backgroundColor: colors.danger }]}>
                  <Text style={styles.hereText}>{t('libYouAreHere')}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {selectedOnFloor ? (
        <GlassCard>
          <View style={styles.detailsHeader}>
            <Ionicons name={selectedOnFloor.icon} size={20} color={colors.text} />
            <Text style={[type.subheading, styles.flex, { color: colors.text }]}>{tr(selectedOnFloor.name)}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('libFloor', { n: selectedOnFloor.floor })}</Text>
          </View>
          <Text style={[type.body, { color: colors.textSecondary }]}>{tr(selectedOnFloor.description)}</Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('libRoomHours', { hours: selectedOnFloor.hours })}</Text>
        </GlassCard>
      ) : (
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('libPlanHint')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    gap: spacing.md,
  },
  floors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  plan: {
    width: '100%',
    aspectRatio: 1.25,
    borderWidth: 2,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  room: {
    position: 'absolute',
    borderWidth: 1,
    padding: 6,
    gap: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomName: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  here: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  hereText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
