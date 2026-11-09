import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './AppText';
import { clampVital, LEVEL_COLORS, VITALS, VitalDefinition, VitalLevel, Vitals } from '../data/vitals';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import { formatDateTime } from '../utils/format';
import GlassCard from './GlassCard';

const RING = 92;
const STROKE = 10;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LEVEL_LABELS: Record<VitalLevel, TranslationKey> = { good: 'vitalGood', warning: 'vitalWarning', bad: 'vitalBad' };

type Props = {
  vitals: Vitals;
  onChange: (vitals: Vitals) => void;
};

/** Кольца показателей как на фитнес-часах: значение меняется кнопками «−» и «+», цвет показывает норму. */
export default function VitalsRings({ vitals, onChange }: Props) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const filled = VITALS.filter((item) => vitals[item.id] !== undefined);
  const good = filled.filter((item) => item.level(vitals[item.id]!) === 'good').length;

  const change = (definition: VitalDefinition, direction: 1 | -1) => {
    const current = vitals[definition.id];
    const next = current === undefined ? definition.start : clampVital(definition, current + direction * definition.step);
    onChange({ ...vitals, [definition.id]: next, updatedAt: new Date().toISOString() });
  };

  return (
    <GlassCard>
      <View style={styles.header}>
        <Text style={[type.heading, styles.flex, { color: colors.text }]}>{t('vitalsTitle')}</Text>
        {filled.length > 0 ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('vitalsSummary', { good, total: filled.length })}</Text> : null}
      </View>
      <View style={styles.grid}>
        {VITALS.map((definition) => {
          const value = vitals[definition.id];
          const level = value === undefined ? null : definition.level(value);
          const tone = level ? LEVEL_COLORS[level] : colors.textMuted;
          const progress = value === undefined ? 0 : Math.min(1, value / definition.ringMax);
          const display = value === undefined ? '—' : definition.id === 'steps' ? value.toLocaleString('ru-RU') : String(value);
          return (
            <View key={definition.id} style={[styles.tile, { borderColor: colors.border }]} accessibilityLabel={`${t(definition.label)}: ${display} ${t(definition.unit)}${level ? `, ${t(LEVEL_LABELS[level])}` : ''}`}>
              <View style={styles.ring}>
                <Svg width={RING} height={RING}>
                  <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
                  {/* Без значения дугу не рисуем: скруглённый конец дал бы точку */}
                  {progress > 0 ? (
                    <Circle
                      cx={RING / 2}
                      cy={RING / 2}
                      r={RADIUS}
                      stroke={tone}
                      strokeWidth={STROKE}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
                      // Кольцо начинается сверху, как на часах
                      transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
                    />
                  ) : null}
                </Svg>
                <View style={styles.center}>
                  <Ionicons name={definition.icon} size={16} color={tone} />
                  <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
                    {display}
                  </Text>
                </View>
              </View>
              <Text style={[type.bodyMedium, { color: colors.text }]}>{t(definition.label)}</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>{t(definition.unit)}</Text>
              <Text style={[type.label, { color: tone }]}>{level ? t(LEVEL_LABELS[level]) : t('vitalEmpty')}</Text>
              <View style={styles.stepper}>
                <StepButton icon="remove" label={`${t(definition.label)}: −`} onPress={() => change(definition, -1)} disabled={value === undefined} />
                <StepButton icon="add" label={`${t(definition.label)}: +`} onPress={() => change(definition, 1)} />
              </View>
            </View>
          );
        })}
      </View>
      {vitals.updatedAt ? <Text style={[type.caption, { color: colors.textMuted }]}>{t('vitalsUpdated', { date: formatDateTime(vitals.updatedAt, language) })}</Text> : null}
      <Text style={[type.caption, { color: colors.textMuted }]}>{t('vitalsNote')}</Text>
    </GlassCard>
  );
}

function StepButton({ icon, label, onPress, disabled }: { icon: 'add' | 'remove'; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.stepButton, { backgroundColor: colors.primarySoft }, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '42%',
    alignItems: 'center',
    gap: 4,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  ring: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  stepper: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
