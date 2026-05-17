// Skulpt-powered step-through widget.

let steps = [];
let codeLines = [];
let knownNames = new Set();
let currentStepIndex = 0;
let stepElapsedMs = 0;
let isPlaying = false;
let isTraceReady = false;
let traceError = "";
let playButton;
let stepButton;
let highlightUntilByKey = {};
let lastHighlightStepIndex = -1;
let outputHighlightUntil = 0;
let lastOutputCount = 0;
let statusHighlightUntil = 0;
let lastStatusValue = "";
let pythonSource = "";
let uiScale = 1;

const STEP_DURATION_MS = 1500;
const DEFAULT_PYTHON_SOURCE = `
total = 0
for i in range(1, 5):
    total = total + i
    print(total)
`;

const BLOCKED_GLOBALS = new Set([
	"__name__",
	"__doc__",
	"__package__",
	"__loader__",
	"__spec__",
]);

function preload() {
	pythonSource = DEFAULT_PYTHON_SOURCE;
	const programPath = getProgramPath();
	loadStrings(
		programPath,
		(lines) => {
			if (lines && lines.length > 0) {
				pythonSource = lines.join("\n");
			}
		},
		() => {
			pythonSource = DEFAULT_PYTHON_SOURCE;
		}
	);
}

function getProgramPath() {
	try {
		const params = new URLSearchParams(window.location.search);
		const requested = params.get("program");
		if (requested && /^[A-Za-z0-9._-]+\.py$/.test(requested)) {
			return requested;
		}
	} catch (err) {
		return "program.py";
	}
	return "program.py";
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	textFont("Courier New");
	updateUiScale();
	textSize(scaleValue(18));

	setupControls();
	buildTrace();
}

function draw() {
	background(245, 247, 250);
	updateUiScale();
	drawLayout();

	advanceStep();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	updateUiScale();
	positionControls();
}

function setupControls() {
	playButton = createButton("Play");
	playButton.mousePressed(togglePlay);

	stepButton = createButton("Step");
	stepButton.mousePressed(stepOnce);

	const buttons = [playButton, stepButton];
	buttons.forEach((btn) => {
		btn.style("font-family", "Courier New");
		btn.style("font-size", `${Math.round(scaleFont(14))}px`);
		btn.style("padding", `${Math.round(scaleFont(6))}px ${Math.round(scaleFont(16))}px`);
		btn.style("min-width", `${Math.round(scaleFont(130))}px`);
		btn.style("text-align", "center");
	});

	positionControls();
}

function positionControls() {
	if (!playButton || !stepButton) return;
	const padding = scaleValue(28);
	const y = padding + scaleValue(8);
	const playX = padding + scaleValue(16);
	const gap = scaleValue(12);
	playButton.position(playX, y);
	playButton.style("font-size", `${Math.round(scaleFont(14))}px`);
	stepButton.style("font-size", `${Math.round(scaleFont(14))}px`);
	playButton.style("padding", `${Math.round(scaleFont(6))}px ${Math.round(scaleFont(16))}px`);
	stepButton.style("padding", `${Math.round(scaleFont(6))}px ${Math.round(scaleFont(16))}px`);
	playButton.style("min-width", `${Math.round(scaleFont(130))}px`);
	stepButton.style("min-width", `${Math.round(scaleFont(130))}px`);
	playButton.style("text-align", "center");
	stepButton.style("text-align", "center");
	const playWidth = playButton.elt ? playButton.elt.offsetWidth : scaleFont(130);
	stepButton.position(playX + playWidth + gap, y);
}

function togglePlay() {
	if (!isTraceReady || steps.length === 0) return;
	if (isPlaying) {
		isPlaying = false;
		playButton.html("Play");
		return;
	}

	if (currentStepIndex >= steps.length - 1) {
		resetRunState();
	}

	isPlaying = true;
	playButton.html("Pause");
}

