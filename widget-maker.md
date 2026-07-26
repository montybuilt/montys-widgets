# Monty's Educational Widget Guide

## Purpose

Monty's widgets are small, playful, rigorous learning activities for computational thinking. They are designed for students to learn by doing: observe a system, form a hypothesis or plan, test it, receive useful feedback, and improve.

The widgets are published as static directories on GitHub Pages and embedded in Canvas LMS or other web applications with an iframe. They should remain useful when opened directly in a browser, embedded in a constrained page, or expanded into fullscreen mode.

Three reference implementations define the current approach:

- `patterns/` contains **Monty's Pattern Factory**, a pattern-recognition activity.
- `decomposition/` contains **Divide & Deliver**, a task-decomposition and parallel-work activity.
- `robo-racer/` contains **Monty's Robo-Racer**, an algorithm construction and debugging activity.

These widgets have different metaphors and mechanics, but share the same technical and instructional philosophy.

## Core learning philosophy

### Make the important idea visible

The interface should demonstrate the concept rather than merely explain it.

Pattern Factory makes evidence accumulation visible: students reveal examples, inspect individual features, decide when they have enough evidence, predict, and verify.

Divide & Deliver makes decomposition visible: students first see a large sequential task, split it into smaller independent tasks, distribute those tasks across solvers, and compare elapsed completion times.

Every major control should support the learning cycle. Avoid adding mechanics that are entertaining but shift the activity into an unrelated skill.

### Let students act before giving formal language

Students should discover or experience the idea before receiving the complete explanation.

- Do not reveal pattern rules in challenge titles or multiple-choice answers before a prediction.
- Do not reveal optimal solver assignments before students attempt a scenario.
- After an attempt, explain why the result occurred.
- Use feedback to introduce precise language for something the student has already observed.

### Preserve rigor without making the activity feel punitive

Students should need evidence and reasoning, not lucky guesses. At the same time, an incorrect attempt should be recoverable.

Good feedback distinguishes among:

- a correct solution;
- a plausible idea supported by too little evidence;
- a rule or plan that explains only part of the system;
- a solution that works but is not yet efficient;
- an optimal or fully supported solution.

Incorrect work should produce a useful next observation rather than a generic failure message.

### Keep the central mechanic simple

Do not turn a decomposition activity into a dependency-scheduling simulator unless dependencies are the actual lesson. Do not turn pattern recognition into a memory test or a disguised arithmetic worksheet.

A tree, animation, timer, score, or badge is valuable only when it clarifies the concept.

## Technical architecture

Widgets should normally use plain HTML, CSS, and JavaScript:

- no framework;
- no build process;
- no server-side application;
- no account system;
- no external database;
- no API key;
- no required package installation.

All files should use relative links so the directory works under a GitHub Pages subpath.

A small widget may keep CSS and JavaScript inline in `index.html`. A larger widget should separate concerns:

- `index.html` for semantic page structure;
- `styles.css` for responsive presentation and motion;
- `app.js` for scenarios, state, rendering, scoring, persistence, and interaction;
- local image or audio assets when they materially support the metaphor;
- `solutions.html` for teacher answers and instructional notes.

Current layouts:

- `decomposition/index.html` is intentionally self-contained.
- `decomposition/solutions.html` is the teacher answer key.
- `patterns/index.html`, `patterns/styles.css`, and `patterns/app.js` separate the larger Pattern Factory implementation.
- `patterns/factoryb.png` is a purposeful full-page background.
- `patterns/solutions.html` is the Pattern Factory teacher key.
- `robo-racer/index.html`, `robo-racer/styles.css`, and `robo-racer/app.js` contain the published game.
- `robo-racer/data/boards.json` is the single published course library.
- `robo-racer/board-editor.html` and its local editor service are repository-authoring tools, not production persistence.

## Reference widget: Divide & Deliver

### Project summary

