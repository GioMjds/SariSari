// Minimal ambient types for `better-sqlite3` so test files don't need
// `@types/better-sqlite3` as a devDep. Covers only the surface we use in
// `tests/__setup__/expo-sqlite-mock.ts` and its consumers.
declare module 'better-sqlite3' {
	export interface RunResult {
		changes: number;
		lastInsertRowid: number | bigint;
	}
	export interface Statement<BindParameters extends any[] = any[]> {
		run(...params: BindParameters): RunResult;
		get(...params: BindParameters): any;
		all(...params: BindParameters): any[];
	}
	export = class Database {
		constructor(filename: string);
		exec(sql: string): void;
		prepare<BindParameters extends any[] = any[]>(sql: string): Statement<BindParameters>;
		pragma(source: string): any;
		transaction<T extends (...args: any[]) => any>(fn: T): T;
	};
}