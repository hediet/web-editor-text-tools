import { fileURLToPath, URL } from "url";
import { join, resolve } from "path";
import { defineConfig, searchForWorkspaceRoot } from "vite";

/** @type {import('vite').UserConfig} */
export default {
	esbuild: {
		target: "es6",
	},
	plugins: [vscodePlugin(resolve("./deps/vscode/src/vs"))],
	base: "./",
};

/**
 * @param {string} path
 */
function vscodePlugin(path) {
	function trimStart(str, prefix) {
		if (str.startsWith(prefix)) {
			return str.substring(prefix.length);
		}
		return str;
	}

	/** @type {import('vite').Plugin} */
	const p = {
		name: "transform-file",

		config: (config, env) => ({
			resolve: {
				alias: [
					{
						find: "vs/base/common/performance",
						replacement: join(
							__dirname,
							"./src/performance-override"
						),
					},
					{ find: /^vs\/css\!(.*)$/, replacement: "$1.css" },
					{ find: "vs/", replacement: `${resolve(path)}/` },
				],
			},
		}),

		transform(src, id) {
			const esmCommentBegin = "// ESM-comment-begin";
			const esmCommentEnd = "// ESM-comment-end";
			const esmUncommentBegin = "// ESM-uncomment-begin";
			const esmUncommentEnd = "// ESM-uncomment-end";

			const srcHasInstructions =
				src.includes(esmCommentBegin) ||
				src.includes(esmCommentEnd) ||
				src.includes(esmUncommentBegin) ||
				src.includes(esmUncommentEnd);
			if (!srcHasInstructions) {
				return;
			}

			const lines = src.split("\n");
			const resultLines = [];
			let shouldComment = false;
			let shouldUncomment = false;
			for (const l of lines) {
				const trimmed = l.trim();
				if (trimmed === esmCommentBegin) {
					shouldComment = true;
					shouldUncomment = false;
					continue;
				}
				if (trimmed === esmCommentEnd) {
					shouldComment = false;
					continue;
				}
				if (trimmed === esmUncommentBegin) {
					shouldUncomment = true;
					shouldComment = false;
					continue;
				}
				if (trimmed === esmUncommentEnd) {
					shouldUncomment = false;
					continue;
				}
				if (shouldComment) {
					resultLines.push(`// ${l}`);
				} else if (shouldUncomment) {
					resultLines.push(trimStart(l, "// "));
				} else {
					resultLines.push(l);
				}
			}

			const result = resultLines.join("\n");
			return {
				code: result,
				map: null,
			};
		},
	};

	return p;
}
