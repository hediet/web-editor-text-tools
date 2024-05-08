import { DisposableStore, IDisposable } from "vs/base/common/lifecycle";


export class Disposable implements IDisposable {
    protected readonly _store = new DisposableStore();

    protected _register<T extends IDisposable | undefined>(item: T): T {
        if (!item) { return undefined!; }
        return this._store.add(item);
    }

    dispose() {
        this._store.dispose();
    }
}
