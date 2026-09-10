import { CurrencyCode, CurrencyConfig } from './types';

// Default exchange rate baselines against USD (1 USD = ...)
export const DEFAULT_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    name: 'دولار أمريكي',
    symbol: '$',
    rateToUSD: 1.0,
  },
  SAR: {
    code: 'SAR',
    name: 'ريال سعودي',
    symbol: 'ر.س',
    rateToUSD: 3.75, // 1 USD = 3.75 SAR
  },
  YER_ADEN: {
    code: 'YER_ADEN',
    name: 'ريال يمني (عدن والمحافظات الجنوبية)',
    symbol: 'ر.ي (عدن)',
    rateToUSD: 1910.0, // 1 USD = ~1910 YER (Aden market)
  },
  YER_SANAA: {
    code: 'YER_SANAA',
    name: 'ريال يمني (صنعاء والمحافظات الشمالية)',
    symbol: 'ر.ي (صنعاء)',
    rateToUSD: 535.0, // 1 USD = ~535 YER (Sanaa market)
  },
};

/**
 * Converts an amount from source currency to target currency using store-specific custom rates or defaults.
 */
export function convertCurrency(
  amount: number,
  fromCode: CurrencyCode,
  toCode: CurrencyCode,
  customRates?: any
): number {
  if (fromCode === toCode) return amount;

  // 1. If customRates is a nested profile mapped by base currency:
  // e.g. { SAR: { YER_ADEN: 500, USD: 0.26 }, USD: { YER_ADEN: 1900 } }
  if (customRates) {
    // Check if we have a direct rate from -> to
    if (customRates[fromCode] && typeof customRates[fromCode] === 'object') {
      const directRate = customRates[fromCode][toCode];
      if (directRate && directRate > 0) {
        return Math.round(amount * directRate * 100) / 100;
      }
    }
    // Check if we have a direct rate to -> from (reverse calculation)
    if (customRates[toCode] && typeof customRates[toCode] === 'object') {
      const reverseRate = customRates[toCode][fromCode];
      if (reverseRate && reverseRate > 0) {
        return Math.round((amount / reverseRate) * 100) / 100;
      }
    }
  }

  // 2. Fallback to old flat map logic (rates relative to USD)
  // If customRates is nested, this flat fallback might not find the keys, which is fine, it will use defaults.
  const flatRates = (customRates && typeof customRates[fromCode] !== 'object') ? customRates : {};
  const rateFrom = flatRates?.[fromCode] ?? DEFAULT_CURRENCIES[fromCode]?.rateToUSD ?? 1.0;
  const rateTo = flatRates?.[toCode] ?? DEFAULT_CURRENCIES[toCode]?.rateToUSD ?? 1.0;

  // Convert from source to USD baseline, then from USD to target
  const amountInUSD = amount / rateFrom;
  const converted = amountInUSD * rateTo;

  return Math.round(converted * 100) / 100;
}

/**
 * Format formatted currency string with locale and symbol.
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode,
  customRates?: any
): string {
  const symbol = DEFAULT_CURRENCIES[currencyCode]?.symbol || currencyCode;
  
  // Format numbers with commas (e.g. 15,000 ر.ي)
  const formattedNum = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);

  return `${formattedNum} ${symbol}`;
}
