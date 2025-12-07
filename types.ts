export interface TreeConfig {
  rotationSpeed: number;
  lightIntensity: number;
  ornamentColor: string;
  isSnowing: boolean;
  showGarland: boolean;
  treeState: 'CHAOS' | 'FORMED';
}

export type ActionType = 
  | { type: 'SET_ROTATION_SPEED'; payload: number }
  | { type: 'SET_LIGHT_INTENSITY'; payload: number }
  | { type: 'SET_ORNAMENT_COLOR'; payload: string }
  | { type: 'TOGGLE_SNOW'; payload: boolean }
  | { type: 'TOGGLE_GARLAND'; payload: boolean }
  | { type: 'SET_TREE_STATE'; payload: 'CHAOS' | 'FORMED' };

export const INITIAL_CONFIG: TreeConfig = {
  rotationSpeed: 0.2,
  lightIntensity: 1.2,
  ornamentColor: '#D4AF37', // Gold 500
  isSnowing: true,
  showGarland: true,
  treeState: 'FORMED', 
};