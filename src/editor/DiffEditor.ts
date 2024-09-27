import { autorun, autorunWithStore, IObservable, observableValue, transaction } from "vs/base/common/observable";
import { RangeMapping } from "vs/editor/common/diff/rangeMapping";
import { Component } from "../components/Component";
import { h } from "vs/base/browser/dom";
import { editor } from "vs/editor/editor.api";
import { TextDocument } from "./editorUtils";
import { ICodeEditor } from "vs/editor/browser/editorBrowser";
import { DiffEditorViewModel } from "vs/editor/browser/widget/diffEditor/diffEditorViewModel";
import { lineRangeMappingFromRangeMappings } from "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer";
import { ITextModel } from "vs/editor/common/model";

export class DiffEditor extends Component {
    override readonly element = h('div').root;

    public readonly editor = this._register(editor.createDiffEditor(this.element, {
        hideUnchangedRegions: {
            enabled: true,
        }
    }));

    constructor(private readonly options: {
        original: IObservable<TextDocument>;
        modified: IObservable<TextDocument>;
        mappings: IObservable<RangeMapping[] | undefined>;
    }) {
        super();

        this._register(autorunWithStore((reader, store) => {
            const original = editor.createModel('') as any as ITextModel;
            store.add(autorun(reader => {
                const srcOrig = options.original.read(reader);
                original.setValue(srcOrig.value);
            }));

            const modified = editor.createModel('') as any as ITextModel;
            store.add(autorun(reader => {
                const srcMod = options.modified.read(reader);
                modified.setValue(srcMod.value);
            }));

            const mappings = options.mappings.read(reader);
            if (mappings) {
                const m = store.add(new DiffEditorViewModel({ original, modified }, this.editor['_options'], {
                    _serviceBrand: undefined,
                    createDiffProvider(_options) {
                        //const mappings = options.mappings.get();
                        const changes = lineRangeMappingFromRangeMappings(mappings, original.getLinesContent(), modified.getLinesContent(), true);
                        return {
                            onDidChange: () => { return { dispose: () => { } }; },
                            async computeDiff(original, modified, options, cancellationToken) {
                                return {
                                    identical: false,
                                    moves: [],
                                    quitEarly: false,
                                    changes,
                                };
                            },
                        };
                    },
                }));
                this.editor.setModel(m);
            } else {
                this.editor.setModel({ original, modified });
            }



            store.add(autorun(reader => {
                const dimension = this._dimension.read(reader);
                e.layout(dimension);
            }));
        }));


        this._register(autorun(reader => {
            this._model.setValue(options.text.read(reader).value);
        }));
    }

    override layout(width: number, height: number): void {
        transaction(tx => {
            this._dimension.set({ width, height }, tx);
        });
    }
}