Divide & Deliver is an embeddable activity for practicing decomposition. Students break a large problem into smaller tasks, assign runnable tasks to general-purpose solvers with different efficiencies, and run a simulated completion timer.

The central lesson is:

**one large sequential task -> decomposition into independent tasks -> parallel work -> balanced allocation -> shorter elapsed time**

Decomposition does not magically reduce total effort. Its value is that independent subtasks can run at the same time. Solver assignment adds a second optimization layer: the faster solver can accept more raw work while maintaining a similar elapsed workload.

### Student workspace

The desktop layout uses three aligned vertical panels:

1. **Task shelf** - reusable task templates such as Research, Design, Build, Test, and Document.
2. **Decomposition board** - draggable, editable, nested task cards.
3. **General-purpose solvers** - Nova, Atlas, and Bolt, followed by a compact simulator.

The panels should have matched heights on desktop and stack cleanly on smaller screens. The activity itself should dominate the first viewport; avoid generic dashboard navigation.

Summary cards report:

- task-card count;
- runnable leaf count;
- total effort;
- current estimated finish;
- last completed time;
- best completed time since the board was cleared.

### Task model

A task is represented as an object with values such as:

- `id`;
- `name`;
- `effort`;
- `solver`;
- `custom`;
- `children`;
- `progress`.

A task without children is a runnable **leaf task**.

A task with children becomes a **parent container** and is no longer run directly. Its displayed effort is the sum of all runnable descendant effort. Its progress bar is the effort-weighted combined progress of its runnable descendants.

This distinction is important:

- Moving a leaf among parent groups normally changes organization, not execution time.
- Decomposing a leaf changes the runnable work because the original card becomes a parent and its children become independently assignable.
- Parent cards summarize work; they do not receive solver assignments.

Custom leaf tasks begin at 6 effort units but expose an editable whole-number effort field. Shelf tasks use fixed instructional effort values.

### Dragging and equivalent controls

Students can:

- drag a shelf card onto the board to create a top-level task;
- drag a shelf card onto another card to create a subtask;
- drag an existing card to reorganize or reparent it;
- drag a solver onto a leaf task;
- assign a solver through the leaf card's native select menu;
- add and rename custom tasks;
- delete tasks.

Drag-and-drop must not be the only workflow. Solver menus, buttons, editable fields, and clear focus states provide keyboard-accessible alternatives.

Prevent invalid nesting, including placing a task inside itself or one of its descendants.

### Solver and timing model

The current general-purpose solvers are:

- **Nova** - 1.5x efficiency;
- **Atlas** - 1.0x efficiency;
- **Bolt** - 0.75x efficiency.

For each leaf:

`task duration = effort / solver efficiency`

Each solver processes its own assigned queue sequentially. Different solvers work in parallel.

The project finish time is the maximum of the three solver workloads:

`project duration = max(Nova workload, Atlas workload, Bolt workload)`

The simulation snapshot records each leaf's start and end time within its solver queue. Animation updates leaf progress, parent aggregate progress, the global timer, overall progress, and completion status.

Students should understand that the goal is not simply to give everything to Nova. The goal is to balance elapsed workloads so solvers finish at similar times.

### Guided lesson

The first browser visit automatically launches a six-step product-tour-style lesson. A `localStorage` flag prevents automatic replay on later visits, while the **Guided lesson** button remains available.

The lesson:

1. creates **Build a boat** as one 20-unit task;
2. requires assigning the whole task to Atlas;
3. requires running the 20-second sequential baseline;
4. preserves that result;
5. decomposes the same 20 units into 9u, 6u, and 5u subtasks;
6. requires assigning the subtasks to Nova, Atlas, and Bolt and running them in parallel.

The final comparison reveals approximately:

`20.0s -> 6.7s`

The tour uses:

- a fixed instruction card;
- step indicators;
- highlighted target controls;
- an Exit button;
- a Next button that remains disabled until the required action is complete;
- live announcements;
- a preserved before-and-after result.

