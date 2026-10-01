export const formatDate = (isoStr: string | undefined | null, locale: string = 'es-ES'): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
};

export const formatFullDate = (isoStr: string | undefined | null, locale: string = 'es-ES'): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    return d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};
