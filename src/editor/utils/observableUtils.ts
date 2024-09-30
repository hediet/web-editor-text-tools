import { IObservable, derivedObservableWithCache, derived } from "vs/base/common/observable";

export function mapOutUndefined<T>(obs: IObservable<T | undefined>): IObservable<undefined | IObservable<T>> {
	const definedValue = derivedObservableWithCache<T>(undefined, (reader, lastValue) => {
		const value = obs.read(reader);
		if (!value) { return lastValue!; }
		return value;
	});

	return derived(reader => {
		const value = obs.read(reader);
		return !value ? undefined : definedValue;
	});
}
