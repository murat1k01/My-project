import type { RootStackScreenProps } from '../navigation/types';
import ListingsView from './ListingsView';

/** ALT Marketplace: студенты продают и покупают учебники, технику и канцелярию. */
export default function MarketplaceScreen({ navigation }: RootStackScreenProps<'Marketplace'>) {
  return <ListingsView mode="market" onBack={navigation.goBack} onWrite={(userId, name) => navigation.navigate('Chat', { userId, name })} />;
}
