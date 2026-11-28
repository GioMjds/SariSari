import { capPayment } from '../paymentMath';

describe('capPayment', () => {
  it('records the full amount when it is under the balance', () => {
    expect(capPayment(200, 320)).toEqual({ recorded: 200, change: 0 });
  });

  it('caps at the balance and returns the change', () => {
    expect(capPayment(500, 320)).toEqual({ recorded: 320, change: 180 });
  });

  it('caps a Quick Settle amount at that one credit', () => {
    expect(capPayment(100, 45.5)).toEqual({ recorded: 45.5, change: 54.5 });
  });

  it('records nothing when nothing is owed', () => {
    expect(capPayment(50, 0)).toEqual({ recorded: 0, change: 50 });
  });
});
