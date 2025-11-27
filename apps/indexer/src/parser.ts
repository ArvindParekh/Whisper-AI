// simple regex-based code parser - handles 95% of common patterns
// used ai to generate regex patterns, since tree-sitter isn't feasible in a worker environment

export interface Symbol {
	name: string;
	kind: 'function' | 'class' | 'method' | 'interface' | 'type' | 'variable';
	signature: string;
	lineStart: number;
	lineEnd: number;
	parent: string | null;
}

export interface ParsedFile {
	path: string;
	language: string;
	symbols: Symbol[];
	imports: string[];
	exports: string[];
}

const LANG_MAP: Record<string, string> = {
	ts: 'typescript',
	tsx: 'typescript',
	js: 'javascript',
	jsx: 'javascript',
	mjs: 'javascript',
	py: 'python',
	rs: 'rust',
	go: 'go',
};

export function parseFile(path: string, content: string): ParsedFile | null {
	const ext = path.split('.').pop()?.toLowerCase();
	if (!ext) return null;

	const language = LANG_MAP[ext];
	if (!language) return null;

	const lines = content.split('\n');

	// pick parser based on language
	const parser = PARSERS[language];
	if (!parser) {
		return { path, language, symbols: [], imports: [], exports: [] };
	}

	return parser(path, language, lines);
}

// language-specific parsers
const PARSERS: Record<string, (path: string, lang: string, lines: string[]) => ParsedFile> = {
	typescript: parseTypescript,
	javascript: parseTypescript, // same patterns work
	python: parsePython,
	go: parseGo,
	rust: parseRust,
};

// typescript/javascript parser
function parseTypescript(path: string, language: string, lines: string[]): ParsedFile {
	const symbols: Symbol[] = [];
	const imports: string[] = [];
	const exports: string[] = [];

	let currentClass: string | null = null;
	let braceDepth = 0;
	let classStartDepth = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		const lineNum = i + 1;

		// track brace depth for class scope
		braceDepth += (line.match(/\{/g) || []).length;
		braceDepth -= (line.match(/\}/g) || []).length;

		// exit class scope when braces close
		if (currentClass && braceDepth < classStartDepth) {
			currentClass = null;
		}

		// imports
		if (trimmed.startsWith('import ')) {
			const match = trimmed.match(/from\s+['"]([^'"]+)['"]/);
			if (match) imports.push(match[1]);
			continue;
		}

		// exports (re-exports)
		if (trimmed.startsWith('export ') && trimmed.includes(' from ')) {
			const match = trimmed.match(/from\s+['"]([^'"]+)['"]/);
			if (match) exports.push(match[1]);
			continue;
		}

		// class declaration
		const classMatch = trimmed.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/);
		if (classMatch) {
			const name = classMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'class',
				signature: trimmed.split('{')[0].trim(),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			currentClass = name;
			classStartDepth = braceDepth;
			exports.push(name);
			continue;
		}

		// interface
		const ifaceMatch = trimmed.match(/^(?:export\s+)?interface\s+(\w+)/);
		if (ifaceMatch) {
			const name = ifaceMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'interface',
				signature: trimmed.split('{')[0].trim(),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			exports.push(name);
			continue;
		}

		// type alias
		const typeMatch = trimmed.match(/^(?:export\s+)?type\s+(\w+)/);
		if (typeMatch) {
			symbols.push({
				name: typeMatch[1],
				kind: 'type',
				signature: trimmed.split('=')[0].trim(),
				lineStart: lineNum,
				lineEnd: lineNum,
				parent: null,
			});
			exports.push(typeMatch[1]);
			continue;
		}

		// function (standalone or exported)
		const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
		if (funcMatch) {
			const name = funcMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'function',
				signature: extractSignature(trimmed),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			if (trimmed.startsWith('export')) exports.push(name);
			continue;
		}

		// arrow function (const foo = () => or const foo = async () =>)
		const arrowMatch = trimmed.match(/^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/);
		if (arrowMatch && (trimmed.includes('=>') || lines[i + 1]?.includes('=>'))) {
			const name = arrowMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'function',
				signature: `const ${name} = (...)`,
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			if (trimmed.startsWith('export')) exports.push(name);
			continue;
		}

		// class method
		if (currentClass) {
			const methodMatch = trimmed.match(/^(?:async\s+)?(?:private\s+|public\s+|protected\s+)?(\w+)\s*\(/);
			if (methodMatch && !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('while')) {
				const name = methodMatch[1];
				const endLine = findBlockEnd(lines, i);
				symbols.push({
					name,
					kind: 'method',
					signature: extractSignature(trimmed),
					lineStart: lineNum,
					lineEnd: endLine,
					parent: currentClass,
				});
			}
		}
	}

	return { path, language, symbols, imports, exports };
}

