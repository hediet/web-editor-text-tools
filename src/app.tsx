import React from "react";
import { TextRangeEditorApp } from "./text-range-editor";
import { AstViewerApp } from "./ast-viewer";
import { DiffWebEditor, TextWebEditor } from "./editor/EditorApp";

export function App() {
    const editorType = new URLSearchParams(window.location.search).get('editor');

    const components = [DiffWebEditor, TextWebEditor];

    const uriSetTo = (editorType: string) => {
        const uri = new URL(window.location.href);
        uri.searchParams.set('editor', editorType);
        return uri.toString();
    }

    const selectedComp = components.find(c => c.id === editorType);
    if (selectedComp) {
        const Component = selectedComp;
        return <Component />;
    }

    switch (editorType) {
        case "ast-viewer": return <AstViewerApp />;
        case "selection-editor": return <TextRangeEditorApp />;
        case "editor": return <DiffWebEditor />;
        default:
            return <>
                Unknown editor type. Supported types are:
                <ul>
                    {components.map(c => <li><a href={uriSetTo(c.id)}>{c.id}</a></li>)}
                    <li>
                        <a href={uriSetTo('ast-viewer')}>"ast-viewer"</a>,
                    </li>
                    <li>
                        <a href={uriSetTo('selection-editor')}>"selection-editor"</a>
                    </li>
                </ul>

            </>;
    }
}
