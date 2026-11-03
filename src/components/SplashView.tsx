import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedLogo from './AnimatedLogo';
import { Text } from './AppText';
import { images } from '../data/images';
import { fonts } from '../theme/typography';

type Props = {
  message: string;
};

/** Экран запуска с анимированным логотипом. Цвета не зависят от темы: это «обложка» приложения. */
export default function SplashView({ message }: Props) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <LinearGradient colors={['#123A9C', '#04060F'] as const} style={StyleSheet.absoluteFill} />
      <Image source={images.heroEarth} style={styles.earth} resizeMode="cover" />
      <LinearGradient colors={['#04060F', 'rgba(4, 6, 15, 0)'] as const} style={styles.earthFade} />

      <View style={styles.center}>
        <AnimatedLogo />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04060F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  earth: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    width: '100%',
    opacity: 0.85,
  },
  earthFade: {
    position: 'absolute',
    bottom: '25%',
    left: 0,
    right: 0,
    height: '20%',
  },
  center: {
    alignItems: 'center',
    marginBottom: '20%',
  },
  message: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
