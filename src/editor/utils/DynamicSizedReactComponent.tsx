
import React from "react";
import "vs/base/browser/ui/codicons/codicon/codicon.css";
import "vs/editor/editor.all";
import { Component } from "../../components/Component";
import { DynamicSizedComponent } from "../../components/DynamicSizedComponent";

export class DynamicSizedReactComponent extends React.Component<{ componentCtor: () => Component }> {
	render() {
		return <div style={{ width: '100%', height: '100%' }} ref={this._setRoot} />;
	}

	private _component: DynamicSizedComponent | undefined;

	private readonly _setRoot = (element: HTMLElement | null) => {
		if (element) {
			this._component = new DynamicSizedComponent(element, this.props.componentCtor());
		} else {
			this._component?.dispose();
			this._component = undefined;
		}
	}
}
