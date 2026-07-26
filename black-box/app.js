const missions = [
  {
    id: "catapult",
    title: "Monty's Breakfast Catapult",
    brief: "Design a panel that lets a cafeteria operator launch toast safely to Table 7.",
    user: "cafeteria operator",
    goal: "Deliver toast safely to Table 7",
    command: "Launch Breakfast",
    groups: ["Targeting", "Breakfast", "Safety"],
    details: [
      ["Table 7 Coordinates", "Position assigned to Table 7", true, "Targeting"],
      ["Launch Angle", "Launcher elevation measured in degrees", true, "Targeting"],
      ["Bread Type", "Selected bread variety", true, "Breakfast"],
      ["Toast Weight", "Measured mass of the loaded toast", true, "Targeting"],
      ["Landing Zone Clear", "Current Table 7 occupancy-sensor reading", true, "Safety"],
      ["Launcher Brand", "Manufacturer name printed on the launcher", false, ""],
      ["Time of Day", "Current cafeteria clock reading", false, ""],
      ["Launcher Color", "Exterior finish of the launcher", false, ""],
      ["Server Shoe Size", "Shoe size recorded for the server", false, ""]
    ],
    steps: ["Check landing zone", "Load toast", "Set launch angle", "Charge spring", "Release toast"],
    hint: "Ask whether the operator needs this detail to choose, act, or stay safe."
  },
  {
    id: "website",
    title: "Build a School Website",
    brief: "Build a website that helps new students find important information and learn about their school.",
    user: "school web team",
    goal: "Create a useful website for new students",
    command: "Build School Website",
    groups: ["School Information", "People", "Student Life", "User Needs"],
    details: [
      ["School Address", "Official street address for the school", true, "School Information"],
      ["School Day Schedule", "Times when the school day begins and ends", true, "School Information"],
      ["Faculty Directory", "Names and roles of teachers and staff", true, "People"],
      ["Counselor Contacts", "Names and contact information for school counselors", true, "People"],
      ["Clubs and Activities", "List of activities students can join", true, "Student Life"],
      ["Cafeteria Menu", "Meals available to students", true, "Student Life"],
      ["Student Survey Results", "Student responses about what the website should provide", true, "User Needs"],
      ["Most-Requested Information", "Topics students most often want to find", true, "User Needs"],
      ["Principal's Favorite Movie", "Movie selected as the principal's personal favorite", false, ""],
      ["Refrigerator Serial Number", "Serial number printed on the cafeteria refrigerator", false, ""],
      ["Number of School Bricks", "Estimated number of bricks in the school building", false, ""],
      ["Developer Shoe Size", "Shoe size recorded for the website developer", false, ""]
    ],
    steps: ["Review the student survey", "Select the most-needed information", "Organize information into sections", "Create the website pages", "Add navigation between pages", "Test the website with students", "Publish the website"],
    hint: "Ask what each item tells a new student: school facts, people to contact, student experiences, or what users need."
  },
  {
    id: "moon",
    title: "Emergency Moon Base",
    brief: "Organize the information needed to evacuate and seal a leaking room on a moon base.",
    user: "moon base safety officer",
    goal: "Evacuate and seal the leaking room",
    command: "Seal Lab Module",
    groups: ["Leak Information", "Crew Safety", "Hatch Status"],
    details: [
      ["Leaking Room", "Name of the room where air is escaping", true, "Leak Information"],
      ["Room Air Pressure", "Current air-pressure reading in the leaking room", true, "Leak Information"],
      ["People Still Inside", "Number of people remaining in the leaking room", true, "Crew Safety"],
      ["Escape Route Clear", "Whether the route out of the room is safe to use", true, "Crew Safety"],
      ["Hatch Open or Closed", "Current position of the room's safety hatch", true, "Hatch Status"],
      ["Hatch Locked or Unlocked", "Current state of the hatch lock", true, "Hatch Status"],
      ["Control Panel Color", "Color painted on the safety control panel", false, ""],
      ["Cafeteria Menu", "Meals being served at the moon base today", false, ""],
      ["Commander Shoe Size", "Shoe size recorded for the base commander", false, ""]
    ],
    steps: ["Find the leaking room", "Sound the evacuation alarm", "Confirm everyone has left", "Close the safety hatch", "Lock the safety hatch", "Confirm the room is sealed"],
    hint: "Group information by what it tells you: where the leak is, whether people are safe, or whether the hatch is secured."
  }
];

const state = { missionIndex: 0, phase: 1, view: "operator", selected: new Set(), assignments: {}, sequence: [], detailOrder: [], commandName: "", passed: {}, executing: false };
const $ = (id) => document.getElementById(id);
const mission = () => missions[state.missionIndex];

