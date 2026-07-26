/**
 * Global Enterprise Currency & Localization Formatter.
 * Defaults to en-IN and INR while allowing tenant-specific locale/currency.
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
  } catch {
    return `${currencyCode} ${numericAmount.toLocaleString(locale)}`;
  }
}

export function formatNumber(value, locale = 'en-IN') {
  return (Number(value) || 0).toLocaleString(locale);
}
