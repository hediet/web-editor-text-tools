import { createJsonWebEditorClient, vNumber, vObj, vString, vUndefined, vUnion } from "@vscode/web-editors";
import React, { CSSProperties } from "react";
import { KeyCode } from "vs/base/common/keyCodes";
import { IReader, ObservablePromise, autorun, derived, observableFromEvent, observableFromPromise, observableSignal, observableValue, transaction } from "vs/base/common/observable";
import { obsCodeEditor } from "vs/editor/browser/observableUtilities";
import { Range } from "vs/editor/common/core/range";
import { IModelDeltaDecoration } from "vs/editor/common/model";
import { IStandaloneCodeEditor } from "vs/editor/standalone/browser/standaloneCodeEditor";
import { create, createModel } from 'vs/editor/standalone/browser/standaloneEditor';
import { ObservableComponent } from "../components/ObservableComponent";
import "./style.css";
import { Disposable } from "../utils/disposable";

const vPosition = vObj({
    // 1-based
    lineNumber: vNumber(),
    column: vNumber(),
});

const vRange = vObj({
    start: vPosition,
    end: vPosition,
});

class TextRangeEditorModel extends Disposable {
    public readonly textModel = createModel('test');
    public readonly selection = observableValue<Range>(this, new Range(1, 1, 1, 1));
    public readonly text = observableFromEvent(e => this.textModel.onDidChangeContent(e), () => this.textModel.getValue());
    public readonly comment = observableValue<string | undefined>(this, undefined);

    public readonly selectionChangedFromOutside = observableSignal(this);

    private readonly client = this._register(createJsonWebEditorClient(
        vObj({
            text: vString(),
            range: vRange,
            comment: vUnion(vString(), vUndefined()),
        }),
        data => {
            transaction(tx => {
                this.textModel.setValue(data.text);
                this.selection.set(new Range(
                    data.range.start.lineNumber,
                    data.range.start.column,
                    data.range.end.lineNumber,
                    data.range.end.column,
                ), tx);
                this.selectionChangedFromOutside.trigger(tx);
                this.comment.set(data.comment, tx);
            });
        }
    ));

    public readonly state = new ObservablePromise(this.client?.onDidConnect.then(c => true) ?? Promise.resolve(false)).promiseResult
        .map(r => !r ? 'connecting' : r.data ? 'connected' : 'disconnected');

    constructor() {
        super();

        if (this.client) {
            this._register(autorun(reader => {
                const selection = this.selection.read(reader);
                this.client?.updateContent({
                    text: this.text.read(reader),
                    range: {
                        start: {
                            lineNumber: selection.startLineNumber,
                            column: selection.startColumn,
                        },
                        end: {
                            lineNumber: selection.endLineNumber,
                            column: selection.endColumn,
                        },
                    },
                    comment: this.comment.read(reader),
                });
            }));
        }
    }
}

export class TextRangeEditorApp extends ObservableComponent {
    private readonly model = this._store.add(new TextRangeEditorModel());

    override renderObs(reader: IReader): React.ReactNode {
        return <TextRangeEditorView model={this.model} />;
    }
}

class TextRangeEditorView extends ObservableComponent<{ model: TextRangeEditorModel }> {
    override renderObs(reader: IReader): React.ReactNode {
        const m = this.props.model;
        if (m.state.read(reader) === 'connecting') {
            return;
        }
        const comment = m.comment.read(reader);
        return <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="header" style={{ display: 'flex' }}>
                {comment ? <div className="comment">{comment}</div> : undefined}
                <div style={{ marginLeft: comment ? 'auto' : undefined, marginRight: !comment ? 'auto' : undefined }}>Selection: {m.selection.read(reader).toString()}</div>
                <div>Hold <i>ctrl</i> and select text to change</div>
            </div>
            <EditorComponent model={m} />
        </div>;
    }
}

class EditorComponent extends ObservableComponent<{ model: TextRangeEditorModel, style?: CSSProperties }> {
    public editor!: IStandaloneCodeEditor;

    override renderObs(reader: IReader): React.ReactNode {
        return <div style={{ width: '100%', height: '100%' }} ref={this.setEditor} />;
    }

    private readonly setEditor = (target: HTMLDivElement | null) => {
        if (!target) { return; }
        this.editor = this._store.add(create(target, {
            model: this.props.model.textModel,
            selectionHighlight: false,
            occurrencesHighlight: "off",
            automaticLayout: true,
        }));

        const o = obsCodeEditor(this.editor);
        this._store.add(o.setDecorations(derived(this, (reader) => {
            const selection = this.props.model.selection.read(reader);
            this.props.model.text.read(reader);
            return [{
                range: selection,
                options: {
                    description: 'selection',
                    className: 'selectedRange' + (selection.isEmpty() ? ' empty' : ''),
                    shouldFillLineOnLineBreak: true,
                    showIfCollapsed: true,
                }
            }, {
                range: selection,
                options: {
                    description: 'selection',
                    className: 'selectedRangeBackground',
                    isWholeLine: true,
                    showIfCollapsed: true,
                }
            }] satisfies IModelDeltaDecoration[];
        })));

        this._store.add(autorun(reader => {
            this.props.model.selectionChangedFromOutside.read(reader);
            this.editor.revealRangeInCenterIfOutsideViewport(this.props.model.selection.get());
        }))

        let ctrlDown = false;
        this._store.add(this.editor.onKeyDown(e => {
            if (e.keyCode === KeyCode.Ctrl) { ctrlDown = true; }
        }));
        this._store.add(this.editor.onKeyUp(e => {
            if (e.keyCode === KeyCode.Ctrl) { ctrlDown = false; }
        }));
        this._store.add(this.editor.onDidChangeCursorSelection(e => {
            if (ctrlDown) {
                this.props.model.selection.set(e.selection, undefined);
            }
        }));
        this._store.add(this.editor.onMouseDown(e => {
            if (ctrlDown) {
                this.props.model.selection.set(this.editor.getSelection()!, undefined);
            }
        }))
    };
}
