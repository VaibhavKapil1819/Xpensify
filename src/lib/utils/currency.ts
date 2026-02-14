/**
 * Formats a numeric amount into a currency string based on the user's preferred currency.
 * 
 * @param amount - The numeric value to format
 * @param currencyCode - The ISO currency code (USD, INR, EUR, GBP)
 * @returns A formatted currency string
 */
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
    const locales: Record<string, string> = {
        USD: 'en-US',
        INR: 'en-IN',
        EUR: 'de-DE',
        GBP: 'en-GB',
    };

    const locale = locales[currencyCode] || 'en-US';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};
