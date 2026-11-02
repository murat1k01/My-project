import { useI18n } from '../i18n/LanguageContext';
import { formatPhone, phoneHref } from '../utils/format';
import { openExternal } from '../utils/links';
import PrimaryButton from './PrimaryButton';

/** Контактный номер проекта. Это не официальный номер университета. */
export const PROJECT_PHONE = '77471543655';

/**
 * Открывает системный набор номера с уже введённым номером.
 * Сам звонок запускает пользователь в приложении «Телефон»: приложение не звонит и не знает, состоялся ли он.
 */
export default function CallButton({ phone = PROJECT_PHONE, compact = false }: { phone?: string; compact?: boolean }) {
  const { t } = useI18n();
  const href = phoneHref(phone);

  return (
    <PrimaryButton
      title={t('callStudent')}
      icon="call-outline"
      compact={compact}
      onPress={() => void openExternal(href, { title: t('linkErrorTitle'), text: t('linkErrorText', { url: formatPhone(phone) }) })}
    />
  );
}
