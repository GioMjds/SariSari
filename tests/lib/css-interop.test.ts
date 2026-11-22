import { Image } from 'expo-image';
import { interopComponents } from 'react-native-css-interop/dist/runtime/api';
import '@/lib/css-interop';

describe('css-interop', () => {
  it('registers expo-image so className sizes product photos', () => {
    expect(interopComponents.has(Image)).toBe(true);
  });
});
