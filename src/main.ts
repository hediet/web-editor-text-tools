/// <reference types="vite/client" />

import { AstViewer } from "./ast-viewer";
import { TextRangeEditor } from "./text-range-editor";

const elem = document.getElementById('app')!;

// query parameter "editor"
const editorType = new URLSearchParams(window.location.search).get('editor');

switch (editorType) {
    case "ast-viewer": {
        new AstViewer(elem);
        break;
    }

    case "selection-editor": {
        new TextRangeEditor(elem);
        break;
    }

    default:
        elem.innerText = 'Unknown editor type. Supported types are "ast-viewer" and "selection-editor"';
}
