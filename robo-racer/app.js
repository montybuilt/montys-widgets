"use strict";

const DIRS = ["north", "east", "south", "west"];
const VECTORS = { north: [-1, 0], east: [0, 1], south: [1, 0], west: [0, -1] };
const CARD_TYPES = {
  forward1: { name: "Forward 1", icon: "↑", kind: "move", amount: 1 },
  forward2: { name: "Forward 2", icon: "⇈", kind: "move", amount: 2 },
  forward3: { name: "Forward 3", icon: "↑↑↑", kind: "move", amount: 3 },
  back1: { name: "Back up", icon: "↓", kind: "back", amount: 1 },
  left: { name: "Turn left", icon: "↶", kind: "turn", amount: -1 },
  right: { name: "Turn right", icon: "↷", kind: "turn", amount: 1 },
  uturn: { name: "U-turn", icon: "⤵", kind: "turn", amount: 2 }
};

const scenarios = {
  training: {
    title: "Training Floor",
    brief: "Reach the beacon. Landing on the blue belt carries the robot through its exit.",
    start: [7, 1, "north"], goal: [1, 7], maxRounds: 8,
    pits: [[4, 4]], belts: [[3, 2, "east"], [3, 3, "east"], [3, 4, "east"]],
    gears: [[2, 6, 1]], lasers: [],
    walls: ["6,3,e", "6,4,w", "2,4,s", "3,4,n"],
    deck: ["forward1","forward1","forward2","forward2","forward3","left","right","right","back1"],
    tip: "Break the route into smaller parts: first reach the belt, then use its movement."
  },
  sorting: {
    title: "Sorting Works",
    brief: "Ride the conveyor system and account for the purple gears, which rotate your robot.",
    start: [7, 1, "east"], goal: [1, 7], maxRounds: 9,
    pits: [[5, 4], [5, 5], [2, 2]],
    belts: [[7,3,"north"],[6,3,"north"],[5,3,"north"],[4,3,"east"],[4,4,"east"],[4,5,"north"],[3,5,"north"]],
    gears: [[3,3,-1],[2,5,1]], lasers: [[1,4,true]],
    walls: ["6,1,n","5,1,s","3,6,e","3,7,w","1,5,s","2,5,n"],
    deck: ["forward1","forward1","forward2","forward2","forward3","left","left","right","right","uturn","back1"],
    tip: "Trace both systems: your card acts first, then the tile under the robot acts."
  },
  laser: {
    title: "Laser Lab",
    brief: "Lasers toggle after each round. Cross their rows when the beams are offline.",
    start: [7, 1, "north"], goal: [1, 7], maxRounds: 10,
    pits: [[6,4],[2,4],[4,7]],
    belts: [[7,2,"east"],[7,3,"east"],[5,5,"north"],[4,5,"north"]],
    gears: [[7,4,-1],[3,5,1]], lasers: [[5,0,true],[3,0,false]],
    walls: ["6,2,e","6,3,w","4,2,e","4,3,w","2,6,s","3,6,n"],
    deck: ["forward1","forward1","forward2","forward2","forward3","left","left","right","right","uturn","back1"],
    tip: "A good algorithm includes timing. Use a turn card to wait safely when a laser is active."
  }
};

const LAYOUT_VARIANTS = [
  { id: "A", name: "Core route" },
  { id: "B", name: "Crossflow route" },
  { id: "C", name: "Switchback route" }
];

const CUSTOM_LAYOUTS = {
  training: {
    B: {
      start: [7,7,"west"], goal: [1,1],
      pits: [[6,2],[2,6]],
      belts: [[6,6,"north"],[5,6,"west"],[5,5,"west"],[5,4,"north"]],
      gears: [[4,4,-1]], lasers: [],
      walls: ["7,5,n","6,5,s","3,3,e","3,4,w"]
    },
    C: {
      start: [8,4,"north"], goal: [2,8],
      pits: [[4,4],[2,2]],
      belts: [[6,4,"east"],[6,5,"east"],[6,6,"north"],[5,6,"north"]],
      gears: [[4,6,1]], lasers: [],
      walls: ["7,2,e","7,3,w","3,5,n","2,5,s"]
    }
  },
  sorting: {
    B: {
      start: [8,0,"east"], goal: [0,8],
      pits: [[7,5],[4,2],[1,6]],
      belts: [[8,2,"north"],[7,2,"north"],[6,2,"east"],[6,3,"east"],[6,4,"north"],
        [5,6,"north"],[4,6,"north"],[3,6,"west"],[3,5,"west"]],
      gears: [[5,4,1],[3,4,1]], lasers: [[2,0,false]],
      walls: ["7,0,n","6,0,s","5,5,e","5,6,w","1,7,s","2,7,n"]
    },
    C: {
      start: [8,8,"west"], goal: [0,1],
      pits: [[7,3],[5,1],[1,5]],
      belts: [[7,7,"north"],[6,7,"west"],[6,6,"west"],[6,5,"north"],[5,5,"north"],
        [4,3,"north"],[3,3,"north"],[2,3,"west"],[2,2,"west"]],
      gears: [[4,5,-1],[2,1,1]], lasers: [[1,0,false]],
      walls: ["8,5,n","7,5,s","4,4,e","4,5,w","1,2,e","1,3,w"]
    }
  },
  laser: {
    B: {
      start: [8,0,"east"], goal: [0,8],
      pits: [[7,6],[4,3],[1,2]],
      belts: [[8,3,"east"],[8,4,"north"],[5,6,"north"],[4,6,"north"]],
      gears: [[7,4,-1],[3,6,1]], lasers: [[6,0,true],[3,0,false]],
      walls: ["7,1,n","6,1,s","5,4,e","5,5,w","2,7,s","3,7,n"]
    },
    C: {
      start: [8,8,"west"], goal: [0,0],
      pits: [[7,2],[4,7],[1,4]],
      belts: [[8,6,"north"],[7,6,"west"],[7,5,"west"],[3,3,"north"],[2,3,"west"]],
      gears: [[7,4,1],[2,2,-1]], lasers: [[5,0,true],[2,0,false]],
      walls: ["6,7,w","6,6,e","4,4,n","3,4,s","1,1,e","1,2,w"]
    }
  }
};

