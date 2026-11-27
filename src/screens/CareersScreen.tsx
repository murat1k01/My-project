import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/AppText';
import FormBanner from '../components/FormBanner';
import ScreenScroll from '../components/ScreenScroll';
import { useI18n } from '../i18n/LanguageContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/metrics';
import { fonts, type } from '../theme/typography';
import type { IoniconName } from '../types/Service';

type Category = 'work' | 'practice' | 'intern' | 'resume';
type Link = { key: string; icon: IoniconName; title: string; text: string; url: string };

/** Поиск вакансий на hh.kz по Алматы (регион 160) */
const hh = (text: string) => `https://hh.kz/search/vacancy?area=160&text=${encodeURIComponent(text)}`;

/**
 * «Карьера мүмкіндіктері»: подтверждённых вакансий от университета пока нет, поэтому раздел не выдумывает предложения,
 * а ведёт на настоящий поиск вакансий, практик и стажировок (hh.kz, Enbek.kz) и на создание резюме.
 */
export default function CareersScreen({ navigation }: RootStackScreenProps<'Careers'>) {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [category, setCategory] = useState<Category>('work');

  const categories: { id: Category; icon: IoniconName; label: string }[] = [
    { id: 'work', icon: 'briefcase-outline', label: t('careersWork') },
    { id: 'practice', icon: 'school-outline', label: t('careersPractice') },
    { id: 'intern', icon: 'people-outline', label: t('careersIntern') },
    { id: 'resume', icon: 'document-text-outline', label: t('careersResume') },
  ];

  const links: Record<Category, Link[]> = {
    work: [
      { key: 'hh-student', icon: 'search-outline', title: t('careersStudentJobs'), text: 'hh.kz · Алматы', url: hh('студент') },
      { key: 'hh-it', icon: 'code-slash-outline', title: t('careersItJobs'), text: 'hh.kz · Алматы', url: hh('junior') },
      { key: 'enbek', icon: 'globe-outline', title: t('careersEnbek'), text: 'enbek.kz', url: 'https://www.enbek.kz/ru/search/vac' },
    ],
    practice: [{ key: 'hh-practice', icon: 'search-outline', title: t('careersPracticeSearch'), text: 'hh.kz · Алматы', url: hh('практика студент') }],
    intern: [
      { key: 'hh-intern', icon: 'search-outline', title: t('careersInternSearch'), text: 'hh.kz · Алматы', url: hh('стажировка') },
      { key: 'kaspi', icon: 'business-outline', title: 'Kaspi.kz', text: t('careersCompanySearch'), url: hh('Kaspi стажировка') },
      { key: 'kcell', icon: 'business-outline', title: 'Kcell', text: t('careersCompanySearch'), url: hh('Kcell стажировка') },
      { key: 'kazatomprom', icon: 'business-outline', title: 'Kazatomprom', text: t('careersCompanySearch'), url: hh('Казатомпром стажировка') },
    ],
    resume: [{ key: 'hh-resume', icon: 'create-outline', title: t('careersResumeCreate'), text: 'hh.kz', url: 'https://hh.kz/applicant/resumes' }],
  };

  return (
    <ScreenScroll title={t('careersTitle')} subtitle={t('careersSubtitle')} onBack={navigation.goBack}>
      <View style={styles.categories}>
        {categories.map((item) => {
          const active = category === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setCategory(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.category,
                { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name={item.icon} size={22} color={active ? colors.onPrimary : isDark ? colors.gold : colors.primary} />
              <Text style={[styles.categoryLabel, { color: active ? colors.onPrimary : colors.text }]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FormBanner kind="info" text={t('careersNote')} />

      <View style={styles.list}>
        {links[category].map((link) => (
          <Pressable
            key={link.key}
            onPress={() => void Linking.openURL(link.url)}
            accessibilityRole="link"
            accessibilityLabel={`${link.title}. ${link.text}`}
            style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { borderColor: colors.gold, backgroundColor: colors.primarySoft }]}>
              <Ionicons name={link.icon} size={20} color={isDark ? colors.gold : colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.title, { color: colors.text }]}>{link.title}</Text>
              <Text style={[type.caption, { color: colors.textSecondary }]}>{link.text}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.gold} />
          </Pressable>
        ))}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  categories: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  category: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryLabel: {
    fontFamily: fonts.card,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.card,
    fontSize: 15,
    lineHeight: 20,
  },
});
