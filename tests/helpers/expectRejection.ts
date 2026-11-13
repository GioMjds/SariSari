/**
 * Asserts that a promise rejects, optionally with a message containing
 * `message`.
 *
 * better-sqlite3 is a native addon that is loaded once per jest worker and
 * builds its SqliteError class in the realm of the first test file that
 * throws. In later test files that error is not `instanceof` their `Error`,
 * so jest's `rejects.toThrow()` reports "Received function did not throw".
 * This helper checks rejection and message without relying on the realm.
 */
export const expectRejection = async (
  promise: Promise<unknown>,
  message?: string,
): Promise<void> => {
  let rejected = false;
  let caught: unknown;
  try {
    await promise;
  } catch (err) {
    rejected = true;
    caught = err;
  }
  expect(rejected).toBe(true);
  if (message !== undefined) {
    const text =
      typeof caught === 'object' && caught !== null && 'message' in caught
        ? String((caught as { message: unknown }).message)
        : String(caught);
    expect(text).toContain(message);
  }
};
