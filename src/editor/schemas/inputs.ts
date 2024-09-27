import { sOpenObject, sUnion, sString, sArrayOf, optionalProp, sBoolean } from "@hediet/semantic-json";
import { nsMonacoUtils } from "../../ast-viewer/types/ns";
import { sTextRange } from "../../ast-viewer/types/textRange";

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

export const sEditorInput = sOpenObject({
    source: sDocument,
    fileName: optionalProp(sString()),
}).defineAs(nsMonacoUtils("EditorVisualizationData"));

export const sDiffEditorInput = sOpenObject({
    modified: sDocument,
    original: sDocument,
    mappings: optionalProp(sArrayOf(sMapping)),
    hideUnchangedRegions: optionalProp(sBoolean()),
    fileName: optionalProp(sString()),
}).defineAs(nsMonacoUtils("DiffEditorVisualizationData"));
