import { Serializer } from "@hediet/semantic-json";
import { IValidator } from "@vscode/web-editors";

export function validatorFromType<T>(type: Serializer<T>): IValidator<T> {
    return {
        validate(content) {
            const result = type.deserialize(content as any);
            if (result.hasErrors) {
                return {
                    error: { message: result.formatError() },
                    content: undefined
                };
            }
            return { content: result.value, error: undefined };
        },
    };
}
