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
  customRates?: Partial<Record<CurrencyCode, number>>
): number {
  if (fromCode === toCode) return amount;

  const rateFrom = customRates?.[fromCode] ?? DEFAULT_CURRENCIES[fromCode]?.rateToUSD ?? 1.0;
  const rateTo = customRates?.[toCode] ?? DEFAULT_CURRENCIES[toCode]?.rateToUSD ?? 1.0;

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
  customRates?: Partial<Record<CurrencyCode, number>>
): string {
  const symbol = DEFAULT_CURRENCIES[currencyCode]?.symbol || currencyCode;
  
  // Format numbers with commas (e.g. 15,000 ر.ي)
  const formattedNum = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);

  return `${formattedNum} ${symbol}`;
}
