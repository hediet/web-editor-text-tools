import { h } from "vs/base/browser/dom";
import { autorun, autorunWithStore, IObservable } from "vs/base/common/observable";
import { ITextModel } from "vs/editor/common/model";
import { create, createModel } from "vs/editor/standalone/browser/standaloneEditor";
import { Component } from "../components/Component";
import { applyDecorations, TextDocument } from "./utils/editorUtils";

export class TextEditor extends Component {
    override readonly element = h('div').root;

    public readonly editor = this._register(create(this.element, {
    }));

    constructor(private readonly options: {
        source: IObservable<TextDocument>;
        language: IObservable<string | undefined>;
    }) {
        super();

        this._register(autorunWithStore((reader, store) => {
            const model = createModel('', options.language.read(reader)) as any as ITextModel;
            store.add(autorun(reader => {
                const srcOrig = options.source.read(reader);
                model.setValue(srcOrig.value);
            }));
            this.editor.setModel(model);
            store.add(applyDecorations(options.source.map(s => s.decorations), this.editor));
        }));
    }

    override layout(width: number, height: number): void {
        this.editor.layout({ width, height });
    }
}