// python parser
function parsePython(path: string, language: string, lines: string[]): ParsedFile {
	const symbols: Symbol[] = [];
	const imports: string[] = [];
	const exports: string[] = [];

	let currentClass: string | null = null;
	let currentIndent = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		const lineNum = i + 1;
		const indent = line.length - line.trimStart().length;

		// exit class when indent decreases
		if (currentClass && indent <= currentIndent && trimmed) {
			currentClass = null;
		}

		// imports
		if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
			const match = trimmed.match(/(?:from\s+(\S+)|import\s+(\S+))/);
			if (match) imports.push(match[1] || match[2]);
			continue;
		}

		// class
		const classMatch = trimmed.match(/^class\s+(\w+)/);
		if (classMatch) {
			const name = classMatch[1];
			const endLine = findPythonBlockEnd(lines, i, indent);
			symbols.push({
				name,
				kind: 'class',
				signature: trimmed.replace(':', ''),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			currentClass = name;
			currentIndent = indent;
			exports.push(name);
			continue;
		}

		// function/method
		const funcMatch = trimmed.match(/^(?:async\s+)?def\s+(\w+)/);
		if (funcMatch) {
			const name = funcMatch[1];
			const endLine = findPythonBlockEnd(lines, i, indent);
			const isMethod = currentClass !== null && indent > currentIndent;

			symbols.push({
				name,
				kind: isMethod ? 'method' : 'function',
				signature: trimmed.replace(':', ''),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: isMethod ? currentClass : null,
			});
			if (!isMethod && !name.startsWith('_')) exports.push(name);
		}
	}

	return { path, language, symbols, imports, exports };
}

// go parser
function parseGo(path: string, language: string, lines: string[]): ParsedFile {
	const symbols: Symbol[] = [];
	const imports: string[] = [];
	const exports: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		const lineNum = i + 1;

		// imports
		if (trimmed.startsWith('import ')) {
			const match = trimmed.match(/"([^"]+)"/);
			if (match) imports.push(match[1]);
			continue;
		}

		// func
		const funcMatch = trimmed.match(/^func\s+(?:\(.*?\)\s*)?(\w+)/);
		if (funcMatch) {
			const name = funcMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'function',
				signature: trimmed.split('{')[0].trim(),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			// go exports are uppercase
			if (name[0] === name[0].toUpperCase()) exports.push(name);
			continue;
		}

		// type struct
		const structMatch = trimmed.match(/^type\s+(\w+)\s+struct/);
		if (structMatch) {
			const name = structMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'class',
				signature: `type ${name} struct`,
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			if (name[0] === name[0].toUpperCase()) exports.push(name);
			continue;
		}

		// type interface
		const ifaceMatch = trimmed.match(/^type\s+(\w+)\s+interface/);
		if (ifaceMatch) {
			const name = ifaceMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'interface',
				signature: `type ${name} interface`,
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			if (name[0] === name[0].toUpperCase()) exports.push(name);
		}
	}

	return { path, language, symbols, imports, exports };
}

// rust parser
function parseRust(path: string, language: string, lines: string[]): ParsedFile {
	const symbols: Symbol[] = [];
	const imports: string[] = [];
	const exports: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		const lineNum = i + 1;

		// use statements
		if (trimmed.startsWith('use ')) {
			const match = trimmed.match(/use\s+([^;]+)/);
			if (match) imports.push(match[1]);
			continue;
		}

		// fn
		const fnMatch = trimmed.match(/^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/);
		if (fnMatch) {
			const name = fnMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'function',
				signature: trimmed.split('{')[0].trim(),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			if (trimmed.startsWith('pub')) exports.push(name);
			continue;
		}

		// struct
		const structMatch = trimmed.match(/^(?:pub\s+)?struct\s+(\w+)/);
		if (structMatch) {
			const name = structMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'class',
				signature: trimmed.split('{')[0].trim(),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			if (trimmed.startsWith('pub')) exports.push(name);
			continue;
		}

		// impl
		const implMatch = trimmed.match(/^impl\s+(?:<[^>]+>\s+)?(\w+)/);
		if (implMatch) {
			// we'll associate methods later if needed
			continue;
		}

		// trait
		const traitMatch = trimmed.match(/^(?:pub\s+)?trait\s+(\w+)/);
		if (traitMatch) {
			const name = traitMatch[1];
			const endLine = findBlockEnd(lines, i);
			symbols.push({
				name,
				kind: 'interface',
				signature: trimmed.split('{')[0].trim(),
				lineStart: lineNum,
				lineEnd: endLine,
				parent: null,
			});
			if (trimmed.startsWith('pub')) exports.push(name);
		}
	}

	return { path, language, symbols, imports, exports };
}

// helper: find end of a brace-delimited block
function findBlockEnd(lines: string[], startIdx: number): number {
	let depth = 0;
	let started = false;

	for (let i = startIdx; i < lines.length; i++) {
		const line = lines[i];
		for (const char of line) {
			if (char === '{') {
				depth++;
				started = true;
			} else if (char === '}') {
				depth--;
				if (started && depth === 0) {
					return i + 1;
				}
			}
		}
	}

	return Math.min(startIdx + 50, lines.length); // fallback
}

// helper: find end of python indented block
function findPythonBlockEnd(lines: string[], startIdx: number, startIndent: number): number {
	for (let i = startIdx + 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line.trim()) continue; // skip empty lines

		const indent = line.length - line.trimStart().length;
		if (indent <= startIndent) {
			return i;
		}
	}

	return lines.length;
}

// helper: extract function signature from line
function extractSignature(line: string): string {
	// remove body, keep just the signature part
	const withoutBody = line.split('{')[0].trim();
	// truncate if too long
	return withoutBody.length > 100 ? withoutBody.slice(0, 100) + '...' : withoutBody;
}
