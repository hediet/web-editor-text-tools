import {
    Serializer,
    optionalProp,
    sArrayOf,
    sBoolean,
    sLazy,
    sNumber,
    sOpenObject,
    sString,
    sUnion
} from "@hediet/semantic-json";
import { nsMonacoUtils } from "./ns";
import { TextRangeShape, sTextRange } from "./textRange";

export const sMapping = sOpenObject({
    original: sTextRange,
    modified: sTextRange,
}).defineAs(nsMonacoUtils("TextMapping"));

export const sDocument = sUnion([sString(), sOpenObject({
    value: sString(),
    decorations: sArrayOf(sOpenObject({
        range: sTextRange,
        color: sString(),
    })),
})]);


export interface AstNode {
    label: string;
    codicon?: string;
    segment?: string; // like "root", ".name" or "[0]"
    isMarked?: boolean;
    range?: TextRangeShape;
    heatMapScore?: number; // Value between 0 and 1
    children?: AstNode[];
}

export const sAstNode: Serializer<AstNode> = sLazy(() =>
    sOpenObject({
        label: sString(),
        segment: optionalProp(sString()),
        isMarked: optionalProp(sBoolean()),
        codicon: optionalProp(sString()),
        range: optionalProp(sTextRange),
        heatMapScore: optionalProp(sNumber()),
        children: optionalProp(sArrayOf(sAstNode)),
    }).defineAs(nsMonacoUtils("AstTreeNode"))
);

export const sAstDocument = sOpenObject({
    root: sAstNode,
    source: sDocument,
    modified: optionalProp(sDocument),
    original: optionalProp(sDocument),
    mappings: optionalProp(sArrayOf(sMapping)),

    fileName: optionalProp(sString()),
}).defineAs(nsMonacoUtils("AstTreeVisualizationData"));
