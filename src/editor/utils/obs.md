```ts


class ComponentOwner<T> {
	set(data: IComponentWithData<any, T>): void { }

	getValue(): T { }
}

interface IComponentCtor<T, TComponent> {
	create(data: T): TComponent;
	update(component: TComponent, data: T): boolean;
	dispose(component: TComponent): void;
}

interface IComponentWithData<T, TResult> {
	ctor: IComponentCtor<T, TResult>;
	data: T;
}


type ResolveComponentWithData<T> = T extends IComponentWithData<any, infer TResult> ? TResult : T;
type Resolve<T> =  T extends IComponentWithData<any, infer TResult> ? TResult :
	T extends {} ? { [TKey in keyof T]: ResolveComponentWithData<T[TKey]> } : ResolveComponentWithData<T>;

function diffChanges<T>(fn: (reader: IReader) => T): IObservable<Resolve<T>> {

}



const owner = new ComponentOwner();

diffChanges(() => {

	//return obsFn(undefined);

	if (1 === 1) {
		return {
			foo: obsComp(1),
			bar: obsComp({
				bazz: 123
			}),
		};
	}

	return undefined;
});



function obsComp<T>(data: T): IComponentWithData<T, IObservable<T>> {

}

function derivedComp<T>(obs: IComponentWithData<T, IObservable<T>>): IComponentWithData<T, IObservable<T>> {}


```