import { Range } from "vs/editor/common/core/range";
import { sDocument } from "../schemas/inputs";
import { PositionOffsetTransformer } from "vs/editor/common/core/positionToOffset";
import { TextPositionShape, TextRangeShape } from "../schemas/textRange";
import { Position } from "monaco-editor";
import { createStyleSheet2 } from "vs/base/browser/dom";
import { CachedFunction } from "vs/base/common/cache";
import { DisposableStore, toDisposable } from "vs/base/common/lifecycle";
import { IObservable, autorun } from "vs/base/common/observable";
import { ICodeEditor } from "vs/editor/browser/editorBrowser";
import { ISource } from "../../ast-viewer/Editor";

export class TextDocument {
    public static from(doc: typeof sDocument.T): TextDocument {
        if (typeof doc === 'string') {
            return new TextDocument(doc, [], new PositionOffsetTransformer(doc), undefined);
        } else {
            const transformer = new PositionOffsetTransformer(doc.value);

            return new TextDocument(
                doc.value,
                (doc.decorations ?? []).map(d => ({ ...d, range: normalizeRange(d.range, transformer) })),
                transformer,
                doc.fileName,
            );
        }
    }

    constructor(
        public readonly value: string,
        public readonly decorations: IDecoration[],
        public readonly transformer: PositionOffsetTransformer,
        public readonly fileName: string | undefined,
    ) { }

}

export interface IDecoration {
    range: Range;
    color?: string;
    heatPercent?: number;
}

function normalizePosition(pos: TextPositionShape, t: PositionOffsetTransformer): Position {
    return Array.isArray(pos) ? new Position(pos[0] + 1, pos[1] + 1) : t.getPosition(pos);
}

export function normalizeRange(range: TextRangeShape, t: PositionOffsetTransformer): Range {
    return Range.fromPositions(normalizePosition(range[0], t), normalizePosition(range[1], t));
}

export function applyDecorations(src: IObservable<IDecoration[]>, editor: ICodeEditor): IDisposable {
    const store = new DisposableStore();
    const c = editor.createDecorationsCollection();

    store.add(toDisposable(() => {
        c.clear();
    }));

    const css = store.add(createStyleSheet2());

    store.add(autorun(reader => {
        const decorations = src.read(reader);
        let cssVal = '';

        let idx = 0;
        const ruleCache = new CachedFunction((color: string) => {
            const id = idx++;
            cssVal += `.decoration-${id} { background-color: ${color}; opacity: 0.5; }`;
            return `.decoration-${id}`;
        });

        c.set(decorations.map(d => {

            let color = d.color;
            if (!color) {
                if (d.heatPercent !== undefined) {
                    color = heatMapColorForValue(d.heatPercent);
                }
            }

            return {
                range: d.range,
                options: {
                    description: 'selected',
                    className: color ? ruleCache.get(color) : undefined,   
                }
            };
        }));
        css.setStyle(cssVal);
    }));

    return store;
}


function heatMapColorForValue(value: number): string {
    const h = (1.0 - value) * 240;
    return `hsl(${h}, 100%, 50%)`;
}