// Lokalny awatar zastępczy (wcześniej używany był niedziałający serwis via.placeholder.com).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dfe6ee"/><circle cx="50" cy="38" r="18" fill="#8fa3b8"/><path d="M18 88c4-18 18-28 32-28s28 10 32 28" fill="#8fa3b8"/></svg>`;

export const DEFAULT_AVATAR = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
