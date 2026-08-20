export function formatLocalBackupTimestamp(
  createdAt: number,
  language: string,
): string {
  const locale = language === 'tl' ? 'fil-PH' : 'en-PH';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(createdAt));
}
