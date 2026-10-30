import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  children: ReactNode;
  /**
   * Какие края учитывать. На вкладках нижний отступ уже даёт панель навигации,
   * поэтому по умолчанию — только верх.
   */
  edges?: Edge[];
};

/** Общая обёртка экрана: фон темы с синим свечением сверху + безопасные области. */
export default function ScreenContainer({ children, edges = ['top', 'left', 'right'] }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.glow, colors.background] as const} style={styles.glow} pointerEvents="none" />
      <SafeAreaView edges={edges} style={styles.flex}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
    opacity: 0.85,
  },
});
