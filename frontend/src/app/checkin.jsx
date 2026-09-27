import { useLocalSearchParams } from 'expo-router';
import CheckinFlow from '../screens/CheckinFlow';

// Open /checkin?adventureId=<a saved adventure UUID>.
export default function CheckinRoute() {
  const { adventureId } = useLocalSearchParams();
  const id = typeof adventureId === 'string' ? adventureId.trim() : '';
  // A different adventure gets fresh screen state, never the previous progress.
  return <CheckinFlow key={id} adventureId={id} />;
}