const els = {};
let state = {};
let cardCounter = 0;
let pointerDrag = null;
let suppressCardClick = false;
let feedbackTimer = null;
const progressStorageKey = "roboRacerProgress:v1";
let progress = loadProgress();
const wait = ms => new Promise(resolve => setTimeout(resolve, matchMedia("(prefers-reduced-motion: reduce)").matches ? 20 : ms));

function defaultProgress() {
  return { courses: {} };
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(progressStorageKey));
    return saved && saved.courses ? saved : defaultProgress();
  } catch (error) {
    return defaultProgress();
  }
}

function saveProgress() {
  try {
    localStorage.setItem(progressStorageKey, JSON.stringify(progress));
  } catch (error) {
    // Course play still works if storage is unavailable.
  }
}

function recordCourseCompletion() {
  if (!state.scenarioId || state.scenarioId === "__test-board") return;
  const prior = progress.courses[state.scenarioId] || {};
  const now = new Date().toISOString();
  const completedModes = {
    ...(prior.completedModes || {}),
    ...(prior.mode ? { [prior.mode]: true } : {}),
    [state.mode]: true
  };
  progress.courses[state.scenarioId] = {
    ...prior,
    completed: true,
    completedModes,
    completedAt: prior.completedAt || now,
    lastCompletedAt: now,
    mode: state.mode,
    bestRound: Math.min(prior.bestRound || Infinity, state.round)
  };
  saveProgress();
  renderCourseBadges();
}

function shortBadgeLabel(id, title) {
  const routeMatch = id.match(/^(training|sorting|laser)-([abc])$/i);
  if (routeMatch) {
    const route = routeMatch[1];
    return `${route[0].toUpperCase()}${route.slice(1)} ${routeMatch[2].toUpperCase()}`;
  }
  return String(title || id).split(" · ")[0].slice(0, 16);
}

function renderCourseBadges() {
  if (!els.courseBadges) return;
  els.courseBadges.replaceChildren();
  Object.entries(scenarios)
    .filter(([id]) => id !== "__test-board")
    .forEach(([id, course]) => {
      const courseProgress = progress.courses[id];
      const completedModes = courseProgress?.completedModes || {};
      const level = completedModes.hard || courseProgress?.mode === "hard"
        ? "hard"
        : (completedModes.easy || courseProgress?.mode === "easy" || courseProgress?.completed ? "easy" : "");
      const earned = Boolean(level);
      const badge = document.createElement("div");
      badge.className = `course-badge${earned ? ` earned ${level}` : ""}`;
      badge.setAttribute("role", "img");
      const status = earned ? `completed in ${level === "hard" ? "Hard" : "Easy"} mode` : "not completed";
      badge.setAttribute("aria-label", `${course.title}: ${status}`);
      badge.title = `${course.title} — ${status[0].toUpperCase()}${status.slice(1)}`;

      const icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "★";
      const label = document.createElement("strong");
      label.textContent = shortBadgeLabel(id, course.title);
      badge.append(icon, label);
      els.courseBadges.appendChild(badge);
    });
}

document.addEventListener("DOMContentLoaded", init);

