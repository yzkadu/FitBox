// Chart color roles, following the dataviz skill's validated dark palette
// (dark categorical steps + dark chart chrome). This app is dark-only, so
// only the dark values are needed.

export const chartColors = {
  surface: '#15161d', // matches app --surface, close enough to the validated dark surface
  gridline: '#2a2c38', // app --border
  axis: '#62667a', // app --text-faint (muted ink)
  textSecondary: '#9497a8',
  categorical: {
    blue: '#3987e5',
    orange: '#d95926',
    aqua: '#199e70',
    yellow: '#c98500',
    magenta: '#d55181',
    green: '#008300',
    violet: '#9085e9',
    red: '#e66767',
  },
  status: {
    good: '#0ca30c',
    warning: '#fab219',
    critical: '#d03b3b',
  },
} as const;

/** Fixed categorical order for multi-series charts (never cycle/reassign per filter) */
export const seriesOrder = [
  chartColors.categorical.blue,
  chartColors.categorical.orange,
  chartColors.categorical.aqua,
  chartColors.categorical.yellow,
];

export const tooltipStyle = {
  background: '#1d1f28',
  border: '1px solid #2a2c38',
  borderRadius: 12,
  fontSize: 12,
  padding: '8px 10px',
  color: '#f4f4f6',
};
