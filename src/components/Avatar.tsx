import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme/typography';
import { getInitials, pickAvatarColor } from '../utils/format';

type Props = {
  firstName: string;
  lastName: string;
  /** Строка для выбора стабильного цвета (обычно id записи) */
  seed: string;
  size?: number;
};

export default function Avatar({ firstName, lastName, seed, size = 48 }: Props) {
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: pickAvatarColor(seed) }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{getInitials(firstName, lastName)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
  },
});