async function init() {
  ["board","scenarioSelect","modeSelect","missionTitle","missionBrief","roundValue","damageValue","goalValue","bestValue","newGameBtn",
    "registers","hand","cardsRemaining","runBtn","clearProgramBtn","traceList","traceStatus","courseBadges",
    "programHint","feedback","announcer","helpBtn","helpDialog","traceBtn","traceDialog","fullscreenBtn","teacherBtn","teacherDialog",
    "teacherForm","teacherCode","teacherError","teacherGate","teacherResources"].forEach(id => els[id] = document.getElementById(id));
  Object.keys(scenarios).forEach(id => delete scenarios[id]);
  els.scenarioSelect.innerHTML="";
  await loadPublishedBoards();
  const testBoard = loadTestBoard();
  els.scenarioSelect.addEventListener("change", () => loadScenario(els.scenarioSelect.value));
  window.addEventListener("storage", event => {
    if (event.key !== progressStorageKey) return;
    progress = loadProgress();
    renderCourseBadges();
  });
  els.modeSelect.addEventListener("change", () => {
    safeStorageSet("roboRacerMode", els.modeSelect.value);
    state.mode = els.modeSelect.value;
    render();
  });
  els.clearProgramBtn.addEventListener("click", clearProgram);
  els.runBtn.addEventListener("click", runProgram);
  els.newGameBtn.addEventListener("click", () => {
    if (!els.newGameBtn.disabled) loadScenario(state.scenarioId, state.variantId);
  });
  els.helpBtn.addEventListener("click", () => els.helpDialog.showModal());
  els.helpDialog.querySelectorAll(".dialog-close,.dialog-done").forEach(b => b.addEventListener("click", () => els.helpDialog.close()));
  els.traceBtn.addEventListener("click", () => els.traceDialog.showModal());
  els.traceDialog.querySelector(".dialog-close").addEventListener("click", () => els.traceDialog.close());
  els.teacherBtn.addEventListener("click", () => {
    els.teacherError.textContent = "";
    els.teacherCode.value = "";
    els.teacherGate.hidden = false;
    els.teacherResources.hidden = true;
    els.teacherDialog.showModal();
  });
  els.teacherForm.addEventListener("submit", teacherSubmit);
  els.teacherDialog.querySelector(".dialog-close").addEventListener("click", () => els.teacherDialog.close());
  els.fullscreenBtn.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => els.fullscreenBtn.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen");
  const firstBoardId=testBoard?.id || els.scenarioSelect.options[0]?.value;
  if(firstBoardId) loadScenario(firstBoardId);
  else {
    els.missionTitle.textContent="No boards available";
    els.missionBrief.textContent="Add a board to data/boards.json with the Board Editor.";
  }
  if (!safeStorageGet("roboRacerLessonSeen")) {
    els.helpDialog.showModal();
    safeStorageSet("roboRacerLessonSeen", "1");
  }
}

async function loadPublishedBoards() {
  try {
    const response=await fetch("data/boards.json",{cache:"no-store"});
    if(!response.ok) return;
    const boards=await response.json();
    if(!Array.isArray(boards)) return;
    boards.forEach(addCustomScenario);
  } catch {
    // Built-in courses remain available when the optional board library is absent.
  }
}

function loadTestBoard() {
  if(new URLSearchParams(location.search).get("testBoard")!=="1") return null;
  try {
    const value=JSON.parse(localStorage.getItem("roboRacerTestBoard"));
    if(!value) return null;
    value.id="__test-board";
    value.title=`Test: ${value.title || "Untitled Course"}`;
    addCustomScenario(value);
    return value;
  } catch { return null; }
}

function addCustomScenario(value) {
  if(!value?.id || !value.start || !value.goal) return;
  const course={
    title:value.title || "Untitled Course",
    brief:value.brief || "Reach the beacon.",
    rows:Number(value.rows) || 9,
    columns:Number(value.columns) || 9,
    start:value.start, goal:value.goal, maxRounds:value.maxRounds || 10,
    pits:value.pits || [], deadSquares:value.deadSquares || [], belts:value.belts || [], gears:value.gears || [],
    wormholes:value.wormholes || [], warp:value.warp || null,
    lasers:value.lasers || [], walls:value.walls || [],
    deck:value.deck || ["forward1","forward1","forward2","forward2","forward3","left","left","right","right","uturn","back1"],
    tip:value.tip || "Trace the program one instruction at a time and account for every board element.",
    custom:true
  };
  scenarios[value.id]=course;
  const existing=[...els.scenarioSelect.options].find(option=>option.value===value.id);
  if(existing) existing.textContent=course.title;
  else els.scenarioSelect.add(new Option(course.title,value.id));
}

function buildScenarioVariant(base, variantId, scenarioId) {
  const source = base.custom || variantId === "A"
    ? base
    : { ...base, ...(CUSTOM_LAYOUTS[scenarioId]?.[variantId] || {}) };
  const copy = {
    ...source,
    rows: Number(source.rows) || 9,
    columns: Number(source.columns) || 9,
    start: [...source.start],
    goal: [...source.goal],
    pits: source.pits.map(item => [...item]),
    deadSquares: (source.deadSquares || []).map(item => [...item]),
    belts: source.belts.map(item => [...item]),
    gears: source.gears.map(item => [...item]),
    wormholes: (source.wormholes || []).map(item => [...item]),
    warp: source.warp ? [...source.warp] : null,
    lasers: source.lasers.map(item => [...item]),
    walls: [...source.walls],
    deck: [...source.deck]
  };

  validateScenarioVariant(copy);
  return copy;
}

function validateScenarioVariant(course) {
  const maxRow = course.rows - 1;
  const maxColumn = course.columns - 1;
  const coordinates = [
    course.start, course.goal, ...course.pits, ...course.deadSquares, ...course.belts,
    ...course.gears, ...course.wormholes, ...course.lasers, course.warp
  ].filter(Boolean);
  if (coordinates.some(item => item[0] < 0 || item[0] > maxRow || item[1] < 0 || item[1] > maxColumn)) {
    throw new Error(`Course variation "${course.title}" placed an element outside the board.`);
  }
  if (course.pits.some(item => item[0] === course.start[0] && item[1] === course.start[1])) {
    throw new Error(`Course variation "${course.title}" placed the start in a pit.`);
  }
  if (course.pits.some(item => item[0] === course.goal[0] && item[1] === course.goal[1])) {
    throw new Error(`Course variation "${course.title}" placed the goal in a pit.`);
  }
  if (course.deadSquares.some(item =>
    (item[0] === course.start[0] && item[1] === course.start[1]) ||
    (item[0] === course.goal[0] && item[1] === course.goal[1])
  )) {
    throw new Error(`Course variation "${course.title}" placed the start or goal on a dead square.`);
  }
  course.walls.forEach(wall => {
    const [row, column, side] = wall.split(",");
    if (Number(row) < 0 || Number(row) > maxRow || Number(column) < 0 || Number(column) > maxColumn || !["n","e","s","w"].includes(side)) {
      throw new Error(`Course variation "${course.title}" contains an invalid wall.`);
    }
  });
  course.belts.forEach(([, , direction], index) => {
    if (!VECTORS[direction]) {
      throw new Error(`Course variation "${course.title}" contains an invalid conveyor direction.`);
    }
    const [dr, dc] = VECTORS[direction];
    const [row, column] = course.belts[index];
    if (row + dr < 0 || row + dr > maxRow || column + dc < 0 || column + dc > maxColumn) {
      throw new Error(`Course variation "${course.title}" contains an invalid conveyor exit.`);
    }
  });
}