function initialize() {
  missions.forEach((item, index) => $("missionSelect").add(new Option(item.title, index)));
  $("missionSelect").addEventListener("change", (event) => loadMission(Number(event.target.value)));
  $("checkBtn").addEventListener("click", checkPhase);
  $("backBtn").addEventListener("click", showOperatorView);
  $("hintBtn").addEventListener("click", () => setFeedback(mission().hint, "try"));
  $("helpBtn").addEventListener("click", () => $("helpDialog").showModal());
  $("fullscreenBtn").addEventListener("click", toggleFullscreen);
  $("nextMissionBtn").addEventListener("click", nextMission);
  $("teacherBtn").addEventListener("click", () => $("teacherDialog").showModal());
  $("teacherSubmit").addEventListener("click", openTeacherResources);
  $("stepSuccessNext").addEventListener("click", closeStepSuccess);
  document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
  document.addEventListener("fullscreenchange", () => $("fullscreenBtn").textContent = document.fullscreenElement ? "Exit full screen" : "Full screen");
  loadMission(0);
  if (!localStorage.getItem("blackBoxLabIntroSeen")) {
    $("helpDialog").showModal();
    localStorage.setItem("blackBoxLabIntroSeen", "true");
  }
}

function loadMission(index) {
  state.missionIndex = index;
  state.phase = 1;
  state.view = "operator";
  state.selected = new Set();
  state.assignments = {};
  state.sequence = [];
  state.detailOrder = shuffledIndices(mission().details.length);
  state.commandName = "";
  state.passed = {};
  state.executing = false;
  $("missionSelect").value = String(index);
  $("missionTitle").textContent = mission().title;
  $("missionBrief").textContent = mission().brief;
  $("panelStatus").textContent = "Draft";
  $("panelStatus").style.background = "";
  renderBadges();
  render();
}

function render() {
  renderProgress();
  $("setupPanel").hidden = state.view !== "setup";
  $("operatorPanel").hidden = state.view !== "operator";
  if (state.view === "setup") renderWorkArea();
  renderPreview();
  $("backBtn").hidden = state.view !== "setup";
}

function renderProgress() {
  document.querySelectorAll(".progress-step").forEach(step => {
    const number = Number(step.dataset.step);
    step.classList.toggle("active", number === state.phase);
    step.classList.toggle("done", Boolean(state.passed[number]));
  });
}

function renderWorkArea() {
  $("setupPanel").classList.toggle("group-phase", state.phase === 2);
  $("setupPanel").classList.toggle("sequence-phase", state.phase === 3);
  const headings = {
    1: ["Step 1 · Signal or noise?", "What does the operator need?", `Select only the details a ${mission().user} needs to ${mission().goal.toLowerCase()}.`],
    2: ["Step 2 · Name that data", "Give each detail a useful home", "Group the details you kept. Good names let someone understand a collection without inspecting every value."],
    3: ["Step 3 · Build a function", "Create a named algorithm", "Put the hidden steps in a safe order, then give the complete algorithm one meaningful function name."],
    4: ["Step 4 · Operator test", "Will your interface work?", `Review the panel as if you were the ${mission().user}. Then run the test.`]
  };
  [$("phaseKicker").textContent, $("workHeading").textContent, $("instruction").textContent] = headings[state.phase];
  $("feedback").className = "feedback";
  $("feedback").textContent = "";
  $("checkBtn").hidden = false;
  if (state.phase === 1) renderFocus();
  if (state.phase === 2) renderGroups();
  if (state.phase === 3) renderSequence();
  if (state.phase === 4) renderTest();
}

function renderFocus() {
  $("workArea").innerHTML = `<div class="choice-grid">${state.detailOrder.map(index => {
    const detail = mission().details[index];
    return `
    <label class="choice-card">
      <input type="checkbox" value="${index}" ${state.selected.has(index) ? "checked" : ""}>
      <b>${detail[0]}</b><small>${detail[1]}</small>
    </label>`;
  }).join("")}</div>`;
  $("workArea").querySelectorAll("input").forEach(input => input.addEventListener("change", event => {
    const index = Number(event.target.value);
    event.target.checked ? state.selected.add(index) : state.selected.delete(index);
    renderMachineDetails();
    renderPreview();
  }));
  $("checkBtn").textContent = "Check my choices";
}

function shuffledIndices(length) {
  const indices = Array.from({length}, (_, index) => index);
  for (let index = indices.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }
  return indices;
}

