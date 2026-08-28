import { Platform } from 'react-native';
import { MapViewComponent as NativeMap } from './MapViewComponent.native';
import { MapViewComponent as WebMap } from './MapViewComponent.web';

export const MapViewComponent = Platform.OS === 'web' ? WebMap : NativeMap;
