import type { InfoPage } from '../api/types';
import { Text } from '../components/AppText';
import CallButton, { PROJECT_PHONE } from '../components/CallButton';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import ScreenScroll from '../components/ScreenScroll';
import StateView from '../components/StateView';
import { useApi } from '../hooks/useApi';
import { useI18n } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { type } from '../theme/typography';
import { formatPhone } from '../utils/format';

/** Со страницы можно перейти в соответствующий раздел приложения. */
const SECTION_LINKS: Record<string, { label: TranslationKey; go: (navigation: RootStackScreenProps<'InfoDetail'>['navigation']) => void }> = {
  schedule: { label: 'openSection', go: (n) => n.navigate('ServiceDetails', { serviceId: 'cal' }) },
  library: { label: 'openSection', go: (n) => n.navigate('Main', { screen: 'Library' }) },
  food: { label: 'openSection', go: (n) => n.navigate('ServiceDetails', { serviceId: 'food' }) },
  dormitory: { label: 'openSection', go: (n) => n.navigate('ServiceDetails', { serviceId: 'dorm' }) },
  transport: { label: 'openSection', go: (n) => n.navigate('Main', { screen: 'Transport' }) },
  sport: { label: 'openSection', go: (n) => n.navigate('ServiceDetails', { serviceId: 'sport' }) },
};

const WITH_CALL = ['contacts', 'support'];

export default function InfoDetailScreen({ navigation, route }: RootStackScreenProps<'InfoDetail'>) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { slug } = route.params;
  const { data, loading, error, reload } = useApi<{ pages: InfoPage[] }>('/api/info');
  const page = data?.pages.find((item) => item.slug === slug);
  const link = SECTION_LINKS[slug];

  return (
    <ScreenScroll title={page?.title ?? t('infoTitle')} onBack={navigation.goBack}>
      <StateView
        loading={loading}
        error={error}
        hasData={data !== null}
        empty={data !== null && !page}
        emptyTitle={t('noResultsTitle')}
        emptyText={t('infoPageMissing')}
        onRetry={() => void reload()}
      >
        <GlassCard>
          <Text style={[type.body, { color: colors.textSecondary }]}>{page?.body}</Text>
        </GlassCard>
        {link ? <PrimaryButton title={t(link.label)} arrow onPress={() => link.go(navigation)} /> : null}
        {WITH_CALL.includes(slug) ? (
          <GlassCard>
            <Text style={[type.subheading, { color: colors.text }]}>{t('contactProject')}</Text>
            <Text style={[type.body, { color: colors.textSecondary }]}>{formatPhone(PROJECT_PHONE)}</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{t('contactProjectNote')}</Text>
            <CallButton compact />
          </GlassCard>
        ) : null}
      </StateView>
    </ScreenScroll>
  );
}
