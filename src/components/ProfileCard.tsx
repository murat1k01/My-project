import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import Avatar from './Avatar';

export type ProfileRow = {
  icon: IoniconName;
  label: string;
  value: string;
};

type Props = {
  firstName: string;
  lastName: string;
  /** Для цвета аватара */
  seed: string;
  /** Строка под именем (например, группа) */
  badge: string;
  rows: ProfileRow[];
};

/** Карточка профиля: синий градиент с аватаром и именем, ниже — строки с данными. */
export default function ProfileCard({ firstName, lastName, seed, badge, rows }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.glass }]}>
      <LinearGradient colors={[colors.cardStart, colors.cardEnd] as const} style={styles.hero}>
        <Avatar firstName={firstName} lastName={lastName} seed={seed} size={84} />
        <Text style={styles.name}>{`${firstName} ${lastName}`.trim()}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </LinearGradient>

      <View style={styles.rows}>
        {rows.map((row, index) => (
          <View key={row.label} style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={row.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.rowTexts}>
              <Text style={[type.caption, { color: colors.textMuted }]}>{row.label}</Text>
              <Text style={[type.bodyMedium, { color: colors.text }]}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  name: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 26,
    letterSpacing: -0.6,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: '#0A0F24',
  },
  rows: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: {
    flex: 1,
  },
});
