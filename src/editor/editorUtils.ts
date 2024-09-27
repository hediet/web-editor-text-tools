import { Range } from "vs/editor/common/core/range";
import { sDocument } from "./schemas/inputs";
import { PositionOffsetTransformer } from "vs/editor/common/core/positionToOffset";
import { TextPositionShape, TextRangeShape } from "./schemas/textRange";
import { Position } from "monaco-editor";

export class TextDocument {
    public static from(doc: typeof sDocument.T): TextDocument {
        if (typeof doc === 'string') {
            return new TextDocument(doc, [], new PositionOffsetTransformer(doc));
        } else {
            const transformer = new PositionOffsetTransformer(doc.value);

            return new TextDocument(
                doc.value,
                doc.decorations.map(d => ({ ...d, range: normalizeRange(d.range, transformer) })),
                transformer,
            );
        }
    }

    constructor(
        public readonly value: string,
        public readonly decorations: IDecoration[],
        public readonly transformer: PositionOffsetTransformer,
    ) { }

}

export interface IDecoration {
    range: Range;
    color: string;
}

function normalizePosition(pos: TextPositionShape, t: PositionOffsetTransformer): Position {
    return Array.isArray(pos) ? new Position(pos[0] + 1, pos[1] + 1) : t.getPosition(pos);
}

function normalizeRange(range: TextRangeShape, t: PositionOffsetTransformer): Range {
    return Range.fromPositions(normalizePosition(range[0], t), normalizePosition(range[1], t));
}
