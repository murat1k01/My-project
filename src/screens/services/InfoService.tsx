import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../../components/GlassCard';
import IconButton from '../../components/IconButton';
import SectionHeader from '../../components/SectionHeader';
import ServiceLayout from '../../components/ServiceLayout';
import { CONTACTS, FAQ, NEWS } from '../../data/info';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/metrics';
import { fonts, type } from '../../theme/typography';
import { addDays, formatDayMonth } from '../../utils/format';
import { openExternal } from '../../utils/links';
import type { ServiceScreenProps } from './types';

/** INFO — новости кампуса, контакты служб (звонок в одно касание) и частые вопросы. */
export default function InfoService({ service, onBack }: ServiceScreenProps) {
  const { colors } = useTheme();
  const { t, tr, language } = useI18n();
  const now = useNow();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <ServiceLayout service={service} onBack={onBack}>
      <SectionHeader title={t('infoNews')} />
      {NEWS.map((news) => (
        <View key={news.id} style={[styles.news, { borderColor: colors.border }]}>
          <ImageBackground source={news.image} style={styles.newsImage}>
            <LinearGradient colors={['rgba(4,6,15,0)', 'rgba(4,6,15,0.9)'] as const} style={StyleSheet.absoluteFill} />
            <View style={styles.newsDate}>
              <Text style={styles.newsDateText}>{formatDayMonth(addDays(now, -news.daysAgo), language)}</Text>
            </View>
            <Text style={styles.newsTitle}>{tr(news.title)}</Text>
          </ImageBackground>
          <Text style={[type.body, styles.newsText, { color: colors.textSecondary, backgroundColor: colors.glass }]}>{tr(news.text)}</Text>
        </View>
      ))}

      <SectionHeader title={t('infoContacts')} />
      <GlassCard style={styles.list}>
        {CONTACTS.map((contact, index) => (
          <View key={contact.id} style={[styles.contact, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={styles.flex}>
              <Text style={[type.bodyMedium, { color: colors.text }]}>{tr(contact.name)}</Text>
              <Text style={[type.caption, { color: colors.textSecondary }]}>{contact.phone}</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>{tr(contact.hours)}</Text>
            </View>
            <IconButton
              icon="call"
              variant="primary"
              accessibilityLabel={`${t('infoCall')}: ${tr(contact.name)}`}
              onPress={() => {
                const url = `tel:${contact.phone.replace(/\s/g, '')}`;
                void openExternal(url, { title: t('linkErrorTitle'), text: t('linkErrorText', { url: contact.phone }) });
              }}
            />
          </View>
        ))}
      </GlassCard>

      <SectionHeader title={t('infoFaq')} />
      {FAQ.map((item) => {
        const open = openFaq === item.id;
        return (
          <GlassCard key={item.id} style={styles.faq}>
            <Pressable
              onPress={() => setOpenFaq(open ? null : item.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              style={styles.faqHeader}
            >
              <Text style={[type.bodyMedium, styles.flex, { color: colors.text }]}>{tr(item.question)}</Text>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </Pressable>
            {open ? <Text style={[type.body, { color: colors.textSecondary }]}>{tr(item.answer)}</Text> : null}
          </GlassCard>
        );
      })}
    </ServiceLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 2,
  },
  news: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 170,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  newsDate: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  newsDateText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: '#0A0F24',
  },
  newsTitle: {
    fontFamily: fonts.medium,
    fontSize: 19,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  newsText: {
    padding: spacing.lg,
  },
  list: {
    gap: 0,
    paddingVertical: spacing.xs,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  faq: {
    gap: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 32,
  },
});
