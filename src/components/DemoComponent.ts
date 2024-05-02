import { h } from "vs/base/browser/dom";
import { Component } from "./Component";

export class DemoComponent extends Component {
    public readonly element = h('div', { style: { background: this._background } }).root;
    layout(width: number, height: number): void {
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
    }

    constructor(text: string, private readonly _background: string) {
        super();

        this.element.innerText = text;
    }
}
