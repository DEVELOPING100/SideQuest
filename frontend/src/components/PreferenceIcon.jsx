import Svg, { Path, Circle } from 'react-native-svg';
import Feather from '@expo/vector-icons/Feather';

// Thin outline icons matching the planning reference, using the existing SVG runtime.
export default function PreferenceIcon({ name, size = 21, color = '#173E39' }) {
  const paths = {
    utensils: 'M4 3v6c0 3 6 3 6 0V3M7 3v18M17 21V3c-4 3-4 8 0 9',
    tree: 'M12 2 8 8h2l-5 6h5v7h4v-7h5l-5-6h2Z',
    palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.5-3.3 1.6 1.6 0 0 1 1.3-2.7H18a4 4 0 0 0 4-4c0-4.4-4.5-8-10-8Z',
    sparkles: 'm9 2 2 6 5 2-5 2-2 6-2-6-5-2 5-2ZM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z',
  };
  if (!paths[name]) return <Feather name={name} size={size} color={color} />;
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d={paths[name]} />
    {name === 'palette' && <>{[[7,9],[11,6],[16,7],[6,14]].map(([cx,cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={0.65} fill={color} strokeWidth={0} />)}</>}
  </Svg>;
}
