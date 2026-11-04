// Kwoty w polskim formacie: "1 234,50 zł"
const moneyFormatter = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatMoney = (value) => `${moneyFormatter.format(Number(value) || 0)} zł`;