Guided lessons should demonstrate the complete conceptual loop, not merely identify interface controls.

### Practice scenarios

The **Choose scenario...** menu contains three unassigned challenges:

- Launch a class website - Starter;
- Host a science fair - Intermediate;
- Prepare a Mars rover - Challenge.

Each scenario loads a realistic nested tree with fixed task efforts. All leaves begin unassigned so students must construct the allocation themselves.

Verified optimal times are stored internally:

- website: 13.3 seconds;
- science fair: 14.7 seconds;
- Mars rover: 17.0 seconds.

Do not display these targets in advance. When a completed run reaches the verified optimum:

- show an **Optimal solution!** banner;
- reveal the optimal time;
- turn the estimate, last-time, best-time, and simulator panels green;
- preserve the student's recorded best.

Changing an assignment removes the current celebration state. Changing the scenario's structure or effort invalidates its built-in optimal target.

When adding a future scenario:

1. Create its nested task tree in the scenario loader.
2. Begin every leaf unassigned.
3. Use concrete, student-friendly names.
4. Verify the true optimum programmatically by enumerating possible solver assignments.
5. Store the verified target in the internal target map.
6. Add one optimal allocation and its calculations to `solutions.html`.
7. Test initialization, incomplete assignments, repeated runs, success detection, and structural invalidation.

### Run history

The activity remembers:

- the last completed simulation;
- the best completed simulation since Clear board;
- the number of runs in the current session state.

Reassigning, moving, or decomposing tasks preserves run history so students can compare plans. **Clear board** resets the tasks and run history.

### Important controls

- **Guided lesson** - starts or replays onboarding.
- **Full screen** - enters or exits the Fullscreen API.
- **Choose scenario...** - loads a built-in challenge.
- **Clear board** - resets the current work and run history.
- **+ Custom task** - creates an editable task.
- **Run plan** - runs, pauses, resumes, or replays the simulation.
- **Reset simulation** - clears current animation progress without clearing the plan.
- Small diamond teacher icon - opens the teacher-number dialog.

## Reference widget: Monty's Pattern Factory

Pattern Factory is the pattern-recognition reference. Students reveal one clue at a time on an animated conveyor, decide when they have enough evidence, predict the next visual or numerical item, or repair a defective item.

Its core cycle is:

**observe evidence -> separate features -> identify repetition or change -> decide when evidence is sufficient -> predict -> verify -> describe**

Reusable ideas include:

- challenges begin without exposed answers;
- students control evidence gathering;
- scanners isolate color, shape, direction, or amount;
- inspection history preserves revealed evidence without exposing future items;
- visual jobs use a Prototype Bay;
- number jobs use a numerical entry interface and optional calculator;
- quality-control jobs ask students to locate and repair a defect;
- feedback explains the rule only after an attempt;
- scenarios have individual evidence thresholds because complexity differs;
- badges reward successful work across distinct challenges rather than tour completion.

Pattern Factory is a useful model when a future widget needs many data-defined scenarios, long-term progress, badges, multiple activity modes, or a strong thematic presentation.

## Reference widget: Monty's Robo-Racer

### Project summary

`robo-racer/` is the algorithmic-thinking reference. It adapts the planning loop of RoboRally into a student-friendly programming activity. Students receive eight movement cards, drag five into ordered program registers, run the complete program, observe the robot and factory response, and revise their next algorithm.

Its core cycle is:

**inspect state -> predict relative movement -> build an ordered algorithm -> execute -> trace state changes -> debug and continue**

The activity deliberately separates planning from execution. Students commit to all five instructions before the robot moves. They must account for orientation, position, forced board effects, hazards, randomness, and the fact that the board state may change between rounds.

### Instruction cards and program construction

The hand contains eight dealt cards. The program has five fixed registers.

Current instruction types include:

