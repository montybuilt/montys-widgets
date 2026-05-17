// p5.js animation: step through a simple Python for-loop with a code pointer
// and a variable explorer table.

let steps = [];
let currentStepIndex = 0;
let stepElapsedMs = 0;
let isPlaying = false;
let playButton;
let startButton;
let stepButton;
let outputs = [];
let lastRecordedStepIndex = -1;

const STEP_DURATION_MS = 1500;

const codeLines = [
	"for i in range(1, 5):",
	"    total = total + i",
	"    print(total)",
];

const tableRows = [
	{ key: "i", value: "" },
	{ key: "total", value: "" },
	{ key: "range", value: "1..4" },
];

function setup() {
	createCanvas(windowWidth, windowHeight);
	textFont("Courier New");
	textSize(18);

	buildSteps();
	setupControls();
}

function draw() {
	background(245, 247, 250);
	drawLayout();

	advanceStep();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	positionControls();
}

function setupControls() {
	startButton = createButton("Start");
	startButton.mousePressed(startAnimation);

	playButton = createButton("Play");
	playButton.mousePressed(togglePlay);

	stepButton = createButton("Step");
	stepButton.mousePressed(stepOnce);

	const buttons = [startButton, playButton, stepButton];
	buttons.forEach((btn) => {
		btn.style("font-family", "Courier New");
		btn.style("font-size", "14px");
		btn.style("padding", "6px 12px");
	});

	positionControls();
}

function positionControls() {
	if (!startButton || !playButton || !stepButton) return;
	const padding = 28;
	const y = padding + 8;
	startButton.position(padding + 16, y);
	playButton.position(padding + 86, y);
	stepButton.position(padding + 156, y);
}

function startAnimation() {
	currentStepIndex = 0;
	stepElapsedMs = 0;
	isPlaying = true;
	outputs = [];
	lastRecordedStepIndex = -1;
	playButton.html("Pause");
}

function togglePlay() {
	isPlaying = !isPlaying;
	playButton.html(isPlaying ? "Pause" : "Play");
}

function stepOnce() {
	isPlaying = false;
	playButton.html("Play");
	stepElapsedMs = 0;
	if (currentStepIndex < steps.length - 1) {
		currentStepIndex += 1;
		recordOutputForStep();
	}
}

function buildSteps() {
	const startTotal = 0;
	const startI = 1;
	const endI = 4;

	let total = startTotal;
	let displayTotal = null;

	// Initial state before loop starts.
	steps.push({
		codeLine: 0,
		tableFocus: "range",
		iValue: null,
		totalValue: displayTotal,
		status: "iterating",
		output: "",
	});

	for (let i = startI; i <= endI; i += 1) {
		steps.push({
			codeLine: 0,
			tableFocus: "i",
			iValue: i,
			totalValue: displayTotal,
			status: "iterating",
			output: "",
		});

		total += i;
		displayTotal = total;
		steps.push({
			codeLine: 1,
			tableFocus: "total",
			iValue: i,
			totalValue: displayTotal,
			status: "iterating",
			output: "",
		});

		steps.push({
			codeLine: 2,
			tableFocus: "i",
			iValue: i,
			totalValue: displayTotal,
			status: "iterating",
			output: `print -> ${displayTotal}`,
		});
	}

	steps.push({
		codeLine: 0,
		tableFocus: "range",
		iValue: endI + 1,
		totalValue: displayTotal,
		status: "loop ends",
		output: "loop ends",
	});
}

function advanceStep() {
	if (!isPlaying) return;
	stepElapsedMs += deltaTime;
	if (stepElapsedMs >= STEP_DURATION_MS) {
		stepElapsedMs = 0;
		if (currentStepIndex < steps.length - 1) {
			currentStepIndex += 1;
			recordOutputForStep();
		} else {
			isPlaying = false;
			playButton.html("Play");
		}
	}
}

function recordOutputForStep() {
	if (currentStepIndex === lastRecordedStepIndex) return;
	const step = steps[currentStepIndex];
	if (step.output) {
		outputs.push(step.output);
	}
	lastRecordedStepIndex = currentStepIndex;
}

