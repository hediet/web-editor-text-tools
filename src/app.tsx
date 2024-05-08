import React from "react";
import { TextRangeEditorApp } from "./text-range-editor";
import { AstViewerApp } from "./ast-viewer";

export function App() {
    const editorType = new URLSearchParams(window.location.search).get('editor');

    switch (editorType) {
        case "ast-viewer": return <AstViewerApp />;
        case "selection-editor": return <TextRangeEditorApp />;
        default:
            return <>Unknown editor type. Supported types are "ast-viewer" and "selection-editor"'</>;
    }
}
