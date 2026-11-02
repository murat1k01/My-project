import { Image, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { fonts } from '../theme/typography';
import { getInitials, pickAvatarColor } from '../utils/format';

type Props = {
  firstName: string;
  lastName: string;
  /** Строка для выбора стабильного цвета (обычно id записи) */
  seed: string;
  size?: number;
  photo?: string | null;
};

export default function Avatar({ firstName, lastName, seed, size = 48, photo }: Props) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (photo) {
    return <Image source={{ uri: photo }} style={[styles.circle, shape]} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[styles.circle, shape, { backgroundColor: pickAvatarColor(seed) }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
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
