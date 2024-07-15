import * as React from "react";
import { IReader, derived } from "vs/base/common/observable";
import { DisposableStore } from "vs/base/common/lifecycle";

export abstract class ObservableComponent<TProps = {}> extends React.Component<TProps> {
    protected _store = new DisposableStore();
    private _isMounted = false;
    private readonly _result = derived(this, reader => this.renderObs(reader)).keepObserved(this._store);

    componentDidMount(): void {
        this._result.recomputeInitiallyAndOnChange(this._store,
            () => {
                if (this._isMounted) {
                    this.forceUpdate();
                }
            });
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        try {
            this._store.clear();
        } catch (e) {
            console.error(e);
        }
    }

    render() { return this._result.get(); }

    abstract renderObs(reader: IReader): React.ReactNode;
}
