import type { RootStackScreenProps } from '../navigation/types';
import ListingsView from './ListingsView';

/** Lost & Found: потерянные и найденные вещи, связь с автором — через встроенный чат. */
export default function LostFoundScreen({ navigation }: RootStackScreenProps<'LostFound'>) {
  return <ListingsView mode="lostfound" onBack={navigation.goBack} onWrite={(userId, name) => navigation.navigate('Chat', { userId, name })} />;
}
