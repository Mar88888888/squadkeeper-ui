export const Position = {
  GK: 'GK',
  CB: 'CB',
  LB: 'LB',
  RB: 'RB',
  CDM: 'CDM',
  CM: 'CM',
  CAM: 'CAM',
  LW: 'LW',
  RW: 'RW',
  ST: 'ST',
} as const;

export type Position = (typeof Position)[keyof typeof Position];

export const POSITION_LABELS: Record<Position, string> = {
  GK: 'Goalkeeper',
  CB: 'Center Back',
  LB: 'Left Back',
  RB: 'Right Back',
  CDM: 'Defensive Midfielder',
  CM: 'Central Midfielder',
  CAM: 'Attacking Midfielder',
  LW: 'Left Winger',
  RW: 'Right Winger',
  ST: 'Striker',
};

export const POSITION_GROUPS = {
  GOALKEEPER: [Position.GK] as Position[],
  DEFENDER: [Position.CB, Position.LB, Position.RB] as Position[],
  MIDFIELDER: [Position.CDM, Position.CM, Position.CAM] as Position[],
  FORWARD: [Position.LW, Position.RW, Position.ST] as Position[],
} as const;

export function getPositionGroup(
  position: Position,
): 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD' {
  if (POSITION_GROUPS.GOALKEEPER.includes(position)) return 'GOALKEEPER';
  if (POSITION_GROUPS.DEFENDER.includes(position)) return 'DEFENDER';
  if (POSITION_GROUPS.MIDFIELDER.includes(position)) return 'MIDFIELDER';
  return 'FORWARD';
}

export const POSITIONS = Object.values(Position) as Position[];

export const DEFENSIVE_POSITIONS: Position[] = [
  Position.GK,
  Position.CB,
  Position.LB,
  Position.RB,
  Position.CDM,
];

export function isDefensivePosition(position: Position): boolean {
  return DEFENSIVE_POSITIONS.includes(position);
}

export const StrongFoot = {
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
  BOTH: 'BOTH',
} as const;

export type StrongFoot = (typeof StrongFoot)[keyof typeof StrongFoot];

export const STRONG_FOOT_LABELS: Record<StrongFoot, string> = {
  RIGHT: 'Right',
  LEFT: 'Left',
  BOTH: 'Both',
};

export const STRONG_FEET = Object.values(StrongFoot) as StrongFoot[];