function renderGroups() {
  const selectedDetails = [...state.selected];
  $("workArea").innerHTML = `<div class="group-list">${selectedDetails.map(index => {
    const detail = mission().details[index];
    return `<div class="group-row"><label for="group-${index}">${detail[0]}</label>
      <select id="group-${index}" data-index="${index}" aria-label="Group for ${detail[0]}">
        <option value="">Choose a group…</option>
        ${mission().groups.map(group => `<option ${state.assignments[index] === group ? "selected" : ""}>${group}</option>`).join("")}
      </select></div>`;
  }).join("")}</div>`;
  $("workArea").querySelectorAll("select").forEach(select => select.addEventListener("change", event => {
    state.assignments[event.target.dataset.index] = event.target.value;
    renderPreview();
  }));
  $("checkBtn").textContent = "Check my groups";
}

function renderSequence() {
  if (!state.sequence.length) state.sequence = mission().steps.map((_, index) => index).sort(() => Math.random() - .5);
  $("workArea").innerHTML = `<div class="sequence-list">${state.sequence.map((stepIndex, position) => `
    <div class="sequence-item">
      <span class="sequence-number">${position + 1}</span>
      <span>${mission().steps[stepIndex]}</span>
      <span>
        <button class="move-button" data-move="-1" data-position="${position}" aria-label="Move ${mission().steps[stepIndex]} up" ${position === 0 ? "disabled" : ""}>↑</button>
        <button class="move-button" data-move="1" data-position="${position}" aria-label="Move ${mission().steps[stepIndex]} down" ${position === state.sequence.length - 1 ? "disabled" : ""}>↓</button>
      </span>
    </div>`).join("")}</div>
    <div class="name-control"><label for="commandName">Name the button
      <input id="commandName" value="${escapeHtml(state.commandName)}" maxlength="32">
    </label></div>`;
  $("workArea").querySelectorAll("[data-move]").forEach(button => button.addEventListener("click", () => {
    const from = Number(button.dataset.position);
    const to = from + Number(button.dataset.move);
    [state.sequence[from], state.sequence[to]] = [state.sequence[to], state.sequence[from]];
    renderSequence();
  }));
  $("commandName").addEventListener("input", event => { state.commandName = event.target.value; renderPreview(); });
  $("checkBtn").textContent = "Check procedure";
}

function renderTest() {
  const kept = [...state.selected].map(index => mission().details[index][0]);
  if (state.passed[4]) {
    $("workArea").innerHTML = `<div class="test-card test-result">
      <p class="test-success"><b>Command completed successfully.</b></p>
      <p>The operator pressed <b>${escapeHtml(state.commandName)}</b>. The system used ${kept.length} essential details and carried out the hidden procedure:</p>
      <ol class="execution-summary">${mission().steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      <p>The operator received the result without having to control each internal step.</p>
    </div>`;
    return;
  }
  $("workArea").innerHTML = `<div class="test-card">
    <p><b>Operator:</b> “I need to <em>${mission().goal.toLowerCase()}</em>.”</p>
    <p>Your panel shows <b>${kept.length} essential details</b> in <b>${mission().groups.length} named groups</b> and replaces <b>${mission().steps.length} internal steps</b> with one command.</p>
    <p>Test your work by pressing <b>${escapeHtml(state.commandName)}</b> on the Operator panel.</p>
  </div>`;
}

function renderPreview() {
  const chosen = state.detailOrder.filter(index => state.selected.has(index));
  const grouped = {};
  chosen.forEach(index => {
    const group = state.assignments[index] || "Unsorted";
    (grouped[group] ||= []).push(mission().details[index][0]);
  });
  const content = chosen.length
    ? Object.entries(grouped).map(([name, items]) => `<section class="preview-group"><h3>${escapeHtml(name)}</h3>${items.map(item => `<p>${item}</p>`).join("")}</section>`).join("")
    : `<div class="empty-panel">Build a focused operator panel by completing the setup steps.</div>`;
  const labels = {
    1: "Step 1 - Select Task Details",
    2: "Step 2 - Categorize Tasks",
    3: "Step 3 - Create and Name the Sequence"
  };
  const buttonLabel = state.passed[4] ? "Open the black box" : state.phase === 4 ? state.commandName : labels[state.phase];
  const buttonDisabled = state.executing;
  const resultSummary = state.passed[4] ? `
    <section class="operator-result" aria-label="Procedure result">
      <b>Procedure completed successfully</b>
      <p>${escapeHtml(state.commandName)} ran ${mission().steps.length} hidden steps and completed the operator's goal.</p>
      <ol>${mission().steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    </section>` : "";
  $("operatorPreview").innerHTML = `
    <div class="preview-screen"><b>${mission().goal}</b><small>Operator view</small></div>
    <div class="operator-content">${content}</div>
    ${resultSummary}
    <button class="launch-control" type="button" ${buttonDisabled ? "disabled" : ""}>${escapeHtml(state.executing ? "Running…" : buttonLabel)}</button>`;
  $("operatorPreview").querySelector(".launch-control")?.addEventListener("click", () => {
    if (state.passed[4]) showReveal();
    else if (state.phase === 4) runOperatorTest();
    else showSetupView();
  });
  const completedSteps = [1, 2, 3, 4].filter(step => state.passed[step]).length;
  const progress = completedSteps * 25;
  const progressNotes = {
    0: "Step 1: focus on the details the operator needs.",
    25: "Focus complete. Next, group related data.",
    50: "Data abstraction complete. Next, build a named function.",
    75: "Procedural abstraction complete. Test the function.",
    100: "All four abstraction stages are complete."
  };
  updateMeter(progress, progressNotes[progress]);
}

