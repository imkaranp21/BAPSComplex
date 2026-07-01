export type SpaceId = 'gym' | 'cricket-futsal' | 'volleyball' | 'table-tennis' | 'pool-table' | 'darts';

export interface SpaceUnit {
  id: string;
  name: string;
  status: 'open' | 'in-use';
}

export interface Space {
  id: SpaceId;
  name: string;
  description: string;
  available: number;
  total: number;
  status: 'open' | 'full';
  activities: string[];
  units?: SpaceUnit[];
  hasCapacity?: boolean;
}

export const SPACES: Space[] = [
  {
    id: 'gym',
    name: 'Gym',
    description: 'Fully equipped fitness center',
    available: 18,
    total: 30,
    status: 'open',
    activities: ['Gym', 'Fitness'],
    hasCapacity: true,
  },
  {
    id: 'cricket-futsal',
    name: 'Cricket / Futsal',
    description: 'Multi-use indoor court',
    available: 1,
    total: 1,
    status: 'open',
    activities: ['Cricket', 'Futsal'],
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    description: '1 court available',
    available: 1,
    total: 1,
    status: 'open',
    activities: ['Volleyball'],
  },
  {
    id: 'table-tennis',
    name: 'Table Tennis',
    description: '2 tables available',
    available: 2,
    total: 2,
    status: 'open',
    activities: ['Table Tennis'],
    units: [
      { id: 'tt-1', name: 'Table 1', status: 'open' },
      { id: 'tt-2', name: 'Table 2', status: 'open' },
    ],
  },
  {
    id: 'pool-table',
    name: 'Pool Table',
    description: '1 table available',
    available: 1,
    total: 1,
    status: 'open',
    activities: ['Pool'],
    units: [
      { id: 'pool-1', name: 'Table 1', status: 'open' },
    ],
  },
  {
    id: 'darts',
    name: 'Darts',
    description: 'Darts area',
    available: 1,
    total: 1,
    status: 'open',
    activities: ['Darts'],
  },
];

export const ALL_ACTIVITIES = ['Gym', 'Cricket', 'Futsal', 'Volleyball', 'Table Tennis', 'Pool', 'Darts'];

export function getSpace(id: SpaceId): Space {
  return SPACES.find(s => s.id === id)!;
}