function stepOnce() {
	if (!isTraceReady || steps.length === 0) return;
	isPlaying = false;
	playButton.html("Play");
	stepElapsedMs = 0;
	if (currentStepIndex < steps.length - 1) {
		currentStepIndex += 1;
	}
}

function resetRunState() {
	currentStepIndex = 0;
	stepElapsedMs = 0;
	lastHighlightStepIndex = -1;
	highlightUntilByKey = {};
	outputHighlightUntil = 0;
	lastOutputCount = 0;
	statusHighlightUntil = 0;
	lastStatusValue = "";
}

function buildTrace() {
	const normalized = normalizeSource(pythonSource);
	codeLines = normalized.split("\n");
	knownNames = extractKnownNames(codeLines);

	steps = [];
	currentStepIndex = 0;
	isTraceReady = false;
	traceError = "";

	const instrumented = instrumentSource(normalized);
	runSkulptTrace(instrumented)
		.then((traceSteps) => {
			steps = applyStepStatus(traceSteps);
			computeStepFocus(steps);
			isTraceReady = true;
		})
		.catch((err) => {
			traceError = err;
			isTraceReady = false;
		});
}

function advanceStep() {
	if (!isPlaying || !isTraceReady || steps.length === 0) return;
	stepElapsedMs += deltaTime;
	if (stepElapsedMs >= STEP_DURATION_MS) {
		stepElapsedMs = 0;
		if (currentStepIndex < steps.length - 1) {
			currentStepIndex += 1;
		} else {
			isPlaying = false;
			playButton.html("Play");
		}
	}
}

function drawLayout() {
	const padding = scaleValue(28);
	const gutter = scaleValue(30);
	const leftWidth = (width - padding * 2 - gutter) * 0.52;
	const rightWidth = (width - padding * 2 - gutter) * 0.48;
	const leftX = padding;
	const rightX = padding + leftWidth + gutter;
	const topY = padding;
	const panelHeight = height - padding * 2;
	const rightGap = scaleValue(18);
	const leftStatusHeight = scaleValue(90);
	const leftCodeHeight = panelHeight - leftStatusHeight - rightGap;
	const objectRowHeight = scaleValue(24);
	const outputRowHeight = scaleValue(22);
	const objectHeaderPad = scaleValue(70);
	const outputHeaderPad = scaleValue(70);
	const minRows = 5;

	const objectRowCount = isTraceReady && steps.length > 0
		? Math.max(minRows, buildScopeList(steps[currentStepIndex].locals, steps[currentStepIndex].globals, "locals", getLoopHeaderOverrides(currentStepIndex)).length)
		: minRows;
	const emittedOutputsCount = isTraceReady && steps.length > 0
		? steps
			.slice(0, currentStepIndex)
			.flatMap((step) => (step.stdoutLines ? step.stdoutLines : [])).length
		: 0;
	const outputRowCount = Math.max(minRows, emittedOutputsCount);

	const objectContentHeight = objectRowCount * objectRowHeight + objectHeaderPad;
	const outputContentHeight = outputRowCount * outputRowHeight + outputHeaderPad;
	const rightTotalHeight = objectContentHeight + rightGap + outputContentHeight;
	const rightScale = rightTotalHeight > panelHeight ? panelHeight / rightTotalHeight : 1;
	const rightTopHeight = objectContentHeight * rightScale;
	const outputHeight = outputContentHeight * rightScale;

	drawPanel(leftX, topY, leftWidth, leftCodeHeight, "");
	drawPanel(leftX, topY + leftCodeHeight + rightGap, leftWidth, leftStatusHeight, "Iteration Status");
	drawPanel(rightX, topY, rightWidth, rightTopHeight, "Object Explorer");
	drawPanel(rightX, topY + rightTopHeight + rightGap, rightWidth, outputHeight, "Output Explorer");

	drawCodeBlock(leftX, topY, leftWidth, leftCodeHeight);
	drawObjectExplorer(rightX, topY, rightWidth, rightTopHeight);
	drawStatusBox(leftX, topY + leftCodeHeight + rightGap, leftWidth, leftStatusHeight);
	drawOutputExplorer(rightX, topY + rightTopHeight + rightGap, rightWidth, outputHeight);
}