- Forward 1, Forward 2, and Forward 3;
- Turn left;
- Turn right;
- U-turn when included in a course deck;
- Back 1 when included in a course deck.

The deal should always contain enough basic ingredients to support meaningful planning. Robo-Racer guarantees at least one left turn, one right turn, and four forward cards when those types exist in the course deck, then fills and shuffles the remaining hand.

Program construction uses drag-and-drop. Important interaction rules:

- Hand cards remain in fixed positions after the deal. Selecting one must not cause the remaining cards to rearrange under the pointer.
- A used hand card should be removed visually or clearly disabled in place.
- Program registers remain fixed. Removing a programmed card clears only that register and does not shift the other instructions.
- The five register positions communicate order directly.
- Dragging should be implemented carefully for both mouse and touch/pointer input.
- A **Clear** button clears the five selected program cards, not the course state or current hand.

Do not add a freely available course-restart button when it undermines the lesson. In Robo-Racer, an unrestricted restart allowed students to repeatedly redeal the first hand until they received ideal cards. Removing that escape encourages resourcefulness, recovery from bad luck, and longer-term planning. A **New Game** action becomes available only after a course has already been completed. Running out of rounds automatically starts a fresh attempt.

### Deterministic execution order

Board-resolution order is part of the algorithm and must be treated as rigorously as instruction order.

For each program register:

1. Execute the next unplayed instruction card.
2. Stop the remaining movement on that card as soon as the robot enters a board element that takes control.
3. Resolve the complete board effect.
4. If that effect places the robot on another board element, resolve the new element immediately.
5. Only after the board reaches a stable state should the next unplayed instruction card begin.

Examples:

- A conveyor carries the robot through its full connected path before another card executes.
- Conveyor turns rotate the robot so it always faces the belt's direction of travel.
- If a conveyor exits onto a gear, the gear rotates the robot immediately.
- The next instruction then uses the robot's new position and orientation.
- A gear must never consume, skip, reorder, or repeat a program card.
- Robot orientation must always end as an exact cardinal direction: north, east, south, or west.

Maintain a clear separation between:

- the program register index;
- the robot's current state;
- the board-effect resolution loop;
- the next instruction to execute.

Do not implement board effects by mutating the card loop index. Resolve effects inside the current register, then return control to the unchanged program loop.

Execution traces should expose enough intermediate state to diagnose apparent ordering errors. When a movement card enters a conveyor, a useful trace identifies the entry square before summarizing the conveyor and its exit effects. Trace coordinates shown to students are one-based even though stored board coordinates are zero-based.

### Board elements and hazard protocol

Robo-Racer currently supports:

- **Start** - initial position and cardinal orientation.
- **Goal** - completion destination.
- **Walls** - stop movement without rebooting.
- **Dead squares** - nearly black impassable cells; the robot and conveyors stop before entering.
- **Pits** - reboot the robot to Start but do not advance the round.
- **Lasers** - single-cell hazards that can be horizontal or vertical and start active or inactive. Touching or passing through an active laser reboots the robot and ends the round.
- **Energized perimeter** - attempting to leave the board behaves like hitting an active laser: reboot and end the round. The perimeter is rendered red to communicate the hazard.
- **Conveyors** - dark-green cells with thick neon-green arrows. Entering a belt ends the current card, carries the robot through the connected belt, and turns it with every change of direction.
- **Gears** - rotate the robot clockwise or counterclockwise before the next card.
- **Wormholes** - when active, trigger immediately upon entry. Without an available Warp, they transport the robot to a random empty square that contains no existing board element.
- **Warp** - a red-and-white target. When available, every active wormhole transports to it instead of choosing a random destination. Warp availability is randomized each round; its course setting controls only its opening availability.

Lasers and wormholes alternate active/inactive state after a completed round. Warp availability is rolled independently. The current state of every alternating element must remain visually identifiable even when inactive; do not replace an inactive laser with an unrelated arrow or ambiguous mark.

