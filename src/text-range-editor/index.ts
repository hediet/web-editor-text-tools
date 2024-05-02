import { createJsonWebEditorClient, vNumber, vObj, vString } from "@vscode/web-editors";
import { createModel, create } from 'vs/editor/standalone/browser/standaloneEditor';
import { DynamicSizedComponent } from "../components/DynamicSizedComponent";
import { Component } from "../components/Component";
import { IModelDeltaDecoration, ITextModel } from "vs/editor/common/model";
import { IRange } from "vs/base/common/range";
import { autorun, derived, observableValue } from "vs/base/common/observable";
import { Range } from "vs/editor/common/core/range";
import { obsCodeEditor } from "vs/editor/browser/observableUtilities";
import "./style.css";

const vPosition = vObj({
    // 1-based
    lineNumber: vNumber(),
    column: vNumber(),
});

const vRange = vObj({
    start: vPosition,
    end: vPosition,
});

export class TextRangeEditor {
    private readonly textModel = createModel('test');

    private readonly selection = observableValue<Range>(this, new Range(1, 1, 1, 1));
    private readonly text = observableValue<string>(this, '');

    private readonly client = createJsonWebEditorClient(
        vObj({
            text: vString(),
            range: vRange,
        }),
        data => {
            this.textModel.setValue(data.text);
            this.selection.set(new Range(
                data.range.start.lineNumber,
                data.range.start.column,
                data.range.end.lineNumber,
                data.range.end.column,
            ), undefined);
            this.editorComponent.editor.revealRangeInCenterIfOutsideViewport(this.selection.get());
        }
    );

    private readonly editorComponent = new EditorComponent(this.textModel);

    constructor(root: HTMLElement) {
        this.textModel.onDidChangeContent(e => {
            this.text.set(this.textModel.getValue(), undefined);
        });

        const d = new DynamicSizedComponent(root, this.editorComponent);

        this.editorComponent.editor.onDidChangeCursorSelection(e => {
            this.selection.set(e.selection, undefined);
        });

        obsCodeEditor(this.editorComponent.editor).setDecorations(derived(this, (reader) => {
            const selection = this.selection.read(reader);

            return [{
                range: selection,
                options: {
                    description: 'selection',
                    className: 'selectedRange' + (selection.isEmpty() ? ' empty' : ''),
                    shouldFillLineOnLineBreak: true,
                    showIfCollapsed: true,
                }
            }] satisfies IModelDeltaDecoration[];
        }));

        autorun(reader => {
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
            });
        });
    }
}

class EditorComponent extends Component {
    public readonly element = document.createElement('div');
    public readonly editor = create(this.element, {
        model: this.textModel,
        selectionHighlight: false,
        occurrencesHighlight: "off",
    })

    constructor(
        public readonly textModel: ITextModel,
    ) {
        super();
    }

    layout(width: number, height: number): void {
        this.editor.layout({ width, height });
    }
}
