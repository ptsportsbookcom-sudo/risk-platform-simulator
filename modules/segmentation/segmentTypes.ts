export type SegmentType = "static" | "dynamic";

export type SegmentMatchMode = "all" | "any";

export type SegmentConditionOperator = ">" | "<" | "=" | "in" | "not_in";

export interface SegmentCondition {
  field: string;
  operator: SegmentConditionOperator;
  value: number | string | string[];
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  createdAt: number;
  // New segmentation capabilities
  type?: SegmentType; // default: "static"
  matchMode?: SegmentMatchMode; // default: "all"
  conditions?: SegmentCondition[];
  includePlayers?: string[];
  excludePlayers?: string[];
}

