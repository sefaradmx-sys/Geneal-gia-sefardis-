export type SeriesPoint = {
  day: string;
  favorability_index: number | null;
  pct_negative: number;
  volume: number;
};

export type Slice = {
  key: string;
  volume: number;
  pct_positive: number;
  pct_negative: number;
  pct_neutral: number;
  favorability_index: number | null;
};

export type TargetSummary = {
  id: string;
  name: string;
  kind: string;
  comparable: boolean;
  pct_positive: number;
  pct_negative: number;
  pct_neutral: number;
  favorability_index: number | null;
  volume: number;
  reach: number;
  share_of_voice: number;
  review_count: number;
  series: SeriesPoint[];
  by_source: Slice[];
  by_geo: Slice[];
};

export type Preference = {
  left_name: string;
  right_name: string;
  delta: number;
  interval: number;
  n: number;
  reasons: string[];
  headline: string;
};

export type Evidence = {
  id: string;
  text: string;
  source: string;
  published_at: string;
  sentiment: string;
  stance: string;
  weight: number;
  url: string | null;
  author_handle: string | null;
  theme: string | null;
  municipality: string | null;
};

export type StudySummary = {
  study_id: string;
  name: string;
  description: string;
  window_start: string;
  window_end: string;
  disclaimer: string;
  known_biases: string[];
  is_demo: boolean;
  targets: TargetSummary[];
  preferences: Preference[];
  alerts: { target_name: string; message: string; delta_points: number }[];
  evidence: Evidence[];
  methodology: {
    n: number;
    sources: string[];
    half_life_days: number;
    neutral_factor: number;
    min_confidence: number;
    formula: string;
  };
};

export type StudyListItem = {
  id: string;
  name: string;
  description: string;
  window_start: string;
  window_end: string;
  is_demo: boolean;
  target_count: number;
};