function updateMeter(value, note) {
  $("clarityValue").textContent = `${value}%`;
  $("clarityBar").style.width = `${value}%`;
  $("meterNote").textContent = note;
}

function checkPhase() {
  if (state.phase === 1) {
    const expected = mission().details.map((detail, index) => detail[2] ? index : -1).filter(index => index >= 0);
    const missing = expected.filter(index => !state.selected.has(index));
    const noise = [...state.selected].filter(index => !mission().details[index][2]);
    if (missing.length || noise.length) {
      const parts = [];
      if (missing.length) parts.push(`You may have hidden ${missing.length} detail${missing.length > 1 ? "s" : ""} the operator still needs.`);
      if (noise.length) parts.push(`${noise.length} selected detail${noise.length > 1 ? "s are" : " is"} useful to someone else—or no one at all.`);
      setFeedback(`${parts.join(" ")} Reconsider the user's goal, then try again.`, "try");
      return;
    }
  }
  if (state.phase === 2) {
    const wrong = [...state.selected].filter(index => state.assignments[index] !== mission().details[index][3]);
    if (wrong.length) {
      setFeedback(`${wrong.length} detail${wrong.length > 1 ? "s do" : " does"} not yet match the most useful group. Group by meaning and responsibility—not just by what sounds similar.`, "try");
      return;
    }
  }
  if (state.phase === 3) {
    const ordered = state.sequence.every((value, index) => value === index);
    if (!ordered || state.commandName.trim().length < 4) {
      setFeedback(!ordered ? "The procedure could cause a problem in that order. Think: observe, prepare, configure, act." : "Give the bundled procedure a clear action name.", "try");
      return;
    }
  }
  if (state.phase === 4) { runOperatorTest(); return; }
  const completedPhase = state.phase;
  state.passed[completedPhase] = true;
  state.phase = completedPhase + 1;
  state.view = "operator";
  render();
  showStepSuccess(completedPhase);
}

function showSetupView() {
  if (state.phase > 3) return;
  state.view = "setup";
  render();
  $("workHeading").focus?.();
}

function showOperatorView() {
  state.view = "operator";
  render();
  $("operatorHeading").focus?.();
}

function showStepSuccess(phase) {
  const messages = {
    1: ["Setup correct", "You abstracted the essence of the task by identifying the details needed and removing information that does not serve the goal."],
    2: ["Data abstraction", "You grouped specific details into meaningful categories."],
    3: ["This is Procedural Abstraction", "You organized instructions into a named algorithm. You wrote a function!"]
  };
  const [heading, message] = messages[phase];
  $("stepSuccessHeading").textContent = heading;
  $("stepSuccessMessage").textContent = message;
  const dialog = $("stepSuccessDialog");
  dialog.showModal();
  $("stepSuccessNext").focus();
}

function closeStepSuccess() {
  const dialog = $("stepSuccessDialog");
  if (dialog.open) dialog.close();
  $("operatorPreview").querySelector(".launch-control")?.focus();
}

async function runOperatorTest() {
  if (state.phase !== 4 || state.passed[4] || state.executing) return;
  state.executing = true;
  $("panelStatus").textContent = "Running";
  $("liveRegion").textContent = `${state.commandName} is running.`;
  renderPreview();
  await new Promise(resolve => setTimeout(resolve, 650));

  state.executing = false;
  state.passed[4] = true;
  $("panelStatus").textContent = "Tested";
  $("panelStatus").style.background = "#17624b";
  $("liveRegion").textContent = "Command completed successfully. The procedure summary is now visible.";
  saveCompletion();
  renderProgress();
  renderPreview();
}