function drawPanel(x, y, w, h, title) {
	noStroke();
	fill(255);
	rect(x, y, w, h, 14);

	fill(50);
	textStyle(BOLD);
	textSize(scaleFont(16));
	text(title, x + scaleValue(18), y + scaleValue(30));
	textStyle(NORMAL);
	textSize(scaleFont(18));
}

function drawCodeBlock(x, y, w, h) {
	const lineHeight = scaleValue(28);
	const startY = y + scaleValue(70);
	const lineX = x + scaleValue(28);

	if (!isTraceReady || steps.length === 0) {
		fill(120);
		textSize(scaleFont(14));
		text(traceError ? `Error: ${traceError}` : "Preparing trace...", lineX + scaleValue(26), startY + codeLines.length * lineHeight + scaleValue(18));
		textSize(scaleFont(18));
		return;
	}

	const step = steps[currentStepIndex];
	const lineIndex = clamp(step.lineNo - 1, 0, codeLines.length - 1);
	const lineY = startY + lineIndex * lineHeight;
	const arrowSize = scaleValue(18);
	const highlightX = lineX + scaleValue(18);
	const highlightY = lineY - lineHeight + scaleValue(8);
	const highlightW = w - scaleValue(48);
	const highlightH = lineHeight;
	noStroke();
	if (step.status === "loop ends") {
		fill(245, 200, 210, 200);
	} else {
		fill(180, 235, 200, 200);
	}
	rect(highlightX, highlightY, highlightW, highlightH, 6);

	fill(30);
	for (let idx = 0; idx < codeLines.length; idx += 1) {
		const rowY = startY + idx * lineHeight;
		if (idx === lineIndex) {
			textStyle(BOLD);
			fill(0);
		} else {
			textStyle(NORMAL);
			fill(30);
		}
		textSize(scaleFont(18));
		const maxTextWidth = w - scaleValue(60);
		const displayLine = truncateLineToWidth(codeLines[idx], maxTextWidth);
		text(displayLine, lineX + scaleValue(26), rowY);
	}
	textStyle(NORMAL);
	const textHeight = textAscent() + textDescent();
	const textCenterY = lineY - textAscent() + textHeight * 0.5;
	const arrowY = textCenterY - arrowSize * 0.5;
	const arrowColor = getArrowColor(step);
	drawArrow(lineX, arrowY, arrowSize, arrowColor);
}

function drawObjectExplorer(x, y, w, h) {
	const startY = y + scaleValue(60);
	const rowHeight = scaleValue(24);
	const labelX = x + scaleValue(26);
	const valueX = x + w * 0.52;
	const maxRows = Math.floor((h - scaleValue(80)) / rowHeight);

	if (!isTraceReady || steps.length === 0) return;

	const step = steps[currentStepIndex];
	const overrides = getLoopHeaderOverrides(currentStepIndex);
	const variables = buildScopeList(step.locals, step.globals, "locals", overrides);
	const rows = variables.map((item) => ({ type: "item", scope: "locals", key: item.key, value: item.value }));
	updateValueHighlights();

	const visibleRows = rows.slice(0, maxRows);
	for (let i = 0; i < visibleRows.length; i += 1) {
		const row = visibleRows[i];
		const rowY = startY + i * rowHeight;
		const highlightUntil = highlightUntilByKey[row.key] || 0;
		if (highlightUntil > millis()) {
			const remaining = highlightUntil - millis();
			const alpha = Math.max(0, Math.min(180, (remaining / 1000) * 180));
			noStroke();
			fill(180, 235, 200, alpha);
			rect(x + scaleValue(14), rowY - scaleValue(4), w - scaleValue(28), rowHeight - scaleValue(4), scaleValue(6));
		}

		fill(20);
		textSize(scaleFont(15));
		text(row.key, labelX, rowY + scaleValue(14));
		fill(70);
		text(row.value, valueX, rowY + scaleValue(14));
		textSize(scaleFont(18));
	}
}

