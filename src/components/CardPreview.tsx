import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { useI18n } from '../i18n/LanguageContext';
import { fonts } from '../theme/typography';

type Props = {
  /** Только цифры номера (до 16) */
  digits: string;
  holder: string;
  month: string;
  year: string;
  /** Маленькая карточка для списка привязанных карт */
  compact?: boolean;
};

/** Номер с маской: недостающие цифры показаны точками, по 4 в группе */
function maskNumber(digits: string) {
  const padded = digits.padEnd(16, '•');
  return padded.replace(/(.{4})(?=.)/g, '$1 ');
}

/** Внешний вид банковской карты, который заполняется по мере ввода. Ничего не хранит и никуда не отправляет. */
export default function CardPreview({ digits, holder, month, year, compact }: Props) {
  const { t } = useI18n();
  const [appear] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [appear]);

  const style = {
    opacity: appear,
    transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }, { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
  };

  return (
    <Animated.View style={[styles.shadow, compact && styles.compactWrap, style]}>
      <LinearGradient colors={['#1E3A8A', '#2F6BFF', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, compact && styles.compact]}>
        <View style={styles.glow} />
        <View style={styles.top}>
          <View style={styles.chip} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>TEST</Text>
          </View>
          <Ionicons name="wifi" size={compact ? 16 : 22} color="rgba(255,255,255,0.85)" style={styles.contactless} />
        </View>
        <Text style={[styles.number, compact && styles.numberCompact]} numberOfLines={1} adjustsFontSizeToFit>
          {maskNumber(digits)}
        </Text>
        <View style={styles.bottom}>
          <View style={styles.flex}>
            <Text style={styles.caption}>{t('payHolder')}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {holder.trim() || '—'}
            </Text>
          </View>
          <View>
            <Text style={styles.caption}>{t('payExpires')}</Text>
            <Text style={styles.value}>
              {month || 'MM'}/{year ? year.slice(-2) : 'YY'}
            </Text>
          </View>
          <Text style={[styles.visa, compact && styles.visaCompact]}>VISA</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 20,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  compactWrap: {
    borderRadius: 14,
  },
  card: {
    aspectRatio: 1.586,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  compact: {
    borderRadius: 14,
    padding: 14,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -90,
    top: -110,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#F5C451',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
  },
  contactless: {
    marginLeft: 'auto',
    transform: [{ rotate: '90deg' }],
  },
  number: {
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
    fontSize: 22,
    letterSpacing: 2,
  },
  numberCompact: {
    fontSize: 16,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  caption: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  visa: {
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
    fontSize: 24,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  visaCompact: {
    fontSize: 18,
  },
});
