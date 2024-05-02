import { createStyleSheet2, h } from "vs/base/browser/dom";
import { CachedFunction } from "vs/base/common/cache";
import { DisposableStore, IDisposable, toDisposable } from "vs/base/common/lifecycle";
import { IObservable, autorun, autorunWithStore, derived, observableValue, transaction } from "vs/base/common/observable";
import { ICodeEditor } from "vs/editor/browser/editorBrowser";
import { DiffEditorViewModel } from "vs/editor/browser/widget/diffEditor/diffEditorViewModel";
import { Range } from "vs/editor/common/core/range";
import { lineRangeMappingFromRangeMappings } from "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer";
import { RangeMapping } from "vs/editor/common/diff/rangeMapping";
import { Component } from "./components/Component";
import { editor } from "vs/editor/editor.api";

export interface ISource {
    value: string;
    decorations: IDecoration[];
}

export interface IDecoration {
    range: Range;
    color: string;
}

function applyDecorations(src: IObservable<ISource>, editor: ICodeEditor): IDisposable {
    const store = new DisposableStore();
    const c = editor.createDecorationsCollection();

    store.add(toDisposable(() => {
        c.clear();
    }));

    const css = store.add(createStyleSheet2());

    store.add(autorun(reader => {
        const s = src.read(reader);
        let cssVal = '';
        const ruleCache = new CachedFunction((color: string) => {
            // add css rule
            cssVal += `.decoration-${color} { background-color: ${color}; }`;
            return `.decoration-${color}`;
        });

        c.set(s.decorations.map(d => ({
            range: d.range,
            options: {
                description: 'selected',
                className: ruleCache.get(d.color),
            }
        })));
        css.setStyle(cssVal);
    }));

    return store;
}

export class Editor extends Component {
    override readonly element = h('div').root;

    private readonly _model = editor.createModel('test');

    /*public readonly editor = this._register(editor.create(this.element, {
        model: this._model
    }));*/

    private readonly _dimension = observableValue(this, { width: 0, height: 0 });

    private readonly _shouldUseDiffEditor = derived(this, reader => !!this.options.original.read(reader) || !!this.options.modified.read(reader));

    public editor!: ICodeEditor;

    constructor(private readonly options: {
        text: IObservable<ISource>,
        original: IObservable<ISource | undefined>,
        modified: IObservable<ISource | undefined>,
        mappings: IObservable<RangeMapping[] | undefined>,
    }) {
        super();

        this._register(autorunWithStore((reader, store) => {

            let e: ICodeEditor;

            this.element.replaceChildren();
            if (this._shouldUseDiffEditor.read(reader)) {
                const d = e = store.add(editor.createDiffEditor(this.element));
                this.editor = d.getOriginalEditor();

                const original = editor.createModel('');
                const modified = editor.createModel('');

                store.add(autorun(reader => {
                    const srcOrig = options.original.read(reader) ?? options.text.read(reader);
                    const srcMod = options.modified.read(reader) ?? options.text.read(reader);
                    original.setValue(srcOrig.value);
                    modified.setValue(srcMod.value);
                }));

                const mappings = options.mappings.read(reader);
                if (mappings) {
                    const m = store.add(new DiffEditorViewModel({ original, modified }, d['_options'], {
                        _serviceBrand: undefined,
                        createDiffProvider(_options) {
                            //const mappings = options.mappings.get();
                            const changes = lineRangeMappingFromRangeMappings(mappings, original.getLinesContent(), modified.getLinesContent(), true);
                            return {
                                onDidChange: () => { return { dispose: () => { } } },
                                async computeDiff(original, modified, options, cancellationToken) {
                                    return {
                                        identical: false,
                                        moves: [],
                                        quitEarly: false,
                                        changes,
                                    }
                                },
                            }
                        },
                    }));
                    d.setModel(m);
                } else {
                    d.setModel({ original, modified });
                }

            } else {

                const d = e = store.add(editor.create(this.element));
                const tm = store.add(editor.createModel(''));
                d.setModel(tm);

                store.add(autorun(reader => {
                    const src = options.text.read(reader);
                    tm.setValue(src.value);
                }));

                store.add(applyDecorations(options.text, d));

                this.editor = d;
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