function drawOutputExplorer(x, y, w, h) {
	if (!isTraceReady || steps.length === 0) return;
	const startY = y + scaleValue(60);
	const lineHeight = scaleValue(22);
	const maxLines = Math.floor((h - scaleValue(80)) / lineHeight);
	const emittedOutputs = steps
		.slice(0, currentStepIndex)
		.flatMap((step) => (step.stdoutLines ? step.stdoutLines : []));
	const visibleOutputs = emittedOutputs.slice(-maxLines);
	const now = millis();
	if (emittedOutputs.length > lastOutputCount) {
		outputHighlightUntil = now + 1000;
		lastOutputCount = emittedOutputs.length;
	}
	if (outputHighlightUntil > now) {
		const remaining = outputHighlightUntil - now;
		const alpha = Math.max(0, Math.min(160, (remaining / 1000) * 160));
		noStroke();
		fill(180, 235, 200, alpha);
		rect(x + scaleValue(12), y + scaleValue(48), w - scaleValue(24), h - scaleValue(70), scaleValue(8));
	}

	fill(20);
	textSize(scaleFont(15));
	for (let i = 0; i < visibleOutputs.length; i += 1) {
		text(visibleOutputs[i], x + scaleValue(24), startY + i * lineHeight);
	}
	textSize(scaleFont(18));
}

function drawStatusBox(x, y, w, h) {
	const step = steps[currentStepIndex];
	const message = traceError
		? "error"
		: step && step.status
		? step.status
		: "iterating";
	const centerY = y + h * 0.6;
	const now = millis();
	if (message !== lastStatusValue) {
		statusHighlightUntil = now + 1000;
		lastStatusValue = message;
	}
	if (statusHighlightUntil > now) {
		const remaining = statusHighlightUntil - now;
		const alpha = Math.max(0, Math.min(160, (remaining / 1000) * 160));
		noStroke();
		fill(180, 235, 200, alpha);
		rect(x + scaleValue(12), y + scaleValue(40), w - scaleValue(24), h - scaleValue(56), scaleValue(8));
	}

	fill(20);
	textSize(scaleFont(16));
	textAlign(LEFT, CENTER);
	text(message, x + scaleValue(24), centerY);
	textAlign(LEFT, BASELINE);
	textSize(scaleFont(18));
}

function drawArrow(x, y, size, arrowColor) {
	push();
	translate(x, y);
	fill(arrowColor);
	noStroke();
	beginShape();
	vertex(0, 0);
	vertex(size, size * 0.5);
	vertex(0, size);
	vertex(size * 0.2, size * 0.5);
	endShape(CLOSE);
	pop();
}

function truncateLineToWidth(textLine, maxWidth) {
	if (textWidth(textLine) <= maxWidth) return textLine;
	const ellipsis = "...";
	let truncated = textLine;
	while (truncated.length > 0 && textWidth(truncated + ellipsis) > maxWidth) {
		truncated = truncated.slice(0, -1);
	}
	return truncated.length > 0 ? truncated + ellipsis : ellipsis;
}

function updateUiScale() {
	const baseWidth = 900;
	const baseHeight = 600;
	const scaleW = width / baseWidth;
	const scaleH = height / baseHeight;
	uiScale = Math.max(0.6, Math.min(1.2, Math.min(scaleW, scaleH)));
}

function scaleValue(value) {
	return value * uiScale;
}

function scaleFont(value) {
	return value * uiScale * 1.25;
}

function getArrowColor(step) {
	if (step && step.status === "loop ends") {
		return color(210, 70, 70);
	}
	return color(40, 180, 90);
}

