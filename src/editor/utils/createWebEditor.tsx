import { Serializer } from "@hediet/semantic-json";
import { createJsonWebEditorClient } from "@vscode/web-editors";
import { ReactNode } from "react";
import { observableValue, IReader } from "vs/base/common/observable";
import { ObservableComponent } from "../../components/ObservableComponent";
import { validatorFromType } from "../../utils/validatorFromType";
import { mapOutUndefined } from "./observableUtils";


export function createWebEditor<T>(id: string, serializer: Serializer<T>) {
	abstract class AbstractWebEditor extends ObservableComponent {
		public static id = id;

		private readonly _rawValue = observableValue(this, undefined as T | undefined);
		protected readonly _value = mapOutUndefined(this._rawValue);
		private readonly _client = this._register(createJsonWebEditorClient(
			validatorFromType(serializer),
			v => this._rawValue.set(v, undefined)
		));

		abstract override renderObs(reader: IReader): ReactNode;
	}

	return AbstractWebEditor;
}
