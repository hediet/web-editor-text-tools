import ReactDOM from "react-dom/client";
import { h } from "vs/base/browser/dom";
import { Disposable, IDisposable } from "vs/base/common/lifecycle";
import { appendRemoveOnDispose } from "vs/editor/browser/widget/diffEditor/utils";

export abstract class Component extends Disposable {
    constructor() {
        super();
    }

    abstract readonly element: HTMLElement;

    abstract layout(width: number, height: number): void;

    public get minimumHeight() { return 0; }
    public get maximumHeight() { return Number.POSITIVE_INFINITY; }
    public get minimumWidth() { return 0; }
    public get maximumWidth() { return Number.POSITIVE_INFINITY; }

    append(element: HTMLElement): IDisposable {
        return appendRemoveOnDispose(element, this.element);
    }
}

export class DelegatingComponent extends Component {
    constructor(private readonly _underlyingComponent: Component) {
        super();

        this._register(_underlyingComponent);
    }

    get element() { return this._underlyingComponent.element; }

    layout(width: number, height: number): void {
        this._underlyingComponent.layout(width, height);
    }

    get minimumHeight() { return this._underlyingComponent.minimumHeight; }
    get maximumHeight() { return this._underlyingComponent.maximumHeight; }
    get minimumWidth() { return this._underlyingComponent.minimumWidth; }
    get maximumWidth() { return this._underlyingComponent.maximumWidth; }
}

export class DynamicDelegatingComponent extends Component {
    private _underlyingComponent: Component | undefined = undefined;

    private readonly _element: HTMLElement = h('div', { style: { height: "100%", width: "100%" } }).root;

    private _width: number = -1;
    private _height: number = -1;

    constructor() {
        super();
    }

    setComponent(component: Component): void {
        this._underlyingComponent = component;
        this._element.replaceChildren(component.element);
        if (this._width !== -1 && this._height !== -1) {
            this.layout(this._width, this._height);
        }
    }

    get element() { return this._element; }

    layout(width: number, height: number): void {
        if (this._width === width && this._height === height) {
            return;
        }
        this._width = width;
        this._height = height;
        this._underlyingComponent?.layout(width, height);
    }

    get minimumHeight() { return this._underlyingComponent?.minimumHeight ?? 0; }
    get maximumHeight() { return this._underlyingComponent?.maximumHeight ?? 0; }
    get minimumWidth() { return this._underlyingComponent?.minimumWidth ?? 0; }
    get maximumWidth() { return this._underlyingComponent?.maximumWidth ?? 0; }
}

export class ReactComponent extends Component {
    element: HTMLElement = document.createElement("div");

    constructor(content: React.ReactNode) {
        super();
        ReactDOM.createRoot(this.element).render(content);
        this.element.style.display = 'contents';
    }

    layout(width: number, height: number): void {
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
    }
}
