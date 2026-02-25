
export type Scenario = 'Actual' | 'Budget' | 'Forecast' | 'Staging';
export type Version = 'V1' | 'V2' | 'Working' | 'Final';

export interface TimeRange {
  startYear: number;
  startPeriod: number;
  endYear: number;
  endPeriod: number;
}

export type UDFieldType = 'STRING' | 'NUMBER' | 'LIST' | 'DIMENSION' | 'TIME' | 'USER';

export interface UDField {
  id: string;
  code: string;
  name: string;
  logicalName: string;
  physicalBinding: string;
  type: UDFieldType;
  config?: {
    precision?: number;
    scale?: number;
    min?: number;
    max?: number;
    isPercentage?: boolean;
    listSource?: string;
  };
}

export interface DimensionNode {
  id: string;
  code: string;
  name: string;
  type: 'Total' | 'Member' | 'Leaf';
  children: DimensionNode[];
  validFrom: TimeRange;
  validTo: TimeRange;
  properties: Record<string, any>;
}

export interface Subset {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdBy: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface AppContext {
  scenario: Scenario;
  version: Version;
  years: number[];
  periods: number[];
}

export interface SyncRecord {
  id: string;
  time: string;
  executor: string;
  status: 'SUCCESS' | 'FAILED';
  count: number;
}

export interface MappingField {
  sourceCode: string;
  sourceName: string;
  targetMapping: string;
}