function drawLayout() {
	const padding = 28;
	const gutter = 30;
	const leftWidth = (width - padding * 2 - gutter) * 0.52;
	const rightWidth = (width - padding * 2 - gutter) * 0.48;
	const leftX = padding;
	const rightX = padding + leftWidth + gutter;
	const topY = padding;
	const panelHeight = height - padding * 2;
	const rightGap = 18;
	const rightTopHeight = panelHeight * 0.62;
	const rightBottomHeight = panelHeight - rightTopHeight - rightGap;
	const statusHeight = 90;
	const outputHeight = rightBottomHeight - statusHeight - rightGap;

	drawPanel(leftX, topY, leftWidth, panelHeight, "Python Code");
	drawPanel(rightX, topY, rightWidth, rightTopHeight, "Object Explorer");
	drawPanel(rightX, topY + rightTopHeight + rightGap, rightWidth, statusHeight, "Iteration Status");
	drawPanel(rightX, topY + rightTopHeight + rightGap + statusHeight + rightGap, rightWidth, outputHeight, "Output Explorer");

	drawCodeBlock(leftX, topY, leftWidth, panelHeight);
	drawTable(rightX, topY, rightWidth, rightTopHeight);
	drawStatusBox(rightX, topY + rightTopHeight + rightGap, rightWidth, statusHeight);
	drawOutputExplorer(rightX, topY + rightTopHeight + rightGap + statusHeight + rightGap, rightWidth, outputHeight);
}

function drawPanel(x, y, w, h, title) {
	noStroke();
	fill(255);
	rect(x, y, w, h, 14);

	fill(50);
	textStyle(BOLD);
	text(title, x + 18, y + 30);
	textStyle(NORMAL);
}

function drawCodeBlock(x, y, w, h) {
	const lineHeight = 30;
	const startY = y + 70;
	const lineX = x + 28;

	for (let idx = 0; idx < codeLines.length; idx += 1) {
		const lineY = startY + idx * lineHeight;
		fill(30);
		text(codeLines[idx], lineX + 26, lineY);
	}

	const step = steps[currentStepIndex];
	const lineY = startY + step.codeLine * lineHeight;
	const arrowSize = 18;
	const textHeight = textAscent() + textDescent();
	const textCenterY = lineY - textAscent() + textHeight * 0.5;
	const arrowY = textCenterY - arrowSize * 0.5;
	const arrowColor = getArrowColor(step);
	drawArrow(lineX, arrowY, arrowSize, arrowColor);

	fill(70);
	textSize(14);
	textSize(18);
}

function drawTable(x, y, w, h) {
	const startY = y + 70;
	const rowHeight = 38;
	const keyX = x + 22;
	const valueX = x + w * 0.52;

	stroke(230);
	for (let i = 0; i <= tableRows.length; i += 1) {
		const rowY = startY + i * rowHeight;
		line(x + 12, rowY, x + w - 12, rowY);
	}
	noStroke();

	const step = steps[currentStepIndex];
	for (let i = 0; i < tableRows.length; i += 1) {
		const row = tableRows[i];
		const rowY = startY + i * rowHeight + 24;

		let value = row.value;
		if (row.key === "i") value = step.iValue;
		if (row.key === "total") value = step.totalValue;
		if (value === null || value === undefined || value === "") {
			value = "unassigned";
		}

		fill(20);
		text(row.key, keyX + 26, rowY);
		fill(70);
		text(value, valueX, rowY);
	}

	const focusIndex = tableRows.findIndex((row) => row.key === steps[currentStepIndex].tableFocus);
	if (focusIndex >= 0) {
		const arrowY = startY + focusIndex * rowHeight + 12;
		const arrowColor = getArrowColor(steps[currentStepIndex]);
		drawArrow(x + 18, arrowY, 16, arrowColor);
	}
}

function drawOutputExplorer(x, y, w, h) {
	const startY = y + 60;
	const lineHeight = 22;
	const maxLines = Math.floor((h - 80) / lineHeight);
	const visibleOutputs = outputs.slice(-maxLines);

	fill(20);
	textSize(15);
	for (let i = 0; i < visibleOutputs.length; i += 1) {
		text(visibleOutputs[i], x + 24, startY + i * lineHeight);
	}
	textSize(18);
}

function drawStatusBox(x, y, w, h) {
	const step = steps[currentStepIndex];
	const message = step.status || "iterating";
	const centerY = y + h * 0.6;

	fill(20);
	textSize(16);
	textAlign(LEFT, CENTER);
	text(message, x + 24, centerY);
	textAlign(LEFT, BASELINE);
	textSize(18);
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

function getArrowColor(step) {
	if (step.status === "loop ends") {
		return color(210, 70, 70);
	}
	return color(40, 180, 90);
}
