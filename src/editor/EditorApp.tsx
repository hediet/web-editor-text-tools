import { createJsonWebEditorClient, } from "@vscode/web-editors";
import React, { ReactNode } from "react";
import "vs/base/browser/ui/codicons/codicon/codicon.css";
import { constObservable, derived, IObservable, IReader, observableValue } from "vs/base/common/observable";
import "vs/editor/editor.all";
import { DynamicSizedComponent } from "../components/DynamicSizedComponent";
import { ObservableComponent } from "../ObservableComponent";
import { Disposable } from "../utils/disposable";
import { validatorFromType } from "../utils/validatorFromType";
import "../vscode.css";
import { TextDocument } from "./editorUtils";
import { sDiffEditorInput, sEditorInput } from "./schemas/inputs";
import "./style.css";
import { DiffEditor } from "./DiffEditor";

export class EditorApp extends ObservableComponent {
	override renderObs(_reader: IReader): ReactNode {
		return <div style={{ width: '100%', height: '100%' }} ref={this._init} />;
	}

	private readonly _init = (element: HTMLElement | null) => {
		if (element) {
			const astViewer = new DiffEditorViewer(element);
			this._store.add(astViewer);
		}
	};
}

interface IState {

}

interface IToObservable<T> {
	_brand: 'IToObservable';
	inner: T;
}

function toObservable<T>(inner: T): IToObservable<T> {
	return {
		_brand: 'IToObservable',
		inner,
	};
}

type ToObservableRecursive<T> = IObservable<T extends IToObservable<infer TInner> ? { [P in keyof TInner]: ToObservableRecursive<TInner[P]> } : T>;

function diffChange<T>(fn: (reader: IReader) => T): ToObservableRecursive<T> {


	return null!;
}


function rand(): number {
	return 0;
}

const state = diffChange(reader => {
	if (rand() === 2) { return toObservable({ baz: 1, foo: toObservable({ val: 1 }) }); }

	return undefined;
});


export class DiffEditorViewer extends Disposable {
	private readonly _value = observableValue(this, undefined as typeof sDiffEditorInput.T | undefined);

	private readonly _state = diffChange(reader => {
		const _value = this._value.read(reader);
		if (!_value) { return undefined; }

		return {
			original: toObservable(_value.original),
			modified: toObservable(_value.modified),
			mappings: toObservable(_value.mappings),
		};
	});
	private readonly _original = derived(this, reader => TextDocument.from(this._value.read(reader)?.original));

	private _isFirst = true;

	constructor(private readonly element: HTMLElement) {
		super();

		this._register(createJsonWebEditorClient(
			validatorFromType(sDiffEditorInput),
			v => {
				this._value.set(v, undefined);
				if (this._isFirst) {
					this._isFirst = false;
					this.init();
				}
			}
		));
	}

	private init(): void {
		this._register(new DynamicSizedComponent(this.element, new DiffEditor({
			mappings: constObservable(undefined),
			modified: constObservable(undefined),
			original: constObservable(undefined),
		})));
	}
}
