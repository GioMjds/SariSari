import { getProductInitials } from '../ProductThumb';

describe('getProductInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getProductInitials('lucky me pancit canton')).toBe('LM');
  });

  it('handles single words and extra whitespace', () => {
    expect(getProductInitials('  Coke  ')).toBe('C');
  });

  it('falls back to a question mark for blank names', () => {
    expect(getProductInitials('   ')).toBe('?');
  });
});