function normalizeSource(source) {
	const trimmed = source.replace(/\r\n/g, "\n").trim();
	return trimmed.length === 0 ? "" : trimmed;
}

function instrumentSource(source) {
	const lines = source.split("\n");
	const instrumented = [
		"__trace_stack = []",
		"def __trace_call__(name):",
		"    __trace_stack.append(name)",
		"def __trace_return__(name):",
		"    if __trace_stack and __trace_stack[-1] == name:",
		"        __trace_stack.pop()",
		"",
	];

	const defStack = [];
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const trimmed = line.trim();
		const indent = line.match(/^\s*/)[0];
		const indentUnit = indent.includes("\t") ? "\t" : "    ";
		const nestedIndent = indent + indentUnit;
		if (trimmed !== "" && !trimmed.startsWith("#")) {
			while (defStack.length > 0 && indent.length <= defStack[defStack.length - 1].indent) {
				defStack.pop();
			}
		}

		const isLoopHeader = /^for\s+/.test(trimmed) || /^while\s+/.test(trimmed);
		const isSkippable =
			trimmed === "" ||
			trimmed.startsWith("#") ||
			trimmed.startsWith("@") ||
			/^(elif|else|except|finally)\b/.test(trimmed) ||
			isLoopHeader;

		if (!isSkippable) {
			instrumented.push(`${indent}__trace__(${i + 1}, globals(), __trace_stack)`);
		}

		const activeFunc = defStack.length > 0 ? defStack[defStack.length - 1] : null;
		if (activeFunc && /^return\b/.test(trimmed)) {
			instrumented.push(`${indent}__trace_return__('${activeFunc.name}')`);
		}

		instrumented.push(line);

		if (isLoopHeader) {
			instrumented.push(`${nestedIndent}__trace__(${i + 1}, globals(), __trace_stack)`);
		}

		if (/^def\s+/.test(trimmed)) {
			const nameMatch = trimmed.match(/^def\s+([A-Za-z_]\w*)/);
			if (nameMatch) {
				defStack.push({ name: nameMatch[1], indent: indent.length });
				instrumented.push(`${indent}    __trace_call__('${nameMatch[1]}')`);
			}
		}
	}

	return instrumented.join("\n");
}

function extractKnownNames(lines) {
	const names = new Set();
	const assignPattern = /^\s*([A-Za-z_]\w*)\s*=/;
	const forPattern = /^\s*for\s+([A-Za-z_]\w*)\s+in\b/;
	const globalPattern = /^\s*global\s+(.+)/;
	const defPattern = /^\s*def\s+([A-Za-z_]\w*)\s*\(/;

	lines.forEach((line) => {
		const trimmed = line.trim();
		if (trimmed.startsWith("#") || trimmed === "") return;
		const assignMatch = line.match(assignPattern);
		if (assignMatch) names.add(assignMatch[1]);
		const forMatch = line.match(forPattern);
		if (forMatch) names.add(forMatch[1]);
		const defMatch = line.match(defPattern);
		if (defMatch) names.add(defMatch[1]);
		const globalMatch = line.match(globalPattern);
		if (globalMatch) {
			globalMatch[1].split(",").forEach((name) => {
				const trimmedName = name.trim();
				if (trimmedName) names.add(trimmedName);
			});
		}
	});

	return names;
}

function runSkulptTrace(source) {
	return new Promise((resolve, reject) => {
		if (typeof Sk === "undefined") {
			reject("Skulpt not loaded");
			return;
		}

		const traceSteps = [];
		let pendingOutput = "";

		function output(text) {
			pendingOutput += text;
		}

		function flushOutputIntoLastStep() {
			if (!pendingOutput || traceSteps.length === 0) return;
			const lines = pendingOutput.replace(/\r\n/g, "\n").split("\n").filter((line) => line.length > 0);
			if (lines.length > 0) {
				traceSteps[traceSteps.length - 1].stdoutLines.push(...lines);
			}
			pendingOutput = "";
		}

		function builtinRead(path) {
			if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][path] === undefined) {
				throw new Error(`File not found: '${path}'`);
			}
			return Sk.builtinFiles["files"][path];
		}

		Sk.builtins.__trace__ = new Sk.builtin.func((lineNo, globalsObj, stackObj) => {
			flushOutputIntoLastStep();

			const globals = sanitizeScope(Sk.ffi.remapToJs(globalsObj));
			const locals = globals;
			const stack = Array.isArray(Sk.ffi.remapToJs(stackObj)) ? Sk.ffi.remapToJs(stackObj) : [];

			traceSteps.push({
				lineNo: Number(Sk.ffi.remapToJs(lineNo)),
				locals,
				globals,
				stack,
				stdoutLines: [],
			});
			return Sk.builtin.none.none$;
		});

		Sk.configure({
			output,
			read: builtinRead,
			__future__: Sk.python3,
		});

		Sk.misceval
			.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, source, true))
			.then(() => {
				flushOutputIntoLastStep();
				resolve(traceSteps);
			})
			.catch((err) => {
				reject(err.toString());
			});
	});
}

