import { Dimensions, PixelRatio } from 'react-native';

// Base design dimensions (standard mobile: iPhone 14 / similar Android)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale based on width (for horizontal sizing, padding, margins, font sizes)
export const wp = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Scale based on height (for vertical sizing)
export const hp = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Moderate scale — blends width scale with a factor to avoid extremes on tablets
export const ms = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (scale - 1) * size * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Font scaling (moderate so text doesn't get too large on tablets)
export const fs = (size: number): number => ms(size, 0.3);

// Width as percentage of screen
export const widthPercent = (percent: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percent) / 100));

// Height as percentage of screen
export const heightPercent = (percent: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percent) / 100));

// Device type detection
export const isTablet = SCREEN_WIDTH >= 600;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
