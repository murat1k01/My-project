import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { useI18n } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/metrics';
import { type } from '../theme/typography';
import type { IoniconName } from '../types/Service';
import EmptyState from './EmptyState';

type Props = {
  loading: boolean;
  error: string | null;
  /** true, если данные загружены, но список пуст */
  empty?: boolean;
  /** Есть ли уже загруженные данные: тогда ошибка не скрывает их */
  hasData: boolean;
  onRetry: () => void;
  emptyIcon?: IoniconName;
  emptyTitle?: string;
  emptyText?: string;
  children: ReactNode;
};

/** Единые состояния загрузки, ошибки и пустого списка для всех экранов с данными сервера. */
export default function StateView({ loading, error, empty, hasData, onRetry, emptyIcon = 'file-tray-outline', emptyTitle, emptyText = '', children }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!hasData && loading) {
    return (
      <View style={styles.center} accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('loading')}</Text>
      </View>
    );
  }
  if (!hasData && error) {
    return <EmptyState icon="cloud-offline-outline" title={t('errorTitle')} message={error} actionLabel={t('retry')} onAction={onRetry} />;
  }
  return (
    <>
      {error ? (
        <View style={[styles.banner, { backgroundColor: colors.warningSoft }]} accessibilityLiveRegion="polite">
          <Text style={[type.caption, styles.flex, { color: colors.warning }]} onPress={onRetry}>
            {error} {t('retry')}
          </Text>
        </View>
      ) : null}
      {empty ? <EmptyState icon={emptyIcon} title={emptyTitle ?? ''} message={emptyText} /> : children}
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  banner: {
    padding: spacing.md,
    borderRadius: 12,
  },
  flex: {
    flex: 1,
  },
});