function sanitizeScope(scopeObj) {
	const sanitized = {};
	Object.keys(scopeObj || {}).forEach((key) => {
		if (key.startsWith("__") || BLOCKED_GLOBALS.has(key)) return;
		sanitized[key] = formatValue(scopeObj[key]);
	});
	return sanitized;
}

function formatValue(value) {
	if (value === null || value === undefined) return "unassigned";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) {
		return `[${value.map((item) => formatValue(item)).join(", ")}]`;
	}
	if (typeof value === "object") {
		try {
			return JSON.stringify(value);
		} catch (err) {
			return String(value);
		}
	}
	return String(value);
}

function applyStepStatus(traceSteps) {
	if (traceSteps.length === 0) return [];
	const stepsWithStatus = traceSteps.map((step) => ({
		...step,
		status: "iterating",
	}));

	const lastStep = stepsWithStatus[stepsWithStatus.length - 1];
	const terminalLineNo = Math.min(lastStep.lineNo + 1, codeLines.length || lastStep.lineNo);
	stepsWithStatus.push({
		...lastStep,
		lineNo: terminalLineNo,
		status: "loop ends",
		stdoutLines: [],
	});

	return stepsWithStatus;
}

function computeStepFocus(traceSteps) {
	for (let i = 0; i < traceSteps.length; i += 1) {
		const prev = i > 0 ? traceSteps[i - 1] : null;
		traceSteps[i].focus = findChangedKey(prev, traceSteps[i]);
	}
}

function findChangedKey(prevStep, step) {
	if (!step) return null;
	const prevLocals = (prevStep && prevStep.locals) || {};
	const prevGlobals = (prevStep && prevStep.globals) || {};
	const localKeys = new Set([...Object.keys(step.locals || {}), ...knownNames]);
	const globalKeys = new Set([...Object.keys(step.globals || {}), ...knownNames]);

	for (const key of localKeys) {
		const currentValue = step.locals && step.locals[key] !== undefined ? step.locals[key] : "unassigned";
		const previousValue = prevLocals[key] !== undefined ? prevLocals[key] : "unassigned";
		if (currentValue !== previousValue) return { scope: "locals", key };
	}

	for (const key of globalKeys) {
		const currentValue = step.globals && step.globals[key] !== undefined ? step.globals[key] : "unassigned";
		const previousValue = prevGlobals[key] !== undefined ? prevGlobals[key] : "unassigned";
		if (currentValue !== previousValue) return { scope: "globals", key };
	}

	return null;
}

