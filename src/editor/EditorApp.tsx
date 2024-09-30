import React, { ReactNode } from "react";
import "vs/base/browser/ui/codicons/codicon/codicon.css";
import { IReader } from "vs/base/common/observable";
import { RangeMapping } from "vs/editor/common/diff/rangeMapping";
import "../vscode.css";
import { DiffEditor } from "./DiffEditor";
import { normalizeRange, TextDocument } from "./utils/editorUtils";
import { sDiffEditorInput, sEditorInput } from "./schemas/inputs";
import "./style.css";
import { DynamicSizedReactComponent } from "./utils/DynamicSizedReactComponent";
import { createWebEditor } from "./utils/createWebEditor";
import "../vscode.css";
import "./style.css";
import { TextEditor } from "./TextEditor";

type DiffEditorInput_ = typeof sDiffEditorInput.T;
interface DiffEditorInput extends DiffEditorInput_ {}

export class DiffWebEditor extends createWebEditor<DiffEditorInput>('diff', sDiffEditorInput) {
	private readonly _mappedState = this._value.map((value) => {
		if (!value) { return undefined; }
		const original = value.map(v => TextDocument.from(v.original));
		const modified = value.map(v => TextDocument.from(v.modified));
		const mappings = value.map((v, reader) => {
			const tOrig = original.read(reader).transformer;
			const tMod = modified.read(reader).transformer;
			return v.mappings?.map(m => new RangeMapping(normalizeRange(m.original, tOrig), normalizeRange(m.modified, tMod)));
		});
		return { original, modified, mappings };
	});
	
	override renderObs(reader: IReader): ReactNode {
		const state = this._mappedState.read(reader);
		if (!state) { return; }

		return <DynamicSizedReactComponent componentCtor={
			() => new DiffEditor({
				original: state.original,
				modified: state.modified,
				mappings: state.mappings,
			})
		} />;
	}
}

export class TextWebEditor extends createWebEditor('text', sEditorInput) {
	private readonly _mappedState = this._value.map((value) => {
		if (!value) { return undefined; }
		const source = value.map(v => TextDocument.from(v));
		
		return { source, languageId: value.map(v => v.languageId) };
	});
	
	override renderObs(reader: IReader): ReactNode {
		const state = this._mappedState.read(reader);
		if (!state) { return; }

		return <DynamicSizedReactComponent componentCtor={
			() => new TextEditor({
				source: state.source,
				language: state.languageId,
			})
		} />;
	}
}
