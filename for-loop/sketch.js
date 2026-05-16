// p5.js animation: step through a simple Python for-loop with a code pointer
// and a variable explorer table.

let steps = [];
let currentStepIndex = 0;
let stepElapsedMs = 0;

const STEP_DURATION_MS = 1500;

const codeLines = [
	"for i in range(1, 5):",
	"    total = total + i",
	"    print(i)",
];

const tableRows = [
	{ key: "i", value: "" },
	{ key: "total", value: "" },
	{ key: "range", value: "1..4" },
	{ key: "condition", value: "" },
];

function setup() {
	createCanvas(windowWidth, windowHeight);
	textFont("Courier New");
	textSize(18);

	buildSteps();
}

function draw() {
	background(245, 247, 250);
	drawLayout();

	advanceStep();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function buildSteps() {
	const startTotal = 0;
	const startI = 1;
	const endI = 4;

	let total = startTotal;

	// Initial state before loop starts.
	steps.push({
		codeLine: 0,
		tableFocus: "range",
		iValue: "",
		totalValue: total,
		condition: "pending",
		output: "",
	});

	for (let i = startI; i <= endI; i += 1) {
		steps.push({
			codeLine: 0,
			tableFocus: "i",
			iValue: i,
			totalValue: total,
			condition: `i <= ${endI} => true`,
			output: "",
		});

		total += i;
		steps.push({
			codeLine: 1,
			tableFocus: "total",
			iValue: i,
			totalValue: total,
			condition: `i <= ${endI} => true`,
			output: "",
		});

		steps.push({
			codeLine: 2,
			tableFocus: "i",
			iValue: i,
			totalValue: total,
			condition: `i <= ${endI} => true`,
			output: `print -> ${i}`,
		});
	}

	steps.push({
		codeLine: 0,
		tableFocus: "condition",
		iValue: endI + 1,
		totalValue: total,
		condition: `i <= ${endI} => false`,
		output: "loop ends",
	});
}

function advanceStep() {
	stepElapsedMs += deltaTime;
	if (stepElapsedMs >= STEP_DURATION_MS) {
		stepElapsedMs = 0;
		currentStepIndex = (currentStepIndex + 1) % steps.length;
	}
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

	drawPanel(leftX, topY, leftWidth, panelHeight, "Python Code");
	drawPanel(rightX, topY, rightWidth, panelHeight, "Variable Explorer");

	drawCodeBlock(leftX, topY, leftWidth, panelHeight);
	drawTable(rightX, topY, rightWidth, panelHeight);
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
	const arrowY = startY + step.codeLine * lineHeight - 8;
	drawArrow(lineX, arrowY, 18, color(40, 180, 90));

	fill(70);
	textSize(14);
	text(step.output, lineX + 26, startY + codeLines.length * lineHeight + 18);
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
		if (row.key === "condition") value = step.condition;

		fill(20);
		text(row.key, keyX + 26, rowY);
		fill(70);
		text(value, valueX, rowY);
	}

	const focusIndex = tableRows.findIndex((row) => row.key === steps[currentStepIndex].tableFocus);
	if (focusIndex >= 0) {
		const arrowY = startY + focusIndex * rowHeight + 12;
		drawArrow(x + 18, arrowY, 16, color(40, 180, 90));
	}
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
