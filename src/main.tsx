/// <reference types="vite/client" />

import React from "react";
import { createRoot } from 'react-dom/client';
import { App } from "./app";
import "./style.css";

const elem = document.getElementById('app')!;
const root = createRoot(elem);
let CurApp = App;
function update() {
    root.render(<CurApp />);
}

update();

if (import.meta.hot) {
    import.meta.hot.accept('./app', (newModule) => {
        CurApp = (newModule as any).App;
        update();
    });
}
