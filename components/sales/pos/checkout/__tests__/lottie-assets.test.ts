// Hand-authored Lottie files crash the native renderer when malformed, so check their shape here.
const files = {
  sale: require('../../../../../assets/lottie/sale-recorded.json'),
  utang: require('../../../../../assets/lottie/utang-recorded.json'),
};

describe.each(Object.entries(files))('%s Lottie asset', (_name, anim) => {
  it('has the expected canvas and timing', () => {
    expect(typeof anim.v).toBe('string');
    expect(anim).toMatchObject({ fr: 60, ip: 0, op: 96, w: 200, h: 200 });
  });

  it('has shape layers that stay inside the timeline', () => {
    expect(anim.layers.length).toBeGreaterThan(0);
    for (const layer of anim.layers) {
      expect(layer.ty).toBe(4);
      expect(layer.op).toBeLessThanOrEqual(anim.op);
      expect(layer.shapes.length).toBeGreaterThan(0);
    }
  });
});