function getChangedKeys(prevStep, step) {
	if (!step) return [];
	const prevLocals = (prevStep && prevStep.locals) || {};
	const prevGlobals = (prevStep && prevStep.globals) || {};
	const localKeys = new Set([...Object.keys(step.locals || {}), ...knownNames]);
	const globalKeys = new Set([...Object.keys(step.globals || {}), ...knownNames]);
	const changed = [];

	for (const key of localKeys) {
		const currentValue = step.locals && step.locals[key] !== undefined ? step.locals[key] : "unassigned";
		const previousValue = prevLocals[key] !== undefined ? prevLocals[key] : "unassigned";
		if (currentValue !== previousValue) changed.push(key);
	}

	for (const key of globalKeys) {
		const currentValue = step.globals && step.globals[key] !== undefined ? step.globals[key] : "unassigned";
		const previousValue = prevGlobals[key] !== undefined ? prevGlobals[key] : "unassigned";
		if (currentValue !== previousValue && !changed.includes(key)) changed.push(key);
	}

	return changed;
}

function buildScopeList(localsObj, globalsObj, scope, overrides) {
	const entries = [];
	const map = buildScopeMap(localsObj, globalsObj, scope, overrides);
	Object.keys(map)
		.sort((a, b) => a.localeCompare(b))
		.forEach((key) => {
			entries.push({ key, value: map[key] });
		});
	return entries;
}

function clamp(value, minValue, maxValue) {
	return Math.max(minValue, Math.min(maxValue, value));
}

function getLoopHeaderOverrides(stepIndex) {
	if (stepIndex <= 0) return null;
	const step = steps[stepIndex];
	if (!step) return null;
	const lineIndex = clamp(step.lineNo - 1, 0, codeLines.length - 1);
	const lineText = codeLines[lineIndex] || "";
	const match = lineText.match(/^\s*for\s+([A-Za-z_]\w*)\s+in\b/);
	if (!match) return null;
	const loopVar = match[1];
	const prevStep = steps[stepIndex - 1];
	const prevValue = prevStep && prevStep.locals && prevStep.locals[loopVar] !== undefined
		? prevStep.locals[loopVar]
		: "unassigned";
	return { [loopVar]: prevValue };
}

function buildScopeMap(localsObj, globalsObj, scope, overrides) {
	const map = {};
	const localKeys = new Set([...Object.keys(localsObj || {}), ...knownNames]);
	const globalKeys = new Set([...Object.keys(globalsObj || {}), ...knownNames]);

	if (scope === "locals") {
		localKeys.forEach((key) => {
			if (key.startsWith("__")) return;
			let value = localsObj && localsObj[key] !== undefined ? localsObj[key] : "unassigned";
			if (overrides && Object.prototype.hasOwnProperty.call(overrides, key)) {
				value = overrides[key];
			}
			map[key] = value;
		});
	} else {
		globalKeys.forEach((key) => {
			if (key.startsWith("__") || BLOCKED_GLOBALS.has(key)) return;
			if (localsObj && localsObj[key] !== undefined) return;
			map[key] = globalsObj && globalsObj[key] !== undefined ? globalsObj[key] : "unassigned";
		});
	}

	return map;
}

function getDisplayMapForStep(stepIndex) {
	if (stepIndex < 0 || stepIndex >= steps.length) return {};
	const step = steps[stepIndex];
	const overrides = getLoopHeaderOverrides(stepIndex);
	return buildScopeMap(step.locals, step.globals, "locals", overrides);
}

function updateValueHighlights() {
	if (currentStepIndex === lastHighlightStepIndex) return;
	const previousDisplay = getDisplayMapForStep(currentStepIndex - 1);
	const currentDisplay = getDisplayMapForStep(currentStepIndex);
	const changedKeys = Object.keys(currentDisplay).filter(
		(key) => currentDisplay[key] !== previousDisplay[key]
	);
	const now = millis();
	changedKeys.forEach((key) => {
		highlightUntilByKey[key] = now + 1000;
	});
	lastHighlightStepIndex = currentStepIndex;
}