function loadScenario(id, requestedVariantId = null) {
  const base = scenarios[id];
  if(!base) return;
  const variant = LAYOUT_VARIANTS[0];
  const s = buildScenarioVariant(base, variant.id, id);
  const mode = safeStorageGet("roboRacerMode") === "hard" ? "hard" : "easy";
  state = {
    scenarioId: id, variantId: variant.id, course: s,
    robot: { r: s.start[0], c: s.start[1], dir: s.start[2] },
    round: 1, reboots: 0, running: false, won: false, program: [], hand: [],
    lasers: s.lasers.map(x => ({
      r:x[0], c:x[1], active:x[2],
      orientation:(x[3] === "north" || x[3] === "south" || x[3] === "vertical") ? "vertical" : "horizontal",
      color:x[4] || "#da2722"
    })),
    wormholes: s.wormholes.map(x => ({r:x[0], c:x[1], active:x[2] !== false})),
    warp: s.warp ? {r:s.warp[0], c:s.warp[1], active:s.warp[2] !== false} : null,
    attempts: 0,
    activatedElementKey: null, rebooted: false, rebootEndsRound: false,
    laserHit: false, perimeterHit: false, mode
  };
  dealHand();
  els.scenarioSelect.value = id;
  els.modeSelect.value = mode;
  els.missionTitle.textContent = s.title;
  els.missionBrief.textContent = base.custom ? s.brief : `${s.brief} Layout ${variant.id}: ${variant.name}.`;
  els.feedback.hidden = true;
  setTrace(["Your instructions and the factory's response will appear here."]);
  render();
}

function dealHand() {
  const pool = [...state.course.deck];
  const dealt = [];

  // Preserve the planning challenge while preventing hands that lack
  // the basic ingredients for a useful route.
  drawMatching(pool, dealt, type => type === "left");
  drawMatching(pool, dealt, type => type === "right");
  for (let i = 0; i < 4; i++) {
    drawMatching(pool, dealt, type => type.startsWith("forward"));
  }

  shuffle(pool);
  dealt.push(...pool.slice(0, 8 - dealt.length));
  shuffle(dealt);

  state.hand = dealt.map(type => ({ id: ++cardCounter, type }));
  state.program = Array(5).fill(null);
}

function drawMatching(pool, destination, matches) {
  const choices = pool
    .map((type, index) => ({ type, index }))
    .filter(card => matches(card.type));
  if (!choices.length) return;
  const choice = choices[Math.floor(Math.random() * choices.length)];
  destination.push(choice.type);
  pool.splice(choice.index, 1);
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function render() {
  renderBoard();
  renderProgram();
  renderCourseBadges();
  const s = state.course;
  els.roundValue.textContent = state.round;
  els.damageValue.textContent = state.reboots;
  els.goalValue.textContent = s.maxRounds;
  const best = safeStorageGet(`roboRacerBest-${state.scenarioId}-${state.mode}`);
  els.bestValue.textContent = best || "—";
  const courseProgress = progress.courses[state.scenarioId];
  els.newGameBtn.disabled = !(courseProgress?.completed || best);
}

function renderBoard() {
  const s = state.course;
  els.board.innerHTML = "";
  els.board.style.setProperty("--board-rows", s.rows);
  els.board.style.setProperty("--board-columns", s.columns);
  els.board.style.setProperty("--board-aspect", s.columns / s.rows);
  els.board.closest(".board-wrap").style.setProperty("--course-aspect", s.columns / s.rows);
  for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.columns; c++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("role", "gridcell");
    let label = `Row ${r+1}, column ${c+1}`;
    const wallDirs = s.walls.filter(w => w.startsWith(`${r},${c},`)).map(w => w.split(",")[2]);
    wallDirs.forEach(d => cell.classList.add(`wall-${d}`));
    let symbol = "";
    if (s.deadSquares.some(x => x[0] === r && x[1] === c)) {
      cell.classList.add("dead-square");
      label += ", impassable dead square";
    }
    const belt = s.belts.find(x => x[0] === r && x[1] === c);
    if (belt) {
      cell.classList.add("belt", `belt-${belt[2]}`);
      symbol = dirArrow(belt[2]);
      label += `, conveyor ${belt[2]}`;
    }
    const gear = s.gears.find(x => x[0] === r && x[1] === c);
    if (gear) { cell.classList.add("gear"); symbol = gear[2] > 0 ? "↻" : "↺"; label += `, gear turns ${gear[2] > 0 ? "right" : "left"}`; }
    const wormhole = wormholeAt(r,c);
    if (wormhole) {
      cell.classList.add("wormhole");
      if (!wormhole.active) cell.classList.add("off");
      symbol = "@";
      label += `, wormhole ${wormhole.active ? "active" : "inactive"}`;
    }
    const warp = state.warp?.r === r && state.warp?.c === c ? state.warp : null;
    if (warp) {
      cell.classList.add("warp");
      if (!warp.active) cell.classList.add("off");
      symbol = "◎";
      label += `, Warp target ${warp.active ? "active" : "inactive"}`;
    }
    if (s.pits.some(x => x[0] === r && x[1] === c)) { cell.classList.add("pit"); symbol = "●"; label += ", pit"; }
    const laser = laserAt(r,c);
    if (laser) {
      cell.classList.add("laser");
      if (laser.orientation === "vertical") cell.classList.add("laser-vertical");
      if (!laser.active) cell.classList.add("off");
      cell.style.setProperty("--laser-color", laser.color);
      symbol = laser.active ? (laser.orientation === "vertical" ? "┃" : "━") : "·";
      label += `, ${laser.orientation} laser ${laser.active ? "active" : "offline"}`;
    }
    if (s.goal[0] === r && s.goal[1] === c) { cell.classList.add("goal"); symbol = "★"; label += ", goal"; }
    if (symbol) { const span = document.createElement("span"); span.className = "tile-symbol"; span.textContent = symbol; cell.append(span); }
    if (state.robot.r === r && state.robot.c === c) {
      const robot = document.createElement("span");
      robot.className = `robot ${state.robot.dir}`;
      robot.setAttribute("aria-hidden", "true");
      cell.append(robot);
      label += `, robot facing ${state.robot.dir}`;
    }
    cell.setAttribute("aria-label", label);
    els.board.append(cell);
  }
}

function renderProgram() {
  els.registers.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const slot = document.createElement("div");
    slot.className = `register-slot${state.running && state.activeRegister === i ? " active" : ""}`;
    slot.dataset.slotIndex = i;
    slot.setAttribute("aria-label", `Program position ${i + 1}${state.program[i] ? `, ${CARD_TYPES[state.program[i].type].name}` : ", empty"}`);
    if (state.program[i]) {
      const card = makeCardButton(state.program[i], "program-card", `${i+1}. `);
      card.disabled = state.running;
      makeCardDraggable(card, { source: "program", index: i });
      card.addEventListener("click", event => {
        if (consumeSuppressedCardClick(event)) return;
        removeFromProgram(i);
      });
      slot.append(card);
    } else slot.textContent = `${i+1}`;
    els.registers.append(slot);
  }
  els.hand.innerHTML = "";
  state.hand.forEach(card => {
    const button = makeCardButton(card, "hand-card");
    const selected = state.program.some(programCard => programCard?.id === card.id);
    button.classList.toggle("is-used", selected);
    button.setAttribute("aria-pressed", String(selected));
    if (selected) button.setAttribute("aria-label", `${CARD_TYPES[card.type].name}, already in program`);
    button.disabled = state.running || selected || programCardCount() >= 5;
    if (!button.disabled) makeCardDraggable(button, { source: "hand", id: card.id });
    button.addEventListener("click", event => {
      if (consumeSuppressedCardClick(event)) return;
      addToProgram(card.id);
    });
    els.hand.append(button);
  });
  const remaining = 5 - programCardCount();
  els.cardsRemaining.textContent = remaining ? `Choose ${remaining}` : "Program ready";
  els.runBtn.disabled = state.running || remaining > 0 || state.won;
  els.runBtn.textContent = state.running ? "Running…" : "Run program";
  els.clearProgramBtn.disabled = state.running || programCardCount() === 0;
}

function makeCardButton(card, className, prefix = "") {
  const data = CARD_TYPES[card.type];
  const b = document.createElement("button");
  b.type = "button"; b.className = className;
  b.setAttribute("aria-label", `${prefix}${data.name}`);
  b.innerHTML = `<span class="card-icon" aria-hidden="true">${data.icon}</span><span class="card-name">${prefix}${data.name}</span>`;
  return b;
}

function addToProgram(id) {
  const emptyIndex = state.program.findIndex(card => !card);
  if (emptyIndex < 0) return;
  const card = state.hand.find(handCard => handCard.id === id);
  if (!card || state.program.some(programCard => programCard?.id === id)) return;
  state.program[emptyIndex] = card;
  renderProgram();
}
function removeFromProgram(index) {
  state.program[index] = null;
  renderProgram();
}
function clearProgram() {
  state.program = Array(5).fill(null);
  renderProgram();
}

function programCardCount() {
  return state.program.filter(Boolean).length;
}

function clearDragStyles() {
  document.querySelectorAll(".is-dragging,.drag-over").forEach(element => {
    element.classList.remove("is-dragging", "drag-over");
  });
}

function applyProgramDrop(payload, targetIndex) {
  if (payload.source === "hand") {
    const card = state.hand.find(handCard => handCard.id === payload.id);
    if (!card || state.program.some(programCard => programCard?.id === card.id)) return;
    state.program[targetIndex] = card;
  } else if (payload.source === "program") {
    const sourceIndex = Number(payload.index);
    if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex > 4 || sourceIndex === targetIndex) return;
    [state.program[sourceIndex], state.program[targetIndex]] = [state.program[targetIndex], state.program[sourceIndex]];
  } else {
    return;
  }
  renderProgram();
}

function makeCardDraggable(card, payload) {
  card.classList.add("is-draggable");
  card.addEventListener("pointerdown", event => {
    if (event.button !== 0 || state.running) return;
    pointerDrag = {
      card,
      payload,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    card.setPointerCapture(event.pointerId);
  });
  card.addEventListener("pointermove", event => {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
    if (!pointerDrag.moved && distance < 6) return;
    pointerDrag.moved = true;
    event.preventDefault();
    card.classList.add("is-dragging");
    document.querySelectorAll(".register-slot.drag-over").forEach(slot => slot.classList.remove("drag-over"));
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".register-slot");
    if (target) target.classList.add("drag-over");
  });
  card.addEventListener("pointerup", finishPointerDrag);
  card.addEventListener("pointercancel", cancelPointerDrag);
}

function finishPointerDrag(event) {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
  const drag = pointerDrag;
  pointerDrag = null;
  if (!drag.moved) return;
  event.preventDefault();
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".register-slot");
  clearDragStyles();
  suppressCardClick = true;
  setTimeout(() => { suppressCardClick = false; }, 0);
  if (target) applyProgramDrop(drag.payload, Number(target.dataset.slotIndex));
}

function cancelPointerDrag() {
  pointerDrag = null;
  clearDragStyles();
}

function consumeSuppressedCardClick(event) {
  if (!suppressCardClick) return false;
  suppressCardClick = false;
  event.preventDefault();
  return true;
}

async function runProgram() {
  state.running = true; state.attempts++; state.rebooted = false; state.rebootEndsRound = false;
  els.feedback.hidden = true;
  setTrace([]);
  renderProgram();
  for (let i = 0; i < state.program.length; i++) {
    state.activeRegister = i; renderProgram();
    const card = CARD_TYPES[state.program[i].type];
    addTrace(`${i+1}. ${card.name}`, true);
    await executeCard(card);
    if (await checkHazard("after your instruction")) break;
    const effects = await activateBoard();
    if (effects) addTrace(`Factory: ${effects}`);
    addTrace(`State: row ${state.robot.r+1}, column ${state.robot.c+1}, facing ${state.robot.dir}.`);
    if (await checkHazard("after the factory moved")) break;
    if (state.mode === "easy" && atGoal()) { win(); break; }
    await wait(280);
  }
  if (!state.won && !state.rebooted && state.mode === "hard" && atGoal()) win();
  if (!state.won && state.rebooted && state.rebootEndsRound) {
    state.round++;
    state.lasers.forEach(l => l.active = !l.active);
    state.wormholes.forEach(w => w.active = !w.active);
    if (state.warp) state.warp.active = Math.random() < 0.5;
    if (state.round > state.course.maxRounds) {
      showFeedback("warning", "The factory clock ran out", "This attempt is over. The course will restart with a new opening hand.");
      await wait(1600);
      loadScenario(state.scenarioId, state.variantId);
      return;
    }
    addTrace(`Round ended by hazard. Round ${state.round} begins; lasers and wormholes switched state, and Warp availability was randomized.`);
  }
  if (!state.won && !state.rebooted) {
    state.round++;
    state.lasers.forEach(l => l.active = !l.active);
    state.wormholes.forEach(w => w.active = !w.active);
    if (state.warp) state.warp.active = Math.random() < 0.5;
    if (state.round > state.course.maxRounds) {
      showFeedback("warning", "The factory clock ran out", "This attempt is over. The course will restart with a new opening hand.");
      await wait(1600);
      loadScenario(state.scenarioId, state.variantId);
      return;
    } else {
      dealHand();
      const goalRuleMessage = state.mode === "hard"
        ? "You need to finish on the goal."
        : "You need only land on the goal at any point.";
      showFeedback("warning", "Build your next algorithm", `You have 8 new program cards, build your next algorithm. ${goalRuleMessage}`, 3000);
      addTrace("Round complete. Lasers and wormholes switched state; Warp availability was randomized.");
    }
  }
  state.running = false; state.activeRegister = -1;
  render();
}

async function executeCard(card) {
  if (card.kind === "turn") {
    state.robot.dir = DIRS[(DIRS.indexOf(state.robot.dir) + card.amount + 4) % 4];
    renderBoard(); await wait(330); return;
  }
  const direction = card.kind === "back" ? DIRS[(DIRS.indexOf(state.robot.dir)+2)%4] : state.robot.dir;
  for (let step = 0; step < card.amount; step++) {
    if (wouldExitBoard(direction)) {
      state.perimeterHit = true;
      addTrace("Movement struck the energized course perimeter.");
      bumpRobot();
      break;
    }
    if (!moveOne(direction)) {
      addTrace(deadSquareAhead(direction) ? "Movement stopped by a dead square." : "Movement stopped by a wall.");
      bumpRobot();
      break;
    }
    renderBoard(); await wait(300);
    if (laserHitsRobot()) {
      state.laserHit = true;
      addTrace("Movement crossed an active laser.");
      break;
    }
    if (isPit() || (state.mode === "easy" && atGoal())) break;
    if (isBoardElement()) {
      addTrace("Instruction paused on a board element.");
      break;
    }
  }
}

