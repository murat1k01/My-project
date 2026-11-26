import { ReactNode, useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Constants from 'expo-constants';
import { Text } from '../components/AppText';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import { useAuth } from '../context/AuthContext';
import { useSignOut } from '../hooks/useSignOut';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { PHOTO_CREDITS } from '../data/photoCredits';
import type { MainTabScreenProps } from '../navigation/types';
import { FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SCALE_STEP, useFontScale } from '../theme/FontScaleContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

export default function SettingsScreen({ navigation }: MainTabScreenProps<'Settings'>) {
  const { colors, isDark, setMode } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { scale, setScale } = useFontScale();
  const { user } = useAuth();
  const signOut = useSignOut();
  // Пока ползунок двигают, меняется только подпись; размер всего приложения применяется, когда его отпустили
  const [dragging, setDragging] = useState<number | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const draftScale = dragging ?? scale;

  const appVersion = Constants.expoConfig?.version ?? t('notSpecified');
  const platformName = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : t('platformWeb');
  const percent = Math.round(draftScale * 100);

  return (
    <ScreenScroll title={t('settingsTitle')}>
      <Section title={t('fontSize')}>
        <View style={styles.sliderRow}>
          <Text style={[styles.small, { color: colors.textMuted }]} accessibilityElementsHidden>
            A
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={FONT_SCALE_MIN}
            maximumValue={FONT_SCALE_MAX}
            step={FONT_SCALE_STEP}
            value={scale}
            onValueChange={setDragging}
            onSlidingComplete={(value) => {
              setScale(value);
              setDragging(null);
            }}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={Platform.OS === 'android' ? colors.primary : undefined}
            accessibilityLabel={t('fontSize')}
          />
          <Text style={[styles.large, { color: colors.textMuted }]} accessibilityElementsHidden>
            A
          </Text>
        </View>
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('fontScaleValue', { percent })}</Text>
        <Text style={[type.body, styles.note, { color: colors.textSecondary, fontSize: (15 * draftScale) / scale, lineHeight: (21 * draftScale) / scale }]}>{t('fontPreview')}</Text>
      </Section>

      <Section title={t('appearance')}>
        <Row icon={isDark ? 'moon' : 'sunny'} label={t('darkTheme')}>
          <Switch
            value={isDark}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF" {...{ activeThumbColor: "#FFFFFF" }}
            accessibilityLabel={t('darkTheme')}
          />
        </Row>
      </Section>

      <Section title={t('language')}>
        <View style={styles.chips}>
          {LANGUAGES.map((item) => (
            <Chip key={item.code} label={item.name} selected={language === item.code} onPress={() => setLanguage(item.code)} />
          ))}
        </View>
      </Section>

      <Section title={t('payTitle')}>
        <Text style={[type.body, styles.note, { color: colors.textSecondary }]}>{t('paySettingsText')}</Text>
        <PrimaryButton title={t('payOpen')} icon="card-outline" variant="glass" compact style={styles.button} onPress={() => navigation.navigate('Payment')} />
      </Section>

      <Section title={t('about')}>
        <Row icon="school-outline" label={t('appNameLabel')} value={t('appName')} />
        <Row icon="pricetag-outline" label={t('version')} value={appVersion} />
        <Row icon="phone-portrait-outline" label={t('platform')} value={platformName} />
        <PrimaryButton title={showCredits ? t('photoCreditsHide') : t('photoCredits')} icon="images-outline" variant="glass" compact style={styles.button} onPress={() => setShowCredits((prev) => !prev)} />
        {showCredits ? (
          <View style={styles.credits}>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('photoCreditsNote')}</Text>
            {PHOTO_CREDITS.map((item) => (
              <Text key={item.file} style={[type.caption, { color: colors.textSecondary }]}>
                {item.title} — {item.author}, {item.license}
              </Text>
            ))}
          </View>
        ) : null}
      </Section>

      {user ? <PrimaryButton title={t('signOut')} variant="danger" icon="log-out-outline" onPress={signOut} /> : null}
    </ScreenScroll>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[type.label, styles.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

type RowProps = {
  icon: IoniconName;
  label: string;
  value?: string;
  /** Элемент управления справа (например, Switch) */
  children?: ReactNode;
};

function Row({ icon, label, value, children }: RowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[type.body, styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {value !== undefined ? (
        <Text style={[type.body, styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  slider: {
    flex: 1,
    height: 44,
  },
  // Буквы по краям ползунка показывают направление; их размер не масштабируется
  small: {
    fontSize: 13,
  },
  large: {
    fontSize: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    maxWidth: '50%',
  },
  note: {
    paddingVertical: spacing.sm,
  },
  button: {
    marginBottom: spacing.sm,
  },
  credits: {
    gap: 4,
    paddingBottom: spacing.sm,
  },
});