### Goal rules and completion

Robo-Racer has two goal modes:

- **Easy: Touch goal** - reaching the goal at any point during a program completes the course.
- **Hard: End on goal** - the robot must occupy the goal after all five program registers have resolved.

Use abbreviated status labels in the compact course bar. The interface already explains the modes in the selector and help content; do not repeat full sentences in permanent status boxes.

Successful completion persists locally:

- Easy completion earns a yellow course badge.
- Hard completion earns a green course badge and supersedes the Easy badge color.
- Uncompleted badges remain muted gray.
- Best round count is stored per course and mode.
- Badge lists should scroll when there are more courses than fit vertically.

Completion feedback appears centered over the board. Temporary messages between rounds or after hazards should disappear after approximately three seconds so they do not obscure the course.

### Course and difficulty design

Courses use a 9-row by 15-column board. A wide board takes advantage of the horizontal room available in laptop and desktop embeds while keeping the activity short enough for a constrained usable viewport.

Courses are organized into route families and difficulty tiers. In Robo-Racer, Core, Crossflow, and Switchback routes preserve distinct planning ideas across Training, Legion, Ranger, and Elite tiers.

Good progression means:

- preserve the recognizable route idea;
- add a small number of meaningful complications at each tier;
- require students to transfer a learned strategy rather than solve a rotated duplicate;
- combine previously introduced elements at higher tiers;
- tighten round limits in proportion to the route while leaving success realistically possible;
- make advanced courses demand several attempts without depending on a single lucky deal.

Difficulty should come from interacting systems, not visual clutter. Examples include:

- choosing between upper and lower conveyor routes with different exit orientations;
- crossing a laser lane on the correct round;
- deciding whether a currently available Warp helps or harms the plan;
- recovering after a random wormhole relocation;
- planning around impassable regions;
- anticipating a gear at a conveyor exit.

Every board should be validated programmatically for:

- required 9 by 15 dimensions;
- in-bounds coordinates;
- valid wall sides;
- valid conveyor directions;
- conveyor exits that remain inside the board;
- no Start or Goal on a dead square;
- at least one route from Start to Goal that avoids walls, pits, and dead squares.

Structural route validation is a minimum check, not proof of instructional quality. Play-test the actual card system, forced board effects, Easy and Hard goal rules, alternating hazards, random destinations, and round limit.

### Board data and local editor

The only published source of courses is:

`robo-racer/data/boards.json`

Do not ask the author to choose, open, import, or name a board file. The editor always loads and saves this one repository file.

The Board Editor supports:

- creating a blank board;
- duplicating an existing board;
- loading a board from the library dropdown;
- editing and orienting elements;
- changing active state and laser color;
- deleting a board;
- moving a board up or down in library order;
- testing the current board in the game;
- saving the complete ordered library to `data/boards.json`.

The JSON array order determines the game selector and badge order. Reordering should be done through visible **Move up** and **Move down** controls, followed by **Save board**.

GitHub Pages is static and cannot write to the repository. Therefore:

- the published game can read `data/boards.json`;
- the production site cannot save editor changes;
- the editor is an authoring tool used locally;
- `start-editor.cmd` launches the local save-capable service;
- the editor service exposes the fixed board file through a local API;
- after editing, the author commits and pushes the changed JSON with Git;
- production users should not be offered a save workflow that implies GitHub Pages can modify repository files.

Opening `index.html` directly may display the game, but `fetch()` behavior and editor saving require local HTTP. Use the provided local launcher for authoring and reliable testing.

When testing from the editor, provide an obvious route back to the board editor. Test mode may use temporary browser storage for the unsaved board, but published courses still come only from `boards.json`.

### Robo-Racer layout and visual language

The title is **Computational Thinking Lab** with the subtitle **Build algorithms to get your robot to the goal**.

Desktop composition is intentionally wide and vertically compact:

