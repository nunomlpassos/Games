export interface Passenger {
  id: number;
  row: number;
  col: number;
  patience: number;
  maxPatience: number;
  path: number[];
  targetCol: number;
}

export interface PathTile {
  row: number;
  col: number;
  active: boolean;
  connections: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
}

export interface Obstacle {
  id: number;
  row: number;
  col: number;
  type: "block";
  duration?: number;
}

export interface Level {
  gateCount: number;
  target: number;
  maxPassengers: number;
  timeLimit: number;
  patienceTime: number;
}