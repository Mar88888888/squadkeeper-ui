import { Position } from './player.constants';

// Game format enum values
export const GameFormat = {
  FIVE_A_SIDE: '4+1',
  NINE_A_SIDE: '8+1',
  ELEVEN_A_SIDE: '10+1',
} as const;

export type GameFormat = (typeof GameFormat)[keyof typeof GameFormat];

// Game format labels for display
export const GAME_FORMAT_LABELS: Record<GameFormat, string> = {
  '4+1': '4+1 (5 players)',
  '8+1': '8+1 (9 players)',
  '10+1': '10+1 (11 players)',
};

// Game format configs
export const GAME_FORMAT_CONFIG: Record<
  GameFormat,
  {
    totalPlayers: number;
    fieldPlayers: number;
    label: string;
    description: string;
    recommendedAges: string;
  }
> = {
  '4+1': {
    totalPlayers: 5,
    fieldPlayers: 4,
    label: '4+1',
    description: '5-a-side format',
    recommendedAges: 'U-8, U-9',
  },
  '8+1': {
    totalPlayers: 9,
    fieldPlayers: 8,
    label: '8+1',
    description: '9-a-side format',
    recommendedAges: 'U-10, U-11, U-12',
  },
  '10+1': {
    totalPlayers: 11,
    fieldPlayers: 10,
    label: '10+1',
    description: '11-a-side format',
    recommendedAges: 'U-13+',
  },
};

// All game formats as array for dropdowns
export const GAME_FORMATS = Object.values(GameFormat) as GameFormat[];

// Default formation positions for each format
// Half-field view: Y=0 at top (attacking), Y=100 at bottom (our goal with GK)
// X: 0=left, 100=right
export const DEFAULT_FORMATIONS: Record<
  GameFormat,
  Array<{ x: number; y: number; role: Position }>
> = {
  '4+1': [
    { x: 50, y: 92, role: Position.GK },
    { x: 25, y: 65, role: Position.LB },
    { x: 75, y: 65, role: Position.RB },
    { x: 30, y: 35, role: Position.LW },
    { x: 70, y: 35, role: Position.RW },
  ],
  '8+1': [
    { x: 50, y: 92, role: Position.GK },
    { x: 20, y: 75, role: Position.LB },
    { x: 50, y: 78, role: Position.CB },
    { x: 80, y: 75, role: Position.RB },
    { x: 35, y: 50, role: Position.CM },
    { x: 65, y: 50, role: Position.CM },
    { x: 20, y: 25, role: Position.LW },
    { x: 80, y: 25, role: Position.RW },
    { x: 50, y: 15, role: Position.ST },
  ],
  '10+1': [
    { x: 50, y: 92, role: Position.GK },
    { x: 15, y: 75, role: Position.LB },
    { x: 38, y: 80, role: Position.CB },
    { x: 62, y: 80, role: Position.CB },
    { x: 85, y: 75, role: Position.RB },
    { x: 30, y: 55, role: Position.CM },
    { x: 50, y: 60, role: Position.CDM },
    { x: 70, y: 55, role: Position.CM },
    { x: 20, y: 25, role: Position.LW },
    { x: 80, y: 25, role: Position.RW },
    { x: 50, y: 12, role: Position.ST },
  ],
};
