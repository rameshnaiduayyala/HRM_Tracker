/**
 * Global Enterprise Currency & Localization Formatter
 * Supports INR (en-IN) default with dynamic ISO currency formatting.
 */
export function formatCurrency(
  amount,
  currencyCode = 'INR',
  locale = 'en-IN'
) {
  const numericAmount = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (e) {
    return `${currencyCode === 'INR' ? '₹' : currencyCode} ${numericAmount.toLocaleString()}`;
  }
}

export function formatNumber(value, locale = 'en-IN') {
  return (Number(value) || 0).toLocaleString(locale);
}