async function activateBoard() {
  const s = state.course;
  const effects = [];
  const startingKey = `${state.robot.r},${state.robot.c}`;
  let belt = s.belts.find(x => x[0] === state.robot.r && x[1] === state.robot.c);
  if (belt && state.activatedElementKey !== startingKey) {
    const visited = new Set();
    let beltSteps = 0;
    let beltTurns = 0;
    let beltBlocked = false;

    while (belt) {
      const key = `${state.robot.r},${state.robot.c}`;
      if (visited.has(key)) break;
      visited.add(key);

      if (state.robot.dir !== belt[2]) beltTurns++;
      state.robot.dir = belt[2];
      renderBoard();
      await wait(220);

      const [dr, dc] = VECTORS[belt[2]];
      const nextBelt = s.belts.find(x =>
        x[0] === state.robot.r + dr && x[1] === state.robot.c + dc
      );
      if (!nextBelt) {
        if (wouldExitBoard(belt[2])) {
          state.perimeterHit = true;
          effects.push("belt struck the energized perimeter");
        } else if (!moveOne(belt[2])) {
          beltBlocked = true;
        } else {
          beltSteps++;
          renderBoard();
          await wait(260);
          if (laserHitsRobot()) {
            state.laserHit = true;
            effects.push("laser hit");
          }
        }
        break;
      }
      if (wouldExitBoard(belt[2])) {
        state.perimeterHit = true;
        effects.push("belt struck the energized perimeter");
        break;
      }
      if (!moveOne(belt[2])) {
        beltBlocked = true;
        break;
      }

      beltSteps++;
      belt = nextBelt;
      renderBoard();
      await wait(260);
      if (laserHitsRobot()) {
        state.laserHit = true;
        effects.push("laser hit");
        break;
      }
    }

    if (beltBlocked) effects.push("belt stopped at a wall");
    else effects.push(`belt carried ${beltSteps} tile${beltSteps === 1 ? "" : "s"}${beltTurns ? ` and turned ${beltTurns} time${beltTurns === 1 ? "" : "s"}` : ""}`);
  }
  const gear = !state.laserHit && !state.perimeterHit
    ? s.gears.find(x => x[0] === state.robot.r && x[1] === state.robot.c)
    : null;
  const gearKey = `${state.robot.r},${state.robot.c}`;
  if (gear && state.activatedElementKey !== gearKey) {
    state.robot.dir = DIRS[(DIRS.indexOf(state.robot.dir)+gear[2]+4)%4];
    effects.push(`gear turned ${gear[2] > 0 ? "right" : "left"}`);
    renderBoard(); await wait(300);
  }
  const wormhole = wormholeAt(state.robot.r,state.robot.c);
  if (!state.laserHit && !state.perimeterHit && wormhole?.active) {
    const warpDestination = state.warp?.active ? [state.warp.r, state.warp.c] : null;
    const destination = warpDestination || randomEmptyCell();
    if (destination) {
      [state.robot.r, state.robot.c] = destination;
      effects.push(warpDestination
        ? `wormhole transported the robot to the Warp at row ${destination[0] + 1}, column ${destination[1] + 1}`
        : `wormhole transported the robot to row ${destination[0] + 1}, column ${destination[1] + 1}`);
      renderBoard();
      await wait(380);
    } else {
      effects.push("wormhole could not find an empty destination");
    }
  }
  const restingOnElement =
    s.belts.some(x => x[0] === state.robot.r && x[1] === state.robot.c) ||
    s.gears.some(x => x[0] === state.robot.r && x[1] === state.robot.c) ||
    Boolean(wormholeAt(state.robot.r,state.robot.c)?.active);
  state.activatedElementKey = restingOnElement ? `${state.robot.r},${state.robot.c}` : null;
  if (!state.laserHit && laserHitsRobot()) { state.laserHit = true; effects.push("laser hit"); }
  return effects.join("; ");
}

function wouldExitBoard(dir) {
  const [dr, dc] = VECTORS[dir];
  const nr = state.robot.r + dr;
  const nc = state.robot.c + dc;
  return nr < 0 || nr >= state.course.rows || nc < 0 || nc >= state.course.columns;
}

