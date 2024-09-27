import {
    DeserializeResult,
    Serializer,
    sArrayOf,
    sNumber,
    sUnion
} from "@hediet/semantic-json";

export type TextRangeShape = [start: TextPositionShape, endExclusive: TextPositionShape];
export type TextPositionShape = [lineIdx: number, lineOffset: number] | number;

export const sOffsetRange = sArrayOf(sNumber());

/*.refine<OffsetRangeShape>({
    canSerialize(value): value is OffsetRangeShape { return true; },
    fromIntermediate(value) {
        if (value.length !== 2) {
            return DeserializeResult.fromError({ message: "Expected array of length 2" });
        }
        return value as OffsetRangeShape;
    },
    toIntermediate(value) { return value; }
});
*/

export const sLineColRange = sArrayOf(sArrayOf(sNumber()));

/*.refine<LineColRangeShape>({
    canSerialize(value): value is LineColRangeShape { return true; },
    fromIntermediate(value) {
        if (value.length !== 2) {
            return DeserializeResult.fromError({ message: "Expected array of length 2" });
        }
        if (value[0].length !== 2) {
            return DeserializeResult.fromError({ message: "Expected array of length 2" });
        }
        if (value[1].length !== 2) {
            return DeserializeResult.fromError({ message: "Expected array of length 2" });
        }
        return value as LineColRangeShape;
    },
    toIntermediate(value) { return value; }
});*/

export const sTextRange: Serializer<TextRangeShape> = sUnion([sOffsetRange, sLineColRange]) as any; // TODO
