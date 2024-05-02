import { IView, Orientation, SerializableGrid } from "vs/base/browser/ui/grid/grid";
import { Color } from "vs/base/common/color";
import { Event } from "vs/base/common/event";
import { Component } from "./Component";

export class HorizontalSplitView extends Component {
    private readonly _v1 = createView(this._first);
    private readonly _v2 = createView(this._second);

    private readonly _grid = this._register(
        SerializableGrid.from<any>({
            orientation: Orientation.HORIZONTAL,
            size: 100,
            groups: [{ data: this._v1, size: 1 }, { data: this._v2, size: 2 }],
        }, {
            proportionalLayout: true
        })
    );

    override get element() { return this._grid.element; }

    constructor(
        private readonly _first: Component,
        private readonly _second: Component
    ) {
        super();

        this._register(_first);
        this._register(_second);
    }

    layout(width: number, height: number): void {
        this._grid.layout(width, height);
    }
}
function createView(component: Component): IView {
    return {
        element: component.element,
        onDidChange: Event.None,
        layout(width, height, _top, _left) {
            component.layout(width, height);
        },
        minimumHeight: component.minimumHeight,
        maximumHeight: component.maximumHeight,
        minimumWidth: component.minimumWidth,
        maximumWidth: component.maximumWidth,
    };
}
