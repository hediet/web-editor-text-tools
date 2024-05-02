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
import { visualizationNs } from "./ns";
import { TextRangeShape, sTextRange } from "./textRange";

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
    }).defineAs(visualizationNs("AstTreeNode"))
);

export const sMapping = sOpenObject({
    original: sTextRange,
    modified: sTextRange,
}).defineAs(visualizationNs("TextMapping"));

export const sDoc = sUnion([sString(), sOpenObject({
    value: sString(),
    decorations: sArrayOf(sOpenObject({
        range: sTextRange,
        color: sString(),
    })),
})]);

export const sAstDocument = sOpenObject({
    root: sAstNode,
    source: sDoc,
    modified: optionalProp(sDoc),
    original: optionalProp(sDoc),
    mappings: optionalProp(sArrayOf(sMapping)),

    fileName: optionalProp(sString()),
}).defineAs(visualizationNs("AstTreeVisualizationData"));
