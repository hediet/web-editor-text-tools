import { Disposable } from "vs/base/common/lifecycle";
import { ObservableElementSizeObserver } from "vs/editor/browser/widget/diffEditor/utils";
import { autorun } from "vs/base/common/observable";
import { Component } from "./Component";

export class DynamicSizedComponent extends Disposable {
    constructor(element: HTMLElement, component: Component) {
        super();

        this._register(component);

        this._register(component.append(element));

        const o = new ObservableElementSizeObserver(element, undefined);
        o.setAutomaticLayout(true);

        this._register(autorun(reader => {
            const width = o.width.read(reader);
            const height = o.height.read(reader);

            component.layout(width, height);
        }));
    }
}