- a short title container aligned to the width of the course/status bar;
- a narrow course/status navigation bar above the activity;
- a left-aligned 15 by 9 playing grid;
- the item key connected directly below the grid at equal width;
- eight vertically arranged instruction cards beside five vertically arranged program registers;
- Clear, Run Program, and Trace Steps grouped below the program registers;
- a narrow, vertically scrollable course-badge column to the right.

The execution trace is hidden by default in a dialog opened by **Trace Steps**. Detailed diagnostics should be available without permanently consuming the main viewport.

The local wallpaper is a compressed WebP asset. Major structural containers may be transparent so the wallpaper shows through, while interactive cards remain dark with approximately 80% opacity and light text/icons. Use local, optimized assets because GitHub Pages repository size and load speed matter.

The board should be visually dominant, but do not assume it must be square. The 15 by 9 format was chosen after testing the real usable viewport on a 1920 by 1080 laptop at 125% scaling.

Screen resolution is not the same as usable CSS viewport. Browser chrome, operating-system scaling, zoom, bookmarks bars, and embedding containers reduce available space. For layout testing:

1. Measure the actual browser viewport with `window.innerWidth` and `window.innerHeight`.
2. Test that exact CSS viewport in responsive tools.
3. Also test the final iframe at the width and height used by the host page.
4. Do not infer fit from physical panel resolution alone.

The item key uses hover and keyboard-focus tooltips with brief descriptions of what each element does. Keep these explanations short and ensure edge tooltips do not render off-screen.

The admin/teacher diamond is intentionally small, discreet, and positioned in the lower-right corner. Authoring and teacher utilities should remain available without competing with the student task.

### Robo-Racer persistence keys

Robo-Racer uses consistent, widget-specific local storage:

- `roboRacerProgress:v1` - per-course completion, completed modes, timestamps, and best round progress used by badges;
- `roboRacerMode` - most recently selected Easy or Hard goal rule;
- `roboRacerBest-<course-id>-<mode>` - best round for a specific course and goal mode;
- `roboRacerLessonSeen` - whether first-visit help has already opened;
- `roboRacerTestBoard` - temporary local board used when testing from the editor.

Keep identifiers stable after publication. Changing a course ID disconnects it from previously stored completion and best-round data.

## Shared scenario design

Prefer data-defined scenarios rather than large blocks of scenario-specific event code.

A good scenario definition includes:

- a neutral title that does not disclose the answer;
- a short contextual brief;
- the data needed to render the challenge;
- the correct result or verified optimum;
- post-attempt explanation;
- difficulty-specific thresholds;
- any display-density or mode flags.

Verify answers with code when possible. For optimization problems, enumerate the finite assignment space. For sequences, confirm the intended rule produces every displayed term and the required prediction.

Keep teacher solutions synchronized whenever scenarios change.

## Accessibility requirements

Accessibility is part of the implementation, not a final polish pass.

Every widget should include:

- semantic headings and regions;
- actual buttons for actions;
- labels for inputs and selects;
- descriptive iframe and page titles;
- visible `:focus-visible` styles;
- keyboard-operable alternatives to dragging;
- appropriately sized touch targets;
- status and error messages that do not depend on color alone;
- `aria-live` announcements for important changes;
- accessible modal or native dialog behavior;
- sufficient color contrast;
- responsive text and controls;
- reduced-motion behavior through `prefers-reduced-motion`;
- no essential information conveyed only through animation.

After any dynamic render, restore logical focus when the student's workflow requires it.

For fullscreen mode, catch permission failures and explain that the embedding page may need to allow fullscreen.

## Responsive layout and visual style

Shared visual preferences:

- strong first viewport centered on the activity;
- warm, inviting palette rather than corporate dashboard styling;
- rounded panels and cards;
- restrained shadows;
- clear borders;
- compact controls;
- matched panel heights in multi-column layouts;
- generous but efficient spacing;
- strong hierarchy with minimal ornament;
- purposeful motion;
- clean stacking on tablets and phones.

