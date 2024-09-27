import React from "react";
import { TextRangeEditorApp } from "./text-range-editor";
import { AstViewerApp } from "./ast-viewer";
import { EditorApp } from "./editor/EditorApp";

export function App() {
    const editorType = new URLSearchParams(window.location.search).get('editor');

    const uriSetTo = (editorType: string) => {
        const uri = new URL(window.location.href);
        uri.searchParams.set('editor', editorType);
        return uri.toString();
    }

    switch (editorType) {
        case "ast-viewer": return <AstViewerApp />;
        case "selection-editor": return <TextRangeEditorApp />;
        case "editor": return <EditorApp />;
        default:
            return <>
                Unknown editor type. Supported types are
                <a href={uriSetTo('ast-viewer')}>"ast-viewer"</a>,
                <a href={uriSetTo('editor')}>"editor"</a>
                and
                <a href={uriSetTo('selection-editor')}>"selection-editor"</a>
            </>;
    }
}
