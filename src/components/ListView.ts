import { h } from "vs/base/browser/dom";
import { IconLabel } from "vs/base/browser/ui/iconLabel/iconLabel";
import { IListStyles } from "vs/base/browser/ui/list/listWidget";
import { RenderIndentGuides } from "vs/base/browser/ui/tree/abstractTree";
import { IObservable, autorun, observableValue } from "vs/base/common/observable";
import { listFocusBackground, listFocusForeground, listFocusOutline, listActiveSelectionBackground, listActiveSelectionForeground, listActiveSelectionIconForeground, listFocusAndSelectionOutline, listInactiveSelectionBackground, listInactiveSelectionIconForeground, listInactiveSelectionForeground, listInactiveFocusBackground, listInactiveFocusOutline, listHoverBackground, listHoverForeground, listDropOverBackground, listDropBetweenBackground, activeContrastBorder, treeIndentGuidesStroke, treeInactiveIndentGuidesStroke, tableColumnsBorder, tableOddRowsBackgroundColor } from "vs/platform/theme/common/colorRegistry";
import { asCssVariable } from "vs/platform/theme/common/colorUtils";
import { Component } from "./Component";
import { ObjectTree } from "vs/base/browser/ui/tree/objectTree";
import { IObjectTreeElement, ITreeNode, ITreeRenderer, ObjectTreeElementCollapseState } from "vs/base/browser/ui/tree/tree";
import { Disposable } from "../utils/disposable";

export class TreeComponent<TNode extends ITreeNodeData<TNode>> extends Component {
    override readonly element = h('div').root;

    public readonly tree = new ObjectTree<TreeItem<TNode>>('treeComponent', this.element, {
        getHeight() {
            return 30;
        },
        getTemplateId() {
            return 'foo';
        },
    }, [new Renderer()], {
        //enableStickyScroll: true,
        indent: 16,
        renderIndentGuides: RenderIndentGuides.Always,
    });

    constructor(
        private readonly _node: IObservable<TNode>,
    ) {
        super();

        const defaultListStyles: IListStyles = {
            listBackground: 'rgb(243, 243, 243)',
            listInactiveFocusForeground: undefined,
            listFocusBackground: asCssVariable(listFocusBackground),
            listFocusForeground: asCssVariable(listFocusForeground),
            listFocusOutline: asCssVariable(listFocusOutline),
            listActiveSelectionBackground: asCssVariable(listActiveSelectionBackground),
            listActiveSelectionForeground: asCssVariable(listActiveSelectionForeground),
            listActiveSelectionIconForeground: asCssVariable(listActiveSelectionIconForeground),
            listFocusAndSelectionOutline: asCssVariable(listFocusAndSelectionOutline),
            listFocusAndSelectionBackground: asCssVariable(listActiveSelectionBackground),
            listFocusAndSelectionForeground: asCssVariable(listActiveSelectionForeground),
            listInactiveSelectionBackground: asCssVariable(listInactiveSelectionBackground),
            listInactiveSelectionIconForeground: asCssVariable(listInactiveSelectionIconForeground),
            listInactiveSelectionForeground: asCssVariable(listInactiveSelectionForeground),
            listInactiveFocusBackground: asCssVariable(listInactiveFocusBackground),
            listInactiveFocusOutline: asCssVariable(listInactiveFocusOutline),
            listHoverBackground: asCssVariable(listHoverBackground),
            listHoverForeground: asCssVariable(listHoverForeground),
            listDropOverBackground: asCssVariable(listDropOverBackground),
            listDropBetweenBackground: asCssVariable(listDropBetweenBackground),
            listSelectionOutline: asCssVariable(activeContrastBorder),
            listHoverOutline: asCssVariable(activeContrastBorder),
            treeIndentGuidesStroke: asCssVariable(treeIndentGuidesStroke),
            treeInactiveIndentGuidesStroke: asCssVariable(treeInactiveIndentGuidesStroke),
            treeStickyScrollBackground: undefined,
            treeStickyScrollBorder: undefined,
            treeStickyScrollShadow: undefined,
            tableColumnsBorder: asCssVariable(tableColumnsBorder),
            tableOddRowsBackgroundColor: asCssVariable(tableOddRowsBackgroundColor),
        };

        this.tree.style(defaultListStyles);

        const that = this;
        function createTreeNode(node: TNode): TreeNode {
            const children: TreeNode[] = [];
            for (const c of node.children ?? []) {
                children.push(createTreeNode(c));
            }
            const item = new TreeItem(node);
            const result = new TreeNode(item, children);
            that.map.set(node, item);
            return result;
        }

        this._register(autorun(reader => {
            this.map.clear();
            const node = _node.read(reader);
            const root = createTreeNode(node);
            this.tree.setChildren(null, [root]);
            root.set(this.tree);
        }));
    }

    private readonly map: Map<TNode, TreeItem<TNode>> = new Map();

    public getNode(node: TNode): TreeItem<TNode> | undefined {
        return this.map.get(node);
    }

    public override layout(width: number, height: number): void {
        this.tree.layout(height, width);
    }
}

export interface ITreeNodeData<T extends ITreeNodeData<T>> {
    label: string;
    codicon: string | undefined;
    segment?: string;
    isMarked?: boolean;
    classNames: IObservable<string>;
    children?: T[];
}


class Renderer implements ITreeRenderer<TreeItem, void, Template> {
    templateId: string = 'foo';

    renderTemplate(container: HTMLElement): Template {
        return new Template(container);
    }

    renderElement(element: ITreeNode<TreeItem>, index: number, templateData: Template, height: number | undefined): void {
        const extraClasses = [] as string[];
        if (element.element.codicon) {
            extraClasses.push('codicon-' + element.element.codicon, 'predefined-file-icon');
        }
        if (element.element.data.isMarked) {
            extraClasses.push('marked');
        }

        templateData._iconLabel.setLabel(element.element.label, '', { extraClasses });
        templateData.data.set(element.element, undefined);
    }

    disposeElement(element: ITreeNode<TreeItem>, index: number, templateData: Template, height: number | undefined): void {
        templateData.data.set(undefined, undefined);
    }

    disposeTemplate(templateData: Template): void {
        templateData.dispose();
    }
}
class Template extends Disposable {
    public readonly _iconLabel: IconLabel;

    public readonly data = observableValue<TreeItem | undefined>(this, undefined);

    constructor(public readonly element: HTMLElement) {
        super();

        this._iconLabel = new IconLabel(this.element, {});

        this._register(autorun(reader => {
            const item = this.data.read(reader);
            const classNames = item?.data.classNames.read(reader) ?? '';
            this.element.className = 'monaco-tl-contents ' + classNames;
        }));
    }
}

class TreeItem<TData extends ITreeNodeData<any> = ITreeNodeData<any>> {
    get label() { return this.data.label; }

    get codicon() { return this.data.codicon; }

    constructor(public readonly data: TData) { }
}

class TreeNode implements IObjectTreeElement<TreeItem> {

    public readonly children: TreeNode[];

    constructor(public readonly element: TreeItem, children: TreeNode[]) {
        this.children = children;
    }

    public get collapsible(): boolean { return this.children.length > 0; }
    public readonly collapsed = ObjectTreeElementCollapseState.Expanded;
    //?: boolean | ObjectTreeElementCollapseState | undefined;
    set(tree: ObjectTree<TreeItem, void>) {
        tree.setChildren(this.element, this.children);
        tree.setCollapsible(this.element, this.collapsible);
        for (const child of this.children) {
            child.set(tree);
        }
    }
}
