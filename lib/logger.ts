/**
 * Structured logger for offline-first client.
 *
 * Why this exists: the app runs without a backend, so traditional
 * request-scoped tracing does not apply. We still need stable,
 * queryable events when something goes wrong (e.g., the Step 01
 * Utang toggle freeze). Every event uses a JSON shape so future
 * sinks (Sentry, OTel, file dump) can drop in without changing
 * call sites.
 *
 * Rules baked into the API:
 *   - `event` is required; built from snake_case verbs.
 *   - `feature` is the area of the app (e.g. 'checkout', 'cart').
 *   - Dev-only emission by default; production would route to a sink.
 *   - Never logs Object instances or unknown fields directly —
 *     callers are expected to pass primitives.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
  /** Stable, snake_case event name. Required for querying. */
  event: string;
  /** Subsystem tag, e.g. 'checkout', 'cart', 'cash_session'. */
  feature?: string;
  /** Any other structured fields. Keep cardinality low. */
  [key: string]: unknown;
}

const PROD = !__DEV__;

function emit(level: LogLevel, fields: LogFields, msg: string): void {
  if (level === 'debug' && PROD) return;
  const payload = JSON.stringify({
    ts: Date.now(),
    level,
    ...fields,
    msg,
  });
  const line = `[${level}] ${payload}`;
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug(fields: LogFields, msg?: string): void {
    emit('debug', fields, msg ?? fields.event);
  },
  info(fields: LogFields, msg?: string): void {
    emit('info', fields, msg ?? fields.event);
  },
  warn(fields: LogFields, msg?: string): void {
    emit('warn', fields, msg ?? fields.event);
  },
  error(fields: LogFields, msg?: string): void {
    emit('error', fields, msg ?? fields.event);
  },
};
