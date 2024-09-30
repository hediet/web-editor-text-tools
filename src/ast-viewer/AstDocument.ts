import { Editor, ISource } from "./Editor";
import { ITreeNodeData, TreeComponent } from "../components/ListView";
import { HorizontalSplitView } from "../components/HorizontalSplitView";
import { IObservable, autorun, autorunWithStore, constObservable, observableFromEvent, observableValue } from "vs/base/common/observable";
import { DelegatingComponent } from "../components/Component";
import { Range } from "vs/editor/common/core/range";
import { IModelDeltaDecoration } from "vs/editor/common/model";
import { RangeMapping } from "vs/editor/common/diff/rangeMapping";
import { isDefined } from "vs/base/common/types";
import { Position } from "vs/editor/common/core/position";

export class AstComponent extends DelegatingComponent {
    private readonly styleSheet = new StyleSheet();

    constructor(
        private readonly document: IObservable<AstDocument>
    ) {
        const astTreeNode = document.map(d => new AstTreeNode(d.root));
        const tree = new TreeComponent<AstTreeNode>(astTreeNode);
        const editor = new Editor({
            text: document.map(d => d?.source ?? ''),
            mappings: document.map(d => d.mappings),
            modified: document.map(d => d.modified),
            original: document.map(d => d.original),
        });

        super(new HorizontalSplitView(tree, editor));

        const focusedElements = observableFromEvent(tree.tree.onDidChangeFocus, e => e?.elements ?? [])

        const selectedNode = observableValue<AstTreeNode | null>(this, null);

        let lastSelectedNode: AstTreeNode | null = null;
        this._register(autorun(reader => {
            const node = selectedNode.read(reader);
            if (lastSelectedNode) {
                lastSelectedNode.classNames.set('', undefined);
            }
            node?.classNames.set('selected', undefined);
            lastSelectedNode = node;
        }));

        this._register(editor.editor.onDidChangeCursorPosition(e => {
            const pos = e.position;
            const node = astTreeNode.get().findSmallestNodeAtPosition(pos);
            if (!node) {
                return;
            }

            const n = tree.getNode(node);
            tree.tree.reveal(n ?? null);
            selectedNode.set(node, undefined);
            updateSelection([{ data: node }]);
        }));

        const c = editor.editor.createDecorationsCollection();

        function updateSelection(elems: readonly ({ data: AstTreeNode } | null)[]) {
            let range: Range | undefined = undefined;
            if (elems[0]) {
                selectedNode.set(elems[0].data, undefined);
            }
            c.set(elems.map<IModelDeltaDecoration | null>(e => {
                if (!e) { return null; }
                if (!e.data.astNode.range) { return null! }
                range = range || e.data.astNode.range;
                return {
                    range: e.data.astNode.range,
                    options: {
                        description: 'selected',
                        shouldFillLineOnLineBreak: true,
                        className: 'selected-node',
                    }
                }
            }).filter(isDefined));
            return range;
        }

        this._register(autorunWithStore((reader, store) => {
            store.add({ dispose: () => { c.clear(); } });

            const elems = focusedElements.read(reader);
            const range = updateSelection(elems);

            if (range) {
                editor.editor.revealRangeInCenterIfOutsideViewport(range);
            }
        }));

        /*
        const c = editor.editor.createDecorationsCollection();

        this._register(autorunWithStore((reader, store) => {

            const colorsMap = new Map<string, number>();
            const doc = astTreeNode.read(reader);

            const decorations: IModelDeltaDecoration[] = [];

            const range = document.read(reader).heatMapScoreRange;
            if (!range) {
                return;
            }

            doc.getHeatMapDecorations(decorations, range[0], range[1], normalizedScore => {
                const className = getClassName(normalizedScore);
                colorsMap.set(className, normalizedScore);
                return className;
            });

            c.set(decorations as any);

            const css = Array.from(colorsMap.entries()).map(([className, normalizedScore]) => {
                return `.${className} { background-color: ${heatMapColorforValue(normalizedScore)}; }`;
            }).join('\n');
            this.styleSheet.set(css);

        }));*/
    }
}

function getClassName(normalizedScore: number) {
    return `heatmap-${Math.round(normalizedScore * 100)}`;
}

class AstTreeNode implements ITreeNodeData<AstTreeNode> {
    public readonly children: AstTreeNode[] | undefined;

    public readonly classNames = observableValue<string>(this, '');

    constructor(public readonly astNode: AstNode) {
        this.children = astNode.children?.map(c => new AstTreeNode(c));
    }

    get label(): string { return this.astNode.label; }

    get codicon(): string | undefined { return this.astNode.codicon; }

    get isMarked() { return this.astNode.isMarked; }

    getHeatMapDecorations(decorations: IModelDeltaDecoration[], minScore: number, maxScore: number, getClassName: (normalizedScore: number) => string) {
        if (this.astNode.heatMapScore !== undefined && this.astNode.range !== undefined) {
            const normalizedScore = (this.astNode.heatMapScore - minScore) / (maxScore - minScore);
            decorations.push({
                range: this.astNode.range,
                options: {
                    description: 'heatmap',
                    className: getClassName(normalizedScore),
                    shouldFillLineOnLineBreak: true,
                }
            });
        }
        this.children?.forEach(c => c.getHeatMapDecorations(decorations, minScore, maxScore, getClassName));
    }

    findSmallestNodeAtPosition(position: Position): AstTreeNode | undefined {
        return this.children?.find(c => c.astNode.range?.containsPosition(position))?.findSmallestNodeAtPosition(position) ?? this;
    }
}

class StyleSheet {
    private _styleElement: HTMLStyleElement;
    constructor() {
        this._styleElement = document.createElement('style');
        document.head.appendChild(this._styleElement);
    }

    set(css: string) {
        this._styleElement.innerHTML = css;
    }

    dispose() {
        this._styleElement.remove();
    }
}

function heatMapColorforValue(value: number) {
    var h = (1.0 - value) * 240
    return "hsl(" + h + ", 100%, 50%, 0.5)";
}

export interface AstDocument {
    root: AstNode;
    source: ISource;
    modified?: ISource;
    original?: ISource;
    fileName?: string;
    mappings?: RangeMapping[];
    heatMapScoreRange?: [start: number, endInclusive: number];
}

export interface AstNode {
    label: string;
    codicon?: string;
    segment?: string; // like "root", ".name" or "[0]"
    isMarked?: boolean;
    range?: Range;
    heatMapScore?: number; // Value between 0 and 1
    children?: AstNode[];
}
