import { StyleSheet, View } from 'react-native';
import WheelPager, {
  WheelPage,
} from '../components/wheel/WheelPager';

const pages: WheelPage[] = [
  {
    id: '01',
    title: 'Discover',
    description: 'Explore something new.',
    backgroundColor: '#312E81',
  },
  {
    id: '02',
    title: 'Explore',
    description: 'Find what interests you.',
    backgroundColor: '#065F46',
  },
  {
    id: '03',
    title: 'Create',
    description: 'Bring your ideas to life.',
    backgroundColor: '#9A3412',
  },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <WheelPager pages={pages} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});