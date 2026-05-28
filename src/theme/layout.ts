import { Dimensions, PixelRatio } from 'react-native';

const { width } = Dimensions.get('window');

export const SCREEN_WIDTH = width;

export const HORIZONTAL_PADDING = 20;
export const SECTION_GAP = 16;
export const CARD_RADIUS = 16;

export const TYPE_GRID_COLUMNS = 3;
export const TYPE_GRID_GAP = 10;

export const MIN_TOUCH_TARGET = 48;

export function scaleFont(size: number): number {
  const scale = Math.min(SCREEN_WIDTH / 412, 1.12);
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}