function moveOne(dir) {
  const [dr,dc] = VECTORS[dir];
  const nr = state.robot.r+dr, nc = state.robot.c+dc;
  if (nr < 0 || nr >= state.course.rows || nc < 0 || nc >= state.course.columns ||
      blocked(state.robot.r,state.robot.c,dir) ||
      state.course.deadSquares.some(x => x[0] === nr && x[1] === nc)) return false;
  const previousKey = `${state.robot.r},${state.robot.c}`;
  state.robot.r = nr;
  state.robot.c = nc;
  if (state.activatedElementKey === previousKey) state.activatedElementKey = null;
  return true;
}
function deadSquareAhead(dir) {
  const [dr,dc] = VECTORS[dir];
  const nr = state.robot.r + dr;
  const nc = state.robot.c + dc;
  return state.course.deadSquares.some(x => x[0] === nr && x[1] === nc);
}
function blocked(r,c,dir) {
  const s = state.course;
  const opposite = {north:"s",east:"w",south:"n",west:"e"};
  const short = dir[0];
  const [dr,dc] = VECTORS[dir];
  return s.walls.includes(`${r},${c},${short}`) || s.walls.includes(`${r+dr},${c+dc},${opposite[dir]}`);
}
function laserAt(r,c) {
  return state.lasers.find(l => l.r === r && l.c === c);
}
function wormholeAt(r,c) {
  return state.wormholes.find(w => w.r === r && w.c === c);
}
function randomEmptyCell() {
  const s = state.course;
  const occupied = new Set([
    `${s.start[0]},${s.start[1]}`,
    `${s.goal[0]},${s.goal[1]}`,
    ...s.pits.map(x => `${x[0]},${x[1]}`),
    ...s.deadSquares.map(x => `${x[0]},${x[1]}`),
    ...s.belts.map(x => `${x[0]},${x[1]}`),
    ...s.gears.map(x => `${x[0]},${x[1]}`),
    ...state.wormholes.map(x => `${x.r},${x.c}`),
    ...(state.warp ? [`${state.warp.r},${state.warp.c}`] : []),
    ...state.lasers.map(x => `${x.r},${x.c}`),
    ...s.walls.map(x => x.split(",").slice(0, 2).join(","))
  ]);
  const candidates = [];
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.columns; c++) {
      if (!occupied.has(`${r},${c}`)) candidates.push([r, c]);
    }
  }
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}
function laserHitsRobot() {
  return state.lasers.some(l => l.active && l.r === state.robot.r && l.c === state.robot.c);
}
function isPit() { return state.course.pits.some(x => x[0] === state.robot.r && x[1] === state.robot.c); }
function isBoardElement() {
  const s = state.course;
  return s.belts.some(x => x[0] === state.robot.r && x[1] === state.robot.c) ||
    s.gears.some(x => x[0] === state.robot.r && x[1] === state.robot.c) ||
    Boolean(wormholeAt(state.robot.r,state.robot.c)?.active);
}
function atGoal() { const g = state.course.goal; return state.robot.r === g[0] && state.robot.c === g[1]; }
function dirArrow(d) { return ({north:"↑",east:"→",south:"↓",west:"←"})[d]; }

async function checkHazard(when) {
  if (isPit()) {
    await rebootFromHazard(
      `Crash: fell into a pit ${when}. Returning to start.`,
      "The robot fell into a pit",
      "The robot returned to the starting square, but the round did not advance. Use the new cards to try again.",
      false
    );
    return true;
  }
  if (state.laserHit) {
    await rebootFromHazard(
      `Laser strike ${when}. Returning to start.`,
      "The laser triggered a reboot",
      "The robot returned to the starting square and the round is over. A new round begins with new cards.",
      true
    );
    return true;
  }
  if (state.perimeterHit) {
    await rebootFromHazard(
      `Perimeter strike ${when}. Returning to start.`,
      "The energized perimeter triggered a reboot",
      "The robot returned to the starting square and the round is over. A new round begins with new cards.",
      true
    );
    return true;
  }
  return false;
}

async function rebootFromHazard(trace, title, message, endsRound) {
  state.reboots++;
  state.rebooted = true;
  state.rebootEndsRound = endsRound;
  state.laserHit = false;
  state.perimeterHit = false;
  addTrace(trace);
  showFeedback("warning", title, message, 3000);
  await wait(450);
  resetRobot();
  dealHand();
  addTrace(`State: start square, facing ${state.robot.dir}.`);
}

function resetRobot() {
  const start = state.course.start;
  state.robot = {r:start[0],c:start[1],dir:start[2]};
  state.activatedElementKey = null;
}
function win() {
  state.won = true;
  const key = `roboRacerBest-${state.scenarioId}-${state.mode}`;
  const best = Number(safeStorageGet(key)) || Infinity;
  if (state.round < best) safeStorageSet(key, String(state.round));
  recordCourseCompletion();
  els.newGameBtn.disabled = false;
  addTrace("Goal reached. Program complete!");
  const result = state.mode === "hard" ? "You finished all five instructions on the beacon." : "You reached the beacon.";
  showFeedback("success", "Algorithm successful!", `${result} Completed in round ${state.round}.`);
  els.announcer.textContent = "Success! The robot reached the goal.";
}
function bumpRobot() {
  const robot = els.board.querySelector(".robot");
  if (robot) { robot.classList.add("bump"); setTimeout(() => robot.classList.remove("bump"), 300); }
}
function setTrace(items) { els.traceList.innerHTML = ""; items.forEach(addTrace); els.traceStatus.textContent = items.length ? "Waiting for a program" : "Executing"; }
function addTrace(text, current = false) {
  els.traceList.querySelectorAll(".current").forEach(x => x.classList.remove("current"));
  const li = document.createElement("li"); li.textContent = text; if (current) li.className = "current";
  els.traceList.append(li); li.scrollIntoView({block:"nearest"});
  els.traceStatus.textContent = text;
}
function showFeedback(kind,title,text,duration = 0) {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }
  els.feedback.className = `feedback board-feedback ${kind}`; els.feedback.hidden = false;
  els.feedback.innerHTML = `<h2>${title}</h2><p>${text}</p>`;
  if (duration > 0) {
    feedbackTimer = setTimeout(() => {
      els.feedback.hidden = true;
      feedbackTimer = null;
    }, duration);
  }
}
function safeStorageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeStorageSet(key,value) { try { localStorage.setItem(key,value); } catch {} }
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    showFeedback("warning","Full screen was blocked","The embedding page may need to allow fullscreen for this widget.");
  }
}
function teacherSubmit(event) {
  event.preventDefault();
  if (els.teacherCode.value === "3141") {
    els.teacherGate.hidden = true;
    els.teacherResources.hidden = false;
  }
  else els.teacherError.textContent = "That number did not match. Try again.";
}
