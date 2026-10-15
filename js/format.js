// Formatting helpers. Formatters are created once because building an
// Intl formatter is far more expensive than calling .format() on one.

const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat('en');

const percentFormatter = new Intl.NumberFormat('en', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// Publish dates are calendar days stored as UTC midnight. Formatting in UTC
// stops viewers west of Greenwich from seeing every date shifted back a day.
const longDateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const shortDateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** 1234567 -> "1.2M" */
export const formatCompact = (value) => compactFormatter.format(value);

/** 1234567 -> "1,234,567" */
export const formatInteger = (value) => integerFormatter.format(value);

/** 0.0567 -> "5.7%" */
export const formatPercent = (ratio) => percentFormatter.format(ratio);

/** timestamp -> "Oct 3, 2026" */
export const formatDate = (timestamp) => longDateFormatter.format(timestamp);

/** timestamp -> "Oct 3" */
export const formatShortDate = (timestamp) => shortDateFormatter.format(timestamp);
