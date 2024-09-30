import { h } from "vs/base/browser/dom";
import { autorun, autorunWithStore, IObservable } from "vs/base/common/observable";
import { DiffEditorViewModel } from "vs/editor/browser/widget/diffEditor/diffEditorViewModel";
import { lineRangeMappingFromRangeMappings } from "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer";
import { RangeMapping } from "vs/editor/common/diff/rangeMapping";
import { ITextModel } from "vs/editor/common/model";
import { createDiffEditor, createModel } from "vs/editor/standalone/browser/standaloneEditor";
import { Component } from "../components/Component";
import { TextDocument } from "./utils/editorUtils";
import { Event } from "vs/base/common/event";

export class DiffEditor extends Component {
    override readonly element = h('div').root;

    public readonly editor = this._register(createDiffEditor(this.element, {
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

        const hasMappings = this.options.mappings.map(m => m !== undefined);

        this._register(autorunWithStore((reader, store) => {
            const original = createModel('') as any as ITextModel;
            store.add(autorun(reader => {
                const srcOrig = options.original.read(reader);
                original.setValue(srcOrig.value);
            }));

            const modified = createModel('') as any as ITextModel;
            store.add(autorun(reader => {
                const srcMod = options.modified.read(reader);
                modified.setValue(srcMod.value);
            }));

            options.mappings.read(reader);
            if (hasMappings.read(reader)) {
                const m = store.add(new DiffEditorViewModel({ original, modified }, (this.editor as any)['_options'], {
                    _serviceBrand: undefined,
                    createDiffProvider(_options) {
                        return {
                            onDidChange: Event.fromObservableLight(options.mappings),
                            async computeDiff(original, modified, _options, cancellationToken) {
                                const mappings = options.mappings.get() ?? [];
                                const changes = lineRangeMappingFromRangeMappings(mappings, original.getLinesContent(), modified.getLinesContent(), true);
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
        }));
    }

    override layout(width: number, height: number): void {
        this.editor.layout({ width, height });
    }
}
