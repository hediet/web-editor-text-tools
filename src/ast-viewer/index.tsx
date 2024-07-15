import { JSONValue } from "@hediet/semantic-json";
import { createJsonWebEditorClient, } from "@vscode/web-editors";
import { DisposableStore } from "vs/base/common/lifecycle";
import { IReader, observableValue } from "vs/base/common/observable";
import { Position } from "vs/editor/common/core/position";
import { PositionOffsetTransformer } from "vs/editor/common/core/positionToOffset";
import { Range } from "vs/editor/common/core/range";
import { RangeMapping } from "vs/editor/common/diff/rangeMapping";
import { AstComponent, AstDocument, AstNode } from "./AstDocument";
import { ISource } from "../Editor";
import { DynamicSizedComponent } from "../components/DynamicSizedComponent";
import "./style.css";
import "../vscode.css";
import { sAstDocument, sAstNode, sDoc } from "./types/astData";
import { TextPositionShape, TextRangeShape } from "./types/textRange";
import "vs/base/browser/ui/codicons/codicon/codicon.css";
import "vs/editor/editor.all";
import { validatorFromType } from "../utils/validatorFromType";
import { Disposable } from "../utils/disposable";
import { ObservableComponent } from "../ObservableComponent";
import { ReactNode } from "react";
import React from "react";

export class AstViewerApp extends ObservableComponent {
  override renderObs(reader: IReader): ReactNode {
    return <div style={{ width: '100%', height: '100%' }} ref={this.initAstViewer} />;
  }

  initAstViewer = (element: HTMLElement | null) => {
    if (element) {
      const astViewer = new AstViewer(element);
      this._store.add(astViewer);
    }
  };
}

export class AstViewer extends Disposable {
  private readonly _data = observableValue<AstDocument | undefined>(this, undefined);

  private _isFirst = true;

  constructor(private readonly element: HTMLElement) {
    super();

    this._register(createJsonWebEditorClient(
      validatorFromType(sAstDocument),
      v => {
        function getStr(src: { value: string } | string): string {
          return typeof src === 'string' ? src : src.value;
        }

        const source = new PositionOffsetTransformer(getStr(v.source));
        const tOrig = v.original ? new PositionOffsetTransformer(getStr(v.original)) : source;
        const tMod = v.modified ? new PositionOffsetTransformer(getStr(v.modified)) : source;


        this._data.set({
          ...v,
          source: normalizeSource(v.source, source),
          original: !v.original ? undefined : normalizeSource(v.original, tOrig),
          modified: !v.modified ? undefined : normalizeSource(v.modified, tMod),
          mappings: !v.mappings ? undefined : v.mappings.map(m => {
            return new RangeMapping(normalizeRange(m.original, tOrig), normalizeRange(m.modified, tMod));
          }),
          root: normalizeAstNode(v.root, source),
        }, undefined);

        if (this._isFirst) {
          this._isFirst = false;
          this._register(new DynamicSizedComponent(this.element, new AstComponent(this._data as any)));
        }

        function normalizeSource(source: typeof sDoc['T'], t: PositionOffsetTransformer): ISource {
          return typeof source === 'string' ? { value: source, decorations: [] } : { value: source.value, decorations: source.decorations.map(d => ({ ...d, range: normalizeRange(d.range, t) })) };
        }
      }));
  }
}

function normalizePosition(pos: TextPositionShape, t: PositionOffsetTransformer): Position {
  return Array.isArray(pos) ? new Position(pos[0] + 1, pos[1] + 1) : t.getPosition(pos);
}

function normalizeRange(range: TextRangeShape, t: PositionOffsetTransformer): Range {
  return Range.fromPositions(normalizePosition(range[0], t), normalizePosition(range[1], t));
}

const emptyArr: never[] = [];

function normalizeAstNode(node: typeof sAstNode['T'], transformer: PositionOffsetTransformer): AstNode {
  const range = node.range ? normalizeRange(node.range, transformer) : undefined;
  return {
    ...node,
    range,
    children: node.children ? node.children.map(n => normalizeAstNode(n, transformer)) : emptyArr,
  }
}