function phaseSuccessMessage(phase) {
  return {
    1: "Focused! You preserved every essential signal and removed the noise.",
    2: "Clear! Each detail now has a meaningful home.",
    3: "Bundled! One useful command now stands for a safe internal procedure."
  }[phase];
}

function goBack() {
  if (state.phase <= 1) return;
  state.phase -= 1;
  Object.keys(state.passed).forEach(key => { if (Number(key) >= state.phase) delete state.passed[key]; });
  $("checkBtn").disabled = false;
  render();
}

function setFeedback(message, type) {
  $("feedback").textContent = message;
  $("feedback").className = `feedback ${type}`;
}

function showReveal() {
  $("revealSummary").textContent = "Select each + to move from the simple function name into the grouped data and hidden procedure beneath it.";

  const dataGroups = mission().groups.map((group, groupIndex) => {
    const details = state.detailOrder
      .filter(index => state.selected.has(index) && state.assignments[index] === group)
      .map(index => mission().details[index][0]);
    return abstractionGroupMarkup(`data-group-${groupIndex}`, "Data grouping", group, details);
  }).join("");
  const procedureSteps = state.sequence.map(index => mission().steps[index]);
  const procedureGroup = abstractionGroupMarkup("procedure-group", "Named algorithm", "Procedure", procedureSteps);

  $("revealFlow").innerHTML = `
    <section class="layer-node function-layer">
      <button class="layer-toggle" type="button" aria-expanded="false" aria-controls="function-layers" data-layer-target="function-layers">
        <span class="layer-symbol" aria-hidden="true">+</span>
        <span class="layer-copy"><small>Function</small><strong>${escapeHtml(state.commandName)}</strong></span>
      </button>
      <div id="function-layers" class="layer-children" hidden>
        ${dataGroups}
        ${procedureGroup}
      </div>
    </section>`;

  const flow = $("revealFlow");
  flow.querySelectorAll(".layer-toggle").forEach(button => button.addEventListener("click", () => {
    const children = document.getElementById(button.dataset.layerTarget);
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.querySelector(".layer-symbol").textContent = expanded ? "+" : "−";
    children.hidden = expanded;
  }));
  $("revealDialog").showModal();
  flow.querySelector(".layer-toggle")?.focus();
}

function abstractionGroupMarkup(id, type, name, items) {
  return `<section class="layer-node group-layer">
    <button class="layer-toggle" type="button" aria-expanded="false" aria-controls="${id}" data-layer-target="${id}">
      <span class="layer-symbol" aria-hidden="true">+</span>
      <span class="layer-copy"><small>${escapeHtml(type)}</small><strong>${escapeHtml(name)}</strong><em>${items.length} ${items.length === 1 ? "item" : "items"}</em></span>
    </button>
    <div id="${id}" class="layer-children leaf-children" hidden>
      ${items.map(item => `<div class="leaf-layer"><span aria-hidden="true">•</span><b>${escapeHtml(item)}</b></div>`).join("")}
    </div>
  </section>`;
}

function nextMission() {
  $("revealDialog").close();
  loadMission((state.missionIndex + 1) % missions.length);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    $("liveRegion").textContent = "Full screen is unavailable. The page embedding this activity may need to allow fullscreen.";
  }
}

function openTeacherResources() {
  if ($("teacherCode").value === "3141") window.location.href = "solutions.html";
  else {
    $("teacherFeedback").textContent = "That number did not match.";
    $("teacherFeedback").className = "feedback try";
  }
}

function saveCompletion() {
  try {
    const saved = JSON.parse(localStorage.getItem("blackBoxLabProgress") || "{}");
    saved[mission().id] = { completed: true, completedAt: new Date().toISOString() };
    localStorage.setItem("blackBoxLabProgress", JSON.stringify(saved));
    renderBadges();
  } catch { /* The activity still works when storage is restricted. */ }
}

function renderBadges() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("blackBoxLabProgress") || "{}");
  } catch { /* Locked badges remain visible when storage is unavailable. */ }
  const shortNames = {
    catapult: "Catapult",
    website: "Website",
    moon: "Moon Base"
  };
  $("missionBadges").innerHTML = missions.map(item => {
    const earned = Boolean(saved[item.id]?.completed);
    const status = earned ? "completed" : "not completed";
    return `<div class="mission-badge ${earned ? "earned" : ""}" title="${escapeHtml(item.title)}: ${status}" aria-label="${escapeHtml(item.title)}, ${status}">
      <strong>${escapeHtml(shortNames[item.id] || item.title)}</strong>
    </div>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

initialize();