Divide & Deliver uses warm off-white, cream panels, dark green, orange, blue, and purple. Pattern Factory uses a richer themed background with translucent panels. Future widgets may have their own metaphor, but should maintain the same clarity and restraint.

Prefer CSS, typography, and simple geometric forms when imagery is unnecessary. Use a local image only when it materially improves the learning metaphor.

Avoid oversized timer boxes, empty chrome, and panels whose heights appear accidentally mismatched.

## Persistence

Use `localStorage` only for device-local educational state:

- guided-lesson seen flags;
- attempts and accuracy;
- badges and ranks;
- best results;
- distinct completed scenarios.

Document every key and what it stores.

Browser storage is specific to the browser, profile, origin, and often the embed context. It does not synchronize across devices and may be unavailable in restricted iframes or private browsing.

Current examples:

- Pattern Factory career data: `patternFactoryCareer`.
- Pattern Factory tour flag: `patternFactoryLessonSeen`.
- Divide & Deliver tour flag: `divide-deliver-guided-seen-v1`.

Current-board state does not necessarily need durable persistence. Do not store more than the learning experience requires.

## Teacher resources

Each substantial widget should include a separate `solutions.html` page with:

- answers;
- reasoning or calculations;
- common incorrect interpretations;
- teacher discussion prompts;
- notes about equally valid alternative solutions.

Add:

```html
<meta name="robots" content="noindex,nofollow">
```

Use a discreet teacher-resource icon that opens a number-entry dialog. The existing teacher number is 3141. Divide & Deliver stores its SHA-256 hash and includes an arithmetic fallback. This is a convenience gate, not security: static client-side files are inspectable.

The teacher page should use the widget's design language and provide a clear link back to the activity.

## Fullscreen and embedding

Use the Fullscreen API from a visible **Full screen** button. Update its label while fullscreen is active and handle rejected requests.

The host iframe should include both modern and compatibility forms:

```html
<iframe
  src="https://montybuilt.github.io/montys-widgets/WIDGET-DIRECTORY/index.html"
  title="Descriptive activity title"
  width="100%"
  height="900"
  style="border: 0; border-radius: 12px;"
  loading="lazy"
  allow="fullscreen"
  allowfullscreen>
</iframe>
```

Canvas LMS may sanitize some attributes. Test the saved Canvas page, not only the HTML editor preview.

## GitHub Pages deployment

Each widget is a normal static directory inside the `montys-widgets` repository. The deployed URL follows the repository path:

`https://montybuilt.github.io/montys-widgets/<directory>/index.html`

Before publishing:

1. Confirm all paths are relative.
2. Confirm filenames match case exactly.
3. Validate JavaScript syntax.
4. Serve the directory locally over HTTP.
5. Test the main workflow and every scenario.
6. Test the first-visit tour and manual replay.
7. Test Clear board and history-reset behavior.
8. Test keyboard access and focus.
9. Test reduced motion.
10. Test desktop, tablet, phone, iframe, and fullscreen layouts.
11. Test the teacher gate and `solutions.html`.
12. Confirm no answer is exposed prematurely.

## General implementation method

1. Define the single learning concept and observable student cycle.
2. Choose a metaphor only if it clarifies that cycle.
3. Build the smallest functional scenario first.
4. Separate current activity state from persistent career state.
5. Keep rendering derived from state rather than manually patching many unrelated DOM elements.
6. Add a guided lesson that demonstrates the concept.
7. Add three meaningfully different practice levels.
8. Add feedback and verified success conditions.
9. Add run history or progress only when it helps comparison and reflection.
10. Add teacher resources.
11. Add responsive, keyboard, reduced-motion, iframe, and fullscreen support.
12. Validate all scenario answers programmatically where possible.

The recurring design standard is:

**make the concept visible, let the student act, preserve evidence, explain the result, and invite another attempt.**
