// ----------------------------------------------------------------------

export function fNumber(number) {
  return number.toLocaleString();
}

// ----------------------------------------------------------------------

export function fPercent(number) {
  return `${number.toFixed(1)}%`;
}

// ----------------------------------------------------------------------

export function fCurrency(number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(number);
}

// ----------------------------------------------------------------------

export function fShortenNumber(number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(number);
}
