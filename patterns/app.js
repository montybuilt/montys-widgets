(() => {
  "use strict";

  const COLORS = {
    orange: "#e97838",
    blue: "#4384c6",
    green: "#48a27a",
    purple: "#815fb4",
    yellow: "#e0b33f"
  };
  const ROTATIONS = { up: -90, right: 0, down: 90, left: 180 };
  const TRIANGLE_ROTATIONS = { up: 0, right: 90, down: 180, left: 270 };
  const ARROWS = { up: "↑", right: "→", down: "↓", left: "←" };

  const item = (shape, color, direction = "right", count = 1, size = "large") =>
    ({ shape, color, direction, count, size });
  const num = number => ({ number });

  const scenarios = {
    guided: {
      title: "Training Line",
      brief: "Learn how to inspect, call, and verify a production rule.",
      mode: "call",
      features: ["shape", "color", "direction", "count"],
      minSupport: 4,
      initialReveal: 2,
      sequence: [
        item("circle", "orange", "up"), item("square", "blue", "right"),
        item("circle", "orange", "down"), item("square", "blue", "left"),
        item("circle", "orange", "up"), item("square", "blue", "right")
      ],
      rule: "alternate-turn",
      rules: [
        ["alternate-turn", "Shape and color alternate while direction turns one quarter-turn each step."],
        ["color-only", "Only the color alternates."],
        ["same", "Every product is identical."],
        ["grow", "The amount increases by one each step."]
      ],
      explanation: "Circle/orange and square/blue alternate, while the direction turns clockwise each time."
    },
    starter: {
      title: "Production Forecast",
      brief: "Produce one clue at a time. Stop the line as soon as you can prove what comes next.",
      mode: "call",
      features: ["shape", "color"],
      minSupport: 4,
      minCallClues: 2,
      initialReveal: 0,
      sequence: [
        item("circle", "orange"), item("square", "blue"),
        item("circle", "orange"), item("square", "blue"),
        item("circle", "orange"), item("square", "blue")
      ],
      rule: "alternate",
      rules: [
        ["alternate", "Orange circles and blue squares alternate."],
        ["color", "The color changes, but the shape stays the same."],
        ["pairs", "Products repeat in matching pairs."],
        ["random", "There is no consistent production rule."]
      ],
      explanation: "Every orange circle is followed by a blue square, so the two products repeat ABAB."
    },
    intermediate: {
      title: "Call the Line",
      brief: "Reveal one clue at a time. Stop the machinery when the evidence supports your rule.",
      mode: "call",
      features: ["shape", "color", "direction"],
      minSupport: 4,
      minCallClues: 2,
      initialReveal: 0,
      sequence: [
        item("triangle", "purple", "up"), item("triangle", "green", "right"),
        item("triangle", "purple", "down"), item("triangle", "green", "left"),
        item("triangle", "purple", "up"), item("triangle", "green", "right"),
        item("triangle", "purple", "down")
      ],
      rule: "color-rotate",
      rules: [
        ["color-rotate", "Color alternates while direction turns one quarter-turn clockwise."],
        ["color-only", "Only purple and green alternate."],
        ["reverse", "Direction switches back and forth between up and down."],
        ["shape-cycle", "The shape changes in a three-product cycle."]
      ],
      explanation: "The color alternates purple/green and the triangle turns clockwise through four directions."
    },
    challenge: {
      title: "Quality Control",
      brief: "One product is defective. Select it, manufacture its replacement, and identify the rule.",
      mode: "repair",
      features: ["shape", "color", "direction", "count"],
      minSupport: 5,
      initialReveal: 0,
      defectIndex: 4,
      correctSequence: [
        item("diamond", "yellow", "up", 1), item("circle", "blue", "right", 2),
        item("diamond", "yellow", "down", 1), item("circle", "blue", "left", 2),
        item("diamond", "yellow", "up", 1), item("circle", "blue", "right", 2)
      ],
      sequence: [
        item("diamond", "yellow", "up", 1), item("circle", "blue", "right", 2),
        item("diamond", "yellow", "down", 1), item("circle", "blue", "left", 2),
        item("circle", "yellow", "up", 1), item("circle", "blue", "right", 2)
      ],
      rule: "multi-track",
      rules: [
        ["multi-track", "Shape, color, and amount alternate while direction turns clockwise."],
        ["direction-only", "Only the direction changes."],
        ["pairs", "Every two neighboring products should match."],
        ["color-count", "Color and amount alternate, but shape does not matter."]
      ],
      explanation: "Odd positions are one yellow diamond; even positions are two blue circles. Direction turns clockwise every step."
    },
    qualityShape: {
      title: "Misfit Batch",
      brief: "One product does not belong in the repeating production batch. Find and replace it.",
      mode: "repair", density: "compact", features: ["shape", "color"], minSupport: 6, initialReveal: 0, defectIndex: 4,
      correctSequence: [
        item("circle","orange"), item("square","blue"), item("triangle","green"),
        item("circle","orange"), item("square","blue"), item("triangle","green")
      ],
      sequence: [
        item("circle","orange"), item("square","blue"), item("triangle","green"),
        item("circle","orange"), item("diamond","blue"), item("triangle","green")
      ],
      rule: "three-batch",
      rules: [["three-batch","Circle/orange, square/blue, and triangle/green repeat in order."],["shape-only","Only the shapes repeat in groups of three."],["alternate","Two complete products alternate."],["color-cycle","Only the colors follow a repeating rule."]],
      explanation: "The factory repeats a three-product batch. Position 5 should be a blue square, not a blue diamond."
    },
    qualityCount: {
      title: "Packing Audit",
      brief: "One package has the wrong manufactured contents. Identify it and rebuild the batch.",
      mode: "repair", density: "compact", features: ["shape", "color", "count"], minSupport: 6, initialReveal: 0, defectIndex: 3,
      correctSequence: [
        item("triangle","purple","right",1), item("circle","green","right",2),
        item("triangle","purple","right",1), item("circle","green","right",2),
        item("triangle","purple","right",1), item("circle","green","right",2)
      ],
      sequence: [
        item("triangle","purple","right",1), item("circle","green","right",2),
        item("triangle","purple","right",1), item("circle","green","right",1),
        item("triangle","purple","right",1), item("circle","green","right",2)
      ],
      rule: "package-pair",
      rules: [["package-pair","One purple triangle alternates with two green circles."],["shape-only","Triangle and circle alternate; amount does not matter."],["growing","The amount increases every two products."],["color-only","Only purple and green alternate."]],
      explanation: "Each purple triangle is followed by a package of two green circles. Position 4 contains one circle too few."
    },
    qualityNumber: {
      title: "Faulty Stamp",
      brief: "One brass plate was stamped incorrectly. Find it and restore the number rule.",
      mode: "repair", density: "data", features: ["number"], minSupport: 6, initialReveal: 0, defectIndex: 4,
      correctSequence: [4,9,14,19,24,29].map(num),
      sequence: [4,9,14,19,27,29].map(num),
      rule: "add-five",
      rules: [["add-five","Add 5 each time."],["odd","Use consecutive odd numbers."],["times-two","Multiply by 2 each time."],["alternate","Alternate adding 4 and 6."]],
      explanation: "The stamping rule adds 5 each time. Position 5 should be 24, not 27."
    },
    visualGroups: {
      title: "Grouped Goods", brief: "Find the repeating three-product batch.", mode: "call",
      density: "compact", features: ["shape", "color"], minSupport: 3, minCallClues: 3, initialReveal: 0,
      sequence: [
        item("circle","orange"), item("circle","orange"), item("square","blue"),
        item("circle","orange"), item("circle","orange"), item("square","blue"),
        item("circle","orange"), item("circle","orange"), item("square","blue")
      ],
      rule: "aab",
      rules: [["aab","Two orange circles are followed by one blue square."],["alternate","Orange circles and blue squares alternate."],["pairs","Every product occurs in a matching pair."],["random","There is no consistent rule."]],
      explanation: "The batch repeats AAB: orange circle, orange circle, blue square."
    },
    colorTracks: {
      title: "Crossed Wires", brief: "Separate the shape track from the color track.", mode: "call",
      density: "compact", features: ["shape", "color"], minSupport: 6, minCallClues: 3, initialReveal: 0,
      sequence: [
        item("circle","orange"), item("square","blue"), item("triangle","orange"),
        item("circle","blue"), item("square","orange"), item("triangle","blue"),
        item("circle","orange"), item("square","blue"), item("triangle","orange")
      ],
      rule: "two-cycles",
      rules: [["two-cycles","Shape cycles circle, square, triangle while color alternates orange and blue."],["one-cycle","The complete products repeat every three positions."],["shape-only","Only the shape follows a rule."],["random","There is no consistent rule."]],
      explanation: "Shape repeats every three products while color repeats every two, creating a six-product combined cycle."
    },
    growingGroups: {
      title: "Packing Pressure", brief: "Watch how amount changes in alternating batches.", mode: "call",
      density: "compact", features: ["shape", "color", "count"], minSupport: 5, minCallClues: 3, initialReveal: 0,
      sequence: [
        item("circle","orange","right",1), item("square","blue","right",1),
        item("circle","orange","right",2), item("square","blue","right",2),
        item("circle","orange","right",3), item("square","blue","right",3),
        item("circle","orange","right",1)
      ],
      rule: "paired-growth",
      rules: [["paired-growth","Shape and color alternate; amount repeats in pairs and increases."],["simple-growth","The amount increases on every product."],["color-only","Only color alternates."],["groups","Products repeat in identical groups of three."]],
      explanation: "Shape and color alternate while amounts run 1, 1, 2, 2, 3, 3."
    },
    shapeColorCycle: {
      title: "Twin Gears", brief: "Two repeating gears are turning at different rates.", mode: "call",
      density: "compact", features: ["shape", "color"], minSupport: 6, minCallClues: 3, initialReveal: 0,
      sequence: [
        item("circle","orange"), item("square","blue"), item("circle","green"),
        item("square","orange"), item("circle","blue"), item("square","green"),
        item("circle","orange"), item("square","blue")
      ],
      rule: "gear-cycles",
      rules: [["gear-cycles","Shape alternates while color cycles orange, blue, green."],["paired","Each shape always has the same color."],["color-alt","Only two colors alternate."],["random","There is no consistent rule."]],
      explanation: "A two-step shape cycle and three-step color cycle combine into a six-product pattern."
    },
    arithmetic: {
      title: "Stamped Steps", brief: "Inspect the numbers stamped onto each brass plate.", mode: "call",
      density: "data", features: ["number"], minSupport: 4, minCallClues: 3, initialReveal: 0,
      sequence: [3,7,11,15,19,23,27,31].map(num), rule: "add-four",
      rules: [["add-four","Add 4 each time."],["times-two","Multiply by 2 each time."],["odd","List consecutive odd numbers."],["alternate","Alternate adding 3 and 5."]],
      explanation: "Each stamped value is 4 greater than the previous value."
    },
    geometric: {
      title: "Multiplier Mill", brief: "Find how the stamping machine scales each value.", mode: "call",
      density: "data", features: ["number"], minSupport: 4, minCallClues: 3, initialReveal: 0,
      sequence: [2,6,18,54,162,486,1458].map(num), rule: "times-three",
      rules: [["times-three","Multiply by 3 each time."],["add-four","Add 4 each time."],["double-add","Double, then add 2."],["squares","Use consecutive square numbers."]],
      explanation: "Every value is three times the value immediately before it."
    },
    squares: {
      title: "Rivet Run", brief: "Look beyond the changing gaps between values.", mode: "call",
      density: "data", features: ["number"], minSupport: 5, minCallClues: 3, initialReveal: 0,
      sequence: [1,4,9,16,25,36,49,64].map(num), rule: "squares",
      rules: [["squares","Use consecutive square numbers."],["add-odd","Add the same odd number each time."],["times-two","Multiply by 2 each time."],["fibonacci","Add the previous two values."]],
      explanation: "The plates show consecutive square numbers; their differences grow by consecutive odd numbers."
    },
    cubes: {
      title: "Heavy Press", brief: "Look for a relationship between position and stamped value.", mode: "call",
      density: "data", features: ["number"], minSupport: 5, minCallClues: 3, initialReveal: 0,
      sequence: [1,8,27,64,125,216,343].map(num), rule: "cubes",
      rules: [["cubes","Use consecutive cube numbers."],["times-three","Multiply by 3 each time."],["squares","Use consecutive square numbers."],["add-odd","Add consecutive odd numbers."]],
      explanation: "The plates show 1³, 2³, 3³, 4³ and so on."
    },
    fibonacci: {
      title: "Sum Forge", brief: "Each new plate is forged from earlier evidence.", mode: "call",
      density: "data", features: ["number"], minSupport: 5, minCallClues: 3, initialReveal: 0,
      sequence: [1,1,2,3,5,8,13,21,34].map(num), rule: "previous-two",
      rules: [["previous-two","Add the previous two values."],["add-two","Add 2 each time."],["double-minus","Double, then subtract 1."],["pairs","Repeat every value twice."]],
      explanation: "Each value is the sum of the two values immediately before it."
    },
    interleaved: {
      title: "Split Shift", brief: "The line may be running two jobs at once.", mode: "call",
      density: "data", features: ["number"], minSupport: 6, minCallClues: 4, initialReveal: 0,
      sequence: [1,10,2,20,3,30,4,40,5,50].map(num), rule: "interleaved",
      rules: [["interleaved","Odd positions count by 1; even positions count by 10."],["times-ten","Multiply by 10 each time."],["alternate-ops","Alternate adding 9 and subtracting 8."],["pairs","Values occur in related pairs only."]],
      explanation: "Odd-position plates count 1, 2, 3… while even-position plates count 10, 20, 30…"
    },
    signalLoom: {
      title: "Signal Loom", brief: "Two repeating tracks are woven together on the line.", mode: "call",
      density: "compact", features: ["shape", "color"], minSupport: 6, minCallClues: 4, initialReveal: 0,
      sequence: [
        item("circle","orange"), item("square","orange"), item("triangle","blue"),
        item("circle","blue"), item("square","green"), item("triangle","green"),
        item("circle","orange"), item("square","orange")
      ],
      rule: "woven-tracks", rules: [],
      explanation: "Shape cycles circle, square, triangle while each color—orange, blue, then green—lasts for two products."
    },
    batchEcho: {
      title: "Batch Echo", brief: "A four-part production batch repeats with an echo at the end.", mode: "call",
      density: "compact", features: ["shape", "color"], minSupport: 6, minCallClues: 4, initialReveal: 0,
      sequence: [
        item("circle","orange"), item("square","blue"), item("triangle","green"), item("triangle","green"),
        item("circle","orange"), item("square","blue"), item("triangle","green"), item("triangle","green")
      ],
      rule: "abcc", rules: [],
      explanation: "A four-product batch repeats: orange circle, blue square, then two green triangles."
    },
    turningTides: {
      title: "Turning Tides", brief: "Watch direction and color as separate moving systems.", mode: "call",
      density: "compact", features: ["shape", "color", "direction"], minSupport: 6, minCallClues: 4, initialReveal: 0,
      sequence: [
        item("arrow","orange","up"), item("arrow","orange","right"),
        item("arrow","blue","down"), item("arrow","blue","left"),
        item("arrow","green","up"), item("arrow","green","right"),
        item("arrow","orange","down"), item("arrow","orange","left")
      ],
      rule: "turning-pairs", rules: [],
      explanation: "The arrow turns clockwise every step while colors run in pairs: orange, orange, blue, blue, green, green."
    },
    pulseStack: {
      title: "Pulse Stack", brief: "Three production tracks change at different rates.", mode: "call",
      density: "compact", features: ["shape", "color", "count"], minSupport: 6, minCallClues: 4, initialReveal: 0,
      sequence: [
        item("circle","orange","right",1), item("square","blue","right",2),
        item("circle","orange","right",3), item("square","blue","right",1),
        item("circle","orange","right",2), item("square","blue","right",3),
        item("circle","orange","right",1)
      ],
      rule: "stacked-cycles", rules: [],
      explanation: "Shape and color alternate while amount follows its own repeating cycle: 1, 2, 3."
    },
    offsetForge: {
      title: "Offset Forge", brief: "The gaps may reveal how each plate is generated.", mode: "call",
      density: "data", features: ["number"], minSupport: 6, minCallClues: 4, initialReveal: 0,
      sequence: [4,5,7,11,19,35,67].map(num), rule: "power-offset", rules: [],
      explanation: "Starting with n = 0, each value follows 2ⁿ + 3. Equivalently, the gaps double: 1, 2, 4, 8, 16, 32."
    },
    relayGrowth: {
      title: "Relay Growth", brief: "A doubling mechanism is combined with a fixed adjustment.", mode: "call",
      density: "data", features: ["number"], minSupport: 6, minCallClues: 4, initialReveal: 0,
      sequence: [1,4,10,22,46,94,190].map(num), rule: "double-plus-two", rules: [],
      explanation: "Each value is double the previous value plus 2. The same sequence can be written as 3 × 2ⁿ − 2."
    },
    circuitAudit: {
      title: "Circuit Audit", brief: "One product disrupts several synchronized production tracks.", mode: "repair",
      density: "compact", features: ["shape", "color", "direction"], minSupport: 6, initialReveal: 0, defectIndex: 4,
      correctSequence: [
        item("circle","orange","up"), item("square","blue","right"), item("circle","green","down"),
        item("square","orange","left"), item("circle","blue","up"), item("square","green","right")
      ],
      sequence: [
        item("circle","orange","up"), item("square","blue","right"), item("circle","green","down"),
        item("square","orange","left"), item("square","blue","up"), item("square","green","right")
      ],
      rule: "synchronized-tracks", rules: [],
      explanation: "Shape alternates, color cycles orange/blue/green, and direction turns clockwise. Position 5 should be a blue circle pointing up."
    },
    brokenRelay: {
      title: "Broken Relay", brief: "One stamped value breaks a transformed exponential sequence.", mode: "repair",
      density: "data", features: ["number"], minSupport: 6, initialReveal: 0, defectIndex: 4,
      correctSequence: [4,5,7,11,19,35].map(num),
      sequence: [4,5,7,11,20,35].map(num),
      rule: "power-offset", rules: [],
      explanation: "The values follow 2ⁿ + 3, so position 5 should be 19 rather than 20."
    },
    nestedBatch: {
      title: "Deep Batch", brief: "A small product rhythm is nested inside a larger repeating batch.", mode: "call",
      density: "compact", features: ["shape", "color"], minSupport: 8, minCallClues: 6, maxClues: 12, initialReveal: 0,
      sequence: [
        item("circle","orange"), item("circle","orange"), item("square","blue"),
        item("circle","orange"), item("square","blue"), item("square","blue"),
        item("circle","orange"), item("circle","orange"), item("square","blue"),
        item("circle","orange"), item("square","blue"), item("square","blue"),
        item("circle","orange")
      ],
      rule: "nested-six", rules: [],
      explanation: "A six-product batch repeats: AABABB. Inside it, orange circles and blue squares form groups that grow from one to two."
    },
    phaseShift: {
      title: "Phase Works", brief: "Three product features move on cycles of different lengths.", mode: "call",
      density: "compact", features: ["shape", "color", "direction"], minSupport: 9, minCallClues: 7, maxClues: 12, initialReveal: 0,
      sequence: Array.from({length:13}, (_, index) =>
        item(
          index % 2 ? "square" : "circle",
          ["orange","blue","green"][index % 3],
          ["up","right","down","left"][index % 4]
        )
      ),
      rule: "three-phases", rules: [],
      explanation: "Shape alternates every two products, color cycles every three, and direction turns every four. The complete combination resets after twelve products."
    },
    differenceLoom: {
      title: "Gap Workshop", brief: "The pattern is hidden in the changing gaps between stamped values.", mode: "call",
      density: "data", features: ["number"], minSupport: 8, minCallClues: 6, maxClues: 12, initialReveal: 0,
      sequence: [3,4,5,7,8,9,11,12,13,15,16,17,19].map(num),
      rule: "repeating-gaps", rules: [],
      explanation: "The gaps repeat +1, +1, +2. The values form repeating groups of three before jumping to the next group."
    },
    tripleShift: {
      title: "Three Crews", brief: "Three number-making crews take turns placing plates on one conveyor.", mode: "call",
      density: "data", features: ["number"], minSupport: 9, minCallClues: 7, maxClues: 12, initialReveal: 0,
      sequence: [2,10,100,4,20,90,6,30,80,8,40,70,10].map(num),
      rule: "three-interleaved", rules: [],
      explanation: "Every third position belongs to a separate sequence: one counts by 2, one by 10, and one counts backward by 10."
    }
  };

  const badges = {
    first: { name: "First Find", icon: "⚙", description: "Verify patterns in at least 3 different factory jobs." },
    evidence: { name: "Evidence Expert", icon: "⌕", description: "Complete at least 4 different evidence-based jobs." },
    early: { name: "Early Spotter", icon: "⚡", description: "Make an earliest-supported call in at least 3 different jobs." },
    rule: { name: "Rule Keeper", icon: "↻", description: "Solve at least 5 different jobs while maintaining 70% accuracy." },
    repair: { name: "Pattern Repairer", icon: "🔧", description: "Correctly repair defects in at least 3 different Quality Control jobs." },
    transfer: { name: "Transfer Thinker", icon: "⇄", description: "Verify rules across at least 5 different factory jobs." }
  };

  const els = Object.fromEntries([
    "app","scenarioSelect","clearButton","jobsSolvedResult","bestResult","accuracyResult","rankResult","jobTitle","jobBrief",
    "lineStatus","productLine","emptyLine","clueCount","nextButton","callButton","resetRoundButton",
    "consoleMessage","scannerButtons","predictionBay","predictionTitle","predictionPrompt","prototypePreview",
    "shapeChoices","colorChoices","directionChoices","countChoices","numberFieldset","numberGuess","builderHint","submitButton",
    "feedbackPanel","feedbackMark","feedbackTitle","feedbackText","badgeRail","viewBadgesButton","badgeDialog",
    "badgeCabinet","closeBadgesButton","doneBadgesButton","resetBadgesButton","lessonButton","lessonCard",
    "lessonProgress","lessonTitle","lessonText","lessonNextButton","exitLessonButton","fullscreenButton",
    "calculatorButton","calculatorDialog","closeCalculatorButton","calculatorDisplay","calculatorKeys",
    "historyButton","historyDialog","closeHistoryButton","doneHistoryButton","historyLine","historyCount",
    "teacherButton","teacherDialog","teacherForm","teacherNumber","teacherError","liveRegion"
  ].map(id => [id, document.getElementById(id)]));
  els.factoryShell = document.querySelector(".factory-shell");
  els.pressureGauge = document.getElementById("pressureGauge");
  els.beltWindow = document.querySelector(".belt-window");

  const BADGE_RULES_VERSION = 3;
  const defaultCareer = {
    badgeRulesVersion: BADGE_RULES_VERSION,
    badges: {}, correct: 0, attempts: 0, verified: 0, repairs: 0,
    evidenceWins: 0, earlyWins: 0, bestCalls: {}, lastResult: "—",
    solvedJobs: {}, evidenceJobs: {}, earlyJobs: {}, repairJobs: {}
  };
  const state = {
    scenarioKey: "", scenario: null, revealCount: 0, stopped: false, roundDone: false,
    selectedDefect: null, guess: { shape: "", color: "", direction: "", count: "", number: "" },
    activeScan: "", sessionAttempts: 0, sessionCorrect: 0,
    career: loadCareer(), lesson: null
  };

  function loadCareer() {
    try {
      const saved = JSON.parse(localStorage.getItem("patternFactoryCareer") || "{}");
      if (saved.badgeRulesVersion !== BADGE_RULES_VERSION) {
        const fresh = {
          ...defaultCareer, badges: {}, bestCalls: {},
          solvedJobs: {}, evidenceJobs: {}, earlyJobs: {}, repairJobs: {}
        };
        localStorage.setItem("patternFactoryCareer", JSON.stringify(fresh));
        return fresh;
      }
      return { ...defaultCareer, ...saved };
    } catch {
      return {
        ...defaultCareer, badges: {}, bestCalls: {},
        solvedJobs: {}, evidenceJobs: {}, earlyJobs: {}, repairJobs: {}
      };
    }
  }
  function saveCareer() {
    localStorage.setItem("patternFactoryCareer", JSON.stringify(state.career));
  }
  function announce(message) {
    els.liveRegion.textContent = "";
    requestAnimationFrame(() => { els.liveRegion.textContent = message; });
  }
  function escapeText(text) {
    return String(text).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function describeProduct(product, features = ["shape", "color", "direction", "count"]) {
    if (features.includes("number")) return `number ${product.number}`;
    const count = features.includes("count") && product.count > 1 ? `${product.count} ` : "";
    const plural = features.includes("count") && product.count > 1 ? "s" : "";
    const direction = features.includes("direction") ? `, pointing ${product.direction}` : "";
    return `${count}${product.color} ${product.shape}${plural}${direction}`;
  }
  function productMarkup(product, mini = false, showDirection = true) {
    if (Object.prototype.hasOwnProperty.call(product, "number")) {
      return `<div class="product-wrap${mini ? " mini" : ""}" aria-hidden="true"><span class="number-plate">${escapeText(product.number)}</span></div>`;
    }
    const rotation = product.shape === "triangle"
      ? TRIANGLE_ROTATIONS[product.direction]
      : product.shape === "arrow"
        ? ROTATIONS[product.direction]
        : 0;
    const pieces = Array.from({ length: product.count }, () =>
      `<span class="product ${escapeText(product.shape)} ${escapeText(product.size || "large")}" style="--product-color:${COLORS[product.color]};--product-rotation:${rotation}deg"></span>`
    ).join("");
    const direction = mini && showDirection
      ? `<span class="prototype-direction">Direction ${ARROWS[product.direction]}</span>`
      : "";
    return `<div class="product-wrap${mini ? " mini" : ""}" data-count="${product.count}" aria-hidden="true">${direction}${pieces}</div>`;
  }

  function setFactoryState(kind, label) {
    els.factoryShell.classList.remove("running", "stopped");
    if (kind) els.factoryShell.classList.add(kind);
    els.lineStatus.lastElementChild.textContent = label;
  }

  function loadScenario(key, fromLesson = false) {
    const scenario = scenarios[key];
    if (!scenario) return;
    state.scenarioKey = key;
    state.scenario = scenario;
    state.revealCount = scenario.initialReveal;
    state.stopped = scenario.mode === "practice";
    state.roundDone = false;
    state.selectedDefect = null;
    state.activeScan = "";
    state.guess = { shape: "", color: "", direction: "", count: "", number: "" };
    els.numberGuess.value = "";
    els.factoryShell.classList.add("job-active");
    els.factoryShell.classList.remove("solved");
    els.scenarioSelect.value = key === "guided" ? "" : key;
    els.jobTitle.textContent = scenario.title;
    els.jobBrief.textContent = scenario.brief;
    els.predictionBay.hidden = true;
    els.feedbackPanel.hidden = true;
    resetScannerButtons();
    buildChoices();
    configureFeatures();
    renderLine();
    updateControls();
    setFactoryState(state.stopped ? "stopped" : "", state.stopped ? "Ready to predict" : "Line ready");
    els.resetRoundButton.disabled = false;
    if (scenario.mode === "practice") {
      openPredictionBay();
      els.consoleMessage.textContent = "The line has stopped at a missing product. Build what comes next.";
    } else if (scenario.initialReveal === 0) {
      els.consoleMessage.textContent = "The belt is empty. Press Next item to produce your first clue.";
    } else if (scenario.mode === "repair") {
      els.consoleMessage.textContent = "Select the product that breaks the production rule.";
    } else {
      els.consoleMessage.textContent = "Reveal another clue, or stop the line when your rule is supported.";
    }
    if (!fromLesson) announce(`${scenario.title} loaded.`);
  }

  function renderLine(newIndex = -1) {
    if (!state.scenario) {
      els.productLine.innerHTML = "";
      els.emptyLine.hidden = false;
      return;
    }
    els.emptyLine.hidden = true;
    const s = state.scenario;
    const features = s.features;
    const visible = s.sequence.slice(0, state.revealCount);
    els.productLine.innerHTML = visible.map((product, index) => {
      const selectable = s.mode === "repair" && state.revealCount === s.sequence.length && !state.roundDone;
      const selected = state.selectedDefect === index;
      return `<li class="product-slot${index === newIndex ? " new" : ""}${selectable ? " selectable" : ""}${selected ? " selected-defect" : ""}"
        data-index="${index}" ${selectable ? `tabindex="0" role="button" aria-pressed="${selected}"` : ""}
        aria-label="Product ${index + 1}: ${escapeText(describeProduct(product, features))}${selectable ? ". Select as defective." : ""}">
        <span class="slot-number">${String(index + 1).padStart(2,"0")}</span>
        ${features.includes("direction") ? `<span class="direction-mark" aria-hidden="true">${ARROWS[product.direction]}</span>` : ""}
        ${productMarkup(product)}
        <span class="product-name">${features.includes("number") ? "stamped value" : `${escapeText(product.color)} ${escapeText(product.shape)}`}</span>
      </li>`;
    }).join("");
    if ((s.mode === "practice" || state.stopped) && !state.roundDone) {
      els.productLine.insertAdjacentHTML("beforeend",
        `<li class="product-slot" aria-label="Unknown next product"><span class="slot-number">${String(state.revealCount + 1).padStart(2,"0")}</span><div class="product-wrap"><div class="mystery-product">?</div></div><span class="product-name">Your prediction</span></li>`);
    }
    els.productLine.className = `product-line density-${s.density || "standard"}${state.activeScan ? ` scan-${state.activeScan}` : ""}`;
    updateClueGauge(state.revealCount);
    const newest = els.productLine.lastElementChild;
    if (newest) newest.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", inline: "start", block: "nearest" });
  }

  function renderHistory() {
    if (!state.scenario || state.revealCount === 0) {
      els.historyLine.innerHTML = "";
      els.historyCount.textContent = "No clues recorded";
      return;
    }
    const features = state.scenario.features;
    const revealed = state.scenario.sequence.slice(0, state.revealCount);
    els.historyLine.innerHTML = revealed.map((product, index) => `
      <li class="product-slot" aria-label="Clue ${index + 1}: ${escapeText(describeProduct(product, features))}">
        <span class="slot-number">${String(index + 1).padStart(2,"0")}</span>
        ${features.includes("direction") ? `<span class="direction-mark" aria-hidden="true">${ARROWS[product.direction]}</span>` : ""}
        ${productMarkup(product)}
        <span class="product-name">${features.includes("number") ? "stamped value" : `${escapeText(product.color)} ${escapeText(product.shape)}`}</span>
      </li>
    `).join("");
    els.historyCount.textContent = `${revealed.length} ${revealed.length === 1 ? "clue" : "clues"} recorded`;
  }

  function updateClueGauge(count) {
    const total = Math.max(0, count);
    const dialPosition = total % 6;
    const angle = -90 + dialPosition * 60;
    els.clueCount.textContent = total;
    els.pressureGauge.style.setProperty("--gauge-angle", `${angle}deg`);
    els.pressureGauge.setAttribute("aria-label", `${total} ${total === 1 ? "clue" : "clues"} observed`);
  }

  function maxRevealFor(scenario) {
    if (scenario.mode === "repair") return scenario.sequence.length;
    return Math.min(scenario.maxClues ?? 6, scenario.sequence.length - 1);
  }

  function updateControls() {
    const s = state.scenario;
    if (!s) {
      els.nextButton.disabled = true;
      els.callButton.disabled = true;
      els.historyButton.disabled = true;
      return;
    }
    const maxReveal = maxRevealFor(s);
    const minCallClues = s.maxClues > 6 ? 3 : 2;
    els.nextButton.disabled = state.stopped || state.roundDone || !["call", "repair"].includes(s.mode) || state.revealCount >= maxReveal;
    els.callButton.disabled = state.stopped || state.roundDone || s.mode !== "call" || state.revealCount < minCallClues;
    els.callButton.textContent = state.revealCount >= maxReveal ? "Make your prediction" : "Stop! I know it";
    els.historyButton.disabled = state.revealCount === 0;
  }

  function revealNext() {
    if (!state.scenario || els.nextButton.disabled) return;
    const maxReveal = maxRevealFor(state.scenario);
    if (state.revealCount < maxReveal) {
      state.revealCount += 1;
      setFactoryState("running", "Producing");
      renderLine(state.revealCount - 1);
      updateControls();
      setTimeout(() => setFactoryState("", "Line ready"), 500);
      announce(`Clue ${state.revealCount} produced.`);
      els.consoleMessage.textContent =
        state.revealCount < maxReveal
          ? `${state.revealCount} ${state.revealCount === 1 ? "clue" : "clues"} on the belt. Produce another or call the pattern when ready.`
          : state.scenario.mode === "repair"
            ? "All products are on the belt. Select the one that breaks the pattern."
            : "This is the final clue. Make your prediction.";
      lessonAction("next");
    }
  }

  function stopLine() {
    if (!state.scenario || els.callButton.disabled) return;
    state.stopped = true;
    setFactoryState("stopped", "Line stopped");
    renderLine();
    els.consoleMessage.textContent = `Line stopped after ${state.revealCount} clues. Build your prediction.`;
    openPredictionBay();
    updateControls();
    announce(`Line stopped after ${state.revealCount} clues. Build your prediction.`);
    lessonAction("call");
  }

  function selectDefect(index) {
    if (!state.scenario || state.scenario.mode !== "repair" || state.roundDone ||
        state.revealCount < state.scenario.sequence.length) return;
    state.selectedDefect = index;
    state.stopped = true;
    renderLine();
    openPredictionBay();
    setFactoryState("stopped", "Inspection hold");
    els.consoleMessage.textContent = `Product ${index + 1} selected for inspection. Build its replacement.`;
    announce(`Product ${index + 1} selected as the possible defect.`);
  }

  function openPredictionBay() {
    const repair = state.scenario.mode === "repair";
    const numeric = state.scenario.features.includes("number");
    els.predictionTitle.textContent = repair ? "Manufacture the replacement"
      : numeric ? "Stamp your prediction" : "Manufacture your prediction";
    els.predictionPrompt.textContent = repair
      ? "Build the product that belongs in the selected conveyor slot."
      : numeric ? "Enter the value you expect the line to stamp next."
        : "Build the product you expect the line to make next.";
    els.submitButton.textContent = numeric ? "Send number to line" : "Send prototype to line";
    els.predictionBay.hidden = false;
    renderPrototype();
    validateBuilder();
  }

  function configureFeatures() {
    const activeFeatures = state.scenario.features;
    ["shape", "color", "direction", "count"].forEach(feature => {
      const choiceGroup = els[`${feature}Choices`];
      const fieldset = choiceGroup?.closest("fieldset");
      if (fieldset) fieldset.hidden = !activeFeatures.includes(feature);
      const scanner = els.scannerButtons.querySelector(`[data-scan="${feature}"]`);
      if (scanner) scanner.hidden = !activeFeatures.includes(feature);
    });
    els.numberFieldset.hidden = !activeFeatures.includes("number");
    els.scannerButtons.closest(".scanner-panel").hidden =
      activeFeatures.length === 1 && activeFeatures[0] === "number";
  }

  function buildChoices() {
    const groups = [
      ["shapeChoices", "shape", ["circle","square","triangle","diamond","arrow"]],
      ["colorChoices", "color", ["orange","blue","green","purple","yellow"]],
      ["directionChoices", "direction", ["up","right","down","left"]],
      ["countChoices", "count", [1,2,3]]
    ];
    groups.forEach(([elementKey, type, values]) => {
      els[elementKey].innerHTML = values.map(value => {
        const label = type === "direction" ? `${ARROWS[value]} ${value}` : type === "count" ? String(value) : value;
        const extra = type === "color" ? ` color-choice" style="--swatch:${COLORS[value]}` : "";
        return `<button type="button" class="choice-button${extra}" data-choice="${type}" data-value="${value}" aria-pressed="false" aria-label="${type}: ${value}">${type === "color" ? "" : escapeText(label)}</button>`;
      }).join("");
    });
  }

  function chooseFeature(button) {
    const type = button.dataset.choice;
    let value = button.dataset.value;
    if (type === "count") value = Number(value);
    state.guess[type] = value;
    document.querySelectorAll(`[data-choice="${type}"]`).forEach(btn => btn.setAttribute("aria-pressed", String(btn === button)));
    renderPrototype();
    validateBuilder();
  }

  function renderPrototype() {
    const g = state.guess;
    const features = state.scenario.features;
    if (!features.every(feature => g[feature])) {
      els.prototypePreview.innerHTML = `<span class="mystery-product">?</span>`;
      els.prototypePreview.setAttribute("aria-label", "Prototype incomplete");
      return;
    }
    const product = features.includes("number")
      ? num(Number(g.number))
      : item(g.shape, g.color, g.direction || "right", Number(g.count) || 1);
    els.prototypePreview.innerHTML = productMarkup(product, true, features.includes("direction"));
    els.prototypePreview.setAttribute("aria-label", `Your prototype: ${describeProduct(product, features)}`);
  }

  function validateBuilder() {
    const complete = state.scenario.features.every(feature => state.guess[feature]);
    const defectReady = state.scenario && (state.scenario.mode !== "repair" || state.selectedDefect !== null);
    els.submitButton.disabled = !(complete && defectReady);
    els.builderHint.textContent = !defectReady ? "First select the defective product on the belt."
      : !complete ? state.scenario.features.includes("number")
        ? "Enter the next number."
        : "Choose every product feature."
      : "Prototype ready for inspection.";
  }

  function targetProduct() {
    const s = state.scenario;
    return s.mode === "repair" ? s.correctSequence[s.defectIndex] : s.sequence[state.revealCount];
  }
  function sameProduct(a, b, features) {
    return features.every(key => a[key] === b[key]);
  }
  function submitGuess() {
    if (els.submitButton.disabled || !state.scenario) return;
    const s = state.scenario;
    const countsTowardAchievements = state.scenarioKey !== "guided";
    const guess = s.features.includes("number")
      ? num(Number(state.guess.number))
      : item(state.guess.shape, state.guess.color, state.guess.direction || "right", Number(state.guess.count) || 1);
    const productCorrect = sameProduct(guess, targetProduct(), s.features);
    const defectCorrect = s.mode !== "repair" || state.selectedDefect === s.defectIndex;
    const correct = productCorrect && defectCorrect;
    if (countsTowardAchievements) {
      state.sessionAttempts += 1;
      state.career.attempts += 1;
    }
    if (correct) {
      state.roundDone = true;
      if (countsTowardAchievements) {
        state.sessionCorrect += 1;
        state.career.correct += 1;
        state.career.verified += 1;
        state.career.solvedJobs[state.scenarioKey] = true;
        if (s.mode === "repair") state.career.repairs += 1;
        if (s.mode === "repair") state.career.repairJobs[state.scenarioKey] = true;
        if (s.mode === "call" || s.mode === "repair") {
          state.career.evidenceWins += 1;
          state.career.evidenceJobs[state.scenarioKey] = true;
        }
        if (s.mode === "call" && state.revealCount === s.minSupport) {
          state.career.earlyWins += 1;
          state.career.earlyJobs[state.scenarioKey] = true;
        }
        const clueText = s.mode === "repair" ? "defect repaired" : `${state.revealCount} clues`;
        state.career.lastResult = clueText;
        if (s.mode === "call") {
          const prior = state.career.bestCalls[state.scenarioKey];
          if (!prior || state.revealCount < prior) state.career.bestCalls[state.scenarioKey] = state.revealCount;
        }
        awardBadges();
      }
      const trainingNote = countsTowardAchievements
        ? ""
        : " Training runs teach the controls but do not award badges or change performance statistics.";
      showFeedback(true, "Pattern verified!", `The pattern can be described this way: ${s.explanation} Your prediction matches the factory output.${trainingNote}`);
      revealVerification(guess);
      els.predictionBay.hidden = true;
      els.factoryShell.classList.add("solved");
      setFactoryState("stopped", "Job complete");
      els.consoleMessage.textContent = "Excellent work, Pattern Engineer. Restart the job or choose another assignment.";
      lessonAction("submit");
    } else {
      const parts = [];
      if (!defectCorrect) parts.push("That product follows the rule. Compare odd and even positions.");
      if (!productCorrect) parts.push(partialProductHint(guess, targetProduct(), s.features));
      showFeedback(false, "Prediction needs adjustment", parts.join(" "));
      els.consoleMessage.textContent = "Revise your prediction, then test again.";
    }
    saveCareer();
    renderStats();
    renderBadges();
    announce(els.feedbackText.textContent);
  }

  function partialProductHint(guess, target, features) {
    const matching = features.filter(key => guess[key] === target[key]);
    if (matching.length >= 2) return `Your ${matching.join(" and ")} evidence fits. Inspect the other features separately.`;
    return `Look at ${features.join(", ")} as separate tracks.`;
  }

  function revealVerification(guess) {
    const s = state.scenario;
    if (s.mode === "repair") {
      const repaired = [...s.sequence];
      repaired[s.defectIndex] = s.correctSequence[s.defectIndex];
      const original = s.sequence;
      s.sequence = repaired;
      renderLine(s.defectIndex);
      s.sequence = original;
    } else {
      const oldCount = state.revealCount;
      state.revealCount = Math.min(s.sequence.length, oldCount + 2);
      renderLine(oldCount);
    }
    updateControls();
  }

  function showFeedback(success, title, text) {
    els.feedbackPanel.hidden = false;
    els.feedbackPanel.className = `feedback-panel ${success ? "success" : "partial"}`;
    els.feedbackMark.textContent = success ? "✓" : "!";
    els.feedbackTitle.textContent = title;
    els.feedbackText.textContent = text;
    els.feedbackPanel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }

  function awardBadge(key, tier) {
    const order = ["locked","bronze","silver","gold","emerald"];
    const current = state.career.badges[key] || "locked";
    if (order.indexOf(tier) > order.indexOf(current)) state.career.badges[key] = tier;
  }
  function awardBadges() {
    const solved = Object.keys(state.career.solvedJobs).length;
    const evidence = Object.keys(state.career.evidenceJobs).length;
    const early = Object.keys(state.career.earlyJobs).length;
    const repair = Object.keys(state.career.repairJobs).length;
    const accuracy = state.career.attempts ? state.career.correct / state.career.attempts : 0;

    if (solved >= 3) {
      awardBadge("first", solved >= 14 ? "emerald" : solved >= 10 ? "gold" : solved >= 6 ? "silver" : "bronze");
    }
    if (solved >= 5 && accuracy >= .7) {
      const ruleTier = solved >= 14 && accuracy >= .95 ? "emerald"
        : solved >= 11 && accuracy >= .9 ? "gold"
          : solved >= 8 && accuracy >= .8 ? "silver" : "bronze";
      awardBadge("rule", ruleTier);
    }
    if (evidence >= 4) {
      awardBadge("evidence", evidence >= 13 ? "emerald" : evidence >= 10 ? "gold" : evidence >= 7 ? "silver" : "bronze");
    }
    if (early >= 3) {
      const earlyTier = early >= 10 ? "emerald" : early >= 7 ? "gold" : early >= 5 ? "silver" : "bronze";
      awardBadge("early", earlyTier);
    }
    if (repair >= 3) {
      const repairTier = repair >= 4 && state.career.repairs >= 12 ? "emerald"
        : repair >= 4 && state.career.repairs >= 8 ? "gold"
          : repair >= 4 ? "silver" : "bronze";
      awardBadge("repair", repairTier);
    }
    if (solved >= 5) {
      awardBadge("transfer", solved >= 14 ? "emerald" : solved >= 11 ? "gold" : solved >= 8 ? "silver" : "bronze");
    }
  }

  function renderBadges() {
    els.badgeRail.innerHTML = Object.entries(badges).map(([key,badge]) => badgeMarkup(key,badge)).join("");
    els.badgeCabinet.innerHTML = Object.entries(badges).map(([key,badge]) => {
      const tier = state.career.badges[key] || "locked";
      const next = ({locked:"Earn this badge by demonstrating the skill.",bronze:"Keep practicing to upgrade to Silver.",silver:"Show consistent strength to upgrade to Gold.",gold:"Gold certification earned.",emerald:"Exceptional certification earned."})[tier];
      return `<article class="cabinet-row ${tier}"><span class="badge-icon" aria-hidden="true">${badge.icon}</span><div><h3>${badge.name} · ${capitalize(tier)}</h3><p>${badge.description} ${badgeProgress(key)} ${next}</p></div></article>`;
    }).join("");
  }
  function badgeMarkup(key,badge) {
    const tier = state.career.badges[key] || "locked";
    const tooltip = `${badge.description} ${badgeProgress(key)} Current level: ${capitalize(tier)}.`;
    return `<div class="badge ${tier} ${tier !== "locked" ? "earned" : ""}" tabindex="0"
      aria-label="${badge.name}, ${tier}. ${escapeText(badge.description)}" title="${escapeText(tooltip)}">
      <span class="badge-tip" role="tooltip">${escapeText(tooltip)}</span>
      <span class="badge-icon" aria-hidden="true">${badge.icon}</span><strong>${badge.name}</strong><small>${tier}</small></div>`;
  }
  function badgeProgress(key) {
    const unique = mapKey => Object.keys(state.career[mapKey] || {}).length;
    if (key === "first") return `Progress: ${unique("solvedJobs")}/3 different jobs.`;
    if (key === "evidence") return `Progress: ${unique("evidenceJobs")}/4 different jobs.`;
    if (key === "early") return `Progress: ${unique("earlyJobs")}/3 early calls.`;
    if (key === "repair") return `Progress: ${unique("repairJobs")}/3 different repairs.`;
    if (key === "rule") {
      const accuracy = state.career.attempts ? Math.round(state.career.correct / state.career.attempts * 100) : 0;
      return `Progress: ${unique("solvedJobs")}/5 jobs at ${accuracy}% accuracy.`;
    }
    return `Progress: ${unique("solvedJobs")}/5 different jobs.`;
  }
  function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

  function renderStats() {
    const solved = Object.keys(state.career.solvedJobs || {}).length;
    const totalJobs = Object.keys(scenarios).filter(key => key !== "guided").length;
    const careerAccuracy = state.career.attempts ? state.career.correct / state.career.attempts : 0;
    const earlyJobs = Object.keys(state.career.earlyJobs || {}).length;
    const repairJobs = Object.keys(state.career.repairJobs || {}).length;
    const rating = solved * 75 + Math.min(state.career.verified, 30) * 5 +
      Math.round(careerAccuracy * 100) + earlyJobs * 15 + repairJobs * 15;
    const rank = rating >= 1300 ? "Master Analyst"
      : rating >= 950 ? "Pattern Engineer"
        : rating >= 650 ? "Pattern Technician"
          : rating >= 350 ? "Line Operator" : "Trainee";
    els.jobsSolvedResult.textContent = `${solved} / ${totalJobs}`;
    els.rankResult.textContent = `${rank} · ${rating}`;
    els.rankResult.title = "Rating combines different jobs solved, verified completions, accuracy, early supported calls, and successful repairs.";
    const bestValues = Object.values(state.career.bestCalls || {});
    els.bestResult.textContent = bestValues.length ? `${Math.min(...bestValues)} clues` : "—";
    els.accuracyResult.textContent = state.career.attempts ? `${Math.round(careerAccuracy * 100)}%` : "—";
  }

  function resetRound() {
    if (!state.scenarioKey) return;
    loadScenario(state.scenarioKey, state.scenarioKey === "guided");
  }
  function clearBoard() {
    state.sessionAttempts = 0;
    state.sessionCorrect = 0;
    state.career.lastResult = "—";
    state.career.bestCalls = {};
    saveCareer();
    if (state.scenarioKey) resetRound();
    renderStats();
    announce("Board and current-session results cleared. Badges were kept.");
  }

  function resetScannerButtons() {
    els.scannerButtons.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed","false"));
    els.beltWindow.classList.remove("scanning");
  }
  function toggleScanner(button) {
    const scan = button.dataset.scan;
    state.activeScan = state.activeScan === scan ? "" : scan;
    resetScannerButtons();
    if (state.activeScan) {
      button.setAttribute("aria-pressed","true");
      els.beltWindow.classList.add("scanning");
    }
    renderLine();
    announce(state.activeScan ? `${capitalize(state.activeScan)} scanner active.` : "Scanner off.");
    lessonAction(`scan-${scan}`);
  }

  const lessonSteps = [
    { title:"Welcome to the training line", text:"The machine is following a hidden production rule. Produce one more clue before making a guess.", target:"nextButton", action:"next" },
    { title:"Separate the evidence", text:"Use the Color scanner. It focuses your attention on the color track without solving the pattern for you.", target:"scannerButtons", action:"scan-color" },
    { title:"Gather enough evidence", text:"One more clue will help distinguish a repeating rule from a coincidence.", target:"nextButton", action:"next" },
    { title:"Call the pattern", text:"You now have enough evidence. Stop the conveyor and commit to your hypothesis.", target:"callButton", action:"call" },
    { title:"Build and prove it", text:"Manufacture an orange circle pointing up, then send it to the line.", target:"predictionBay", action:"submit" },
    { title:"Pattern Engineer certified", text:"You observed multiple examples, separated their features, predicted the next product, and then compared your idea with a precise description of the pattern.", target:"feedbackPanel", action:null }
  ];

  function startLesson() {
    state.lesson = { step: 0, complete: false };
    document.body.classList.add("lesson-active");
    els.lessonCard.hidden = false;
    loadScenario("guided", true);
    showLessonStep();
    announce("Guided pattern lesson started.");
  }
  function showLessonStep() {
    document.querySelectorAll(".lesson-target").forEach(el => el.classList.remove("lesson-target"));
    const step = lessonSteps[state.lesson.step];
    els.lessonProgress.textContent = `Guided lesson · Step ${state.lesson.step + 1} of ${lessonSteps.length}`;
    els.lessonTitle.textContent = step.title;
    els.lessonText.textContent = step.text;
    els.lessonNextButton.disabled = Boolean(step.action) && !state.lesson.complete;
    els.lessonNextButton.textContent = state.lesson.step === lessonSteps.length - 1 ? "Finish" : "Next";
    const target = els[step.target] || document.getElementById(step.target);
    if (target) target.classList.add("lesson-target");
  }
  function lessonAction(action) {
    if (!state.lesson) return;
    const step = lessonSteps[state.lesson.step];
    if (step.action !== action || state.lesson.complete) return;
    state.lesson.complete = true;
    els.lessonNextButton.disabled = false;
    if (action === "submit") {
      localStorage.setItem("patternFactoryLessonSeen","1");
    }
  }
  function advanceLesson() {
    if (!state.lesson) return;
    if (state.lesson.step === lessonSteps.length - 1) {
      exitLesson();
      localStorage.setItem("patternFactoryLessonSeen","1");
      return;
    }
    state.lesson.step += 1;
    state.lesson.complete = false;
    showLessonStep();
  }
  function exitLesson() {
    state.lesson = null;
    document.body.classList.remove("lesson-active");
    document.querySelectorAll(".lesson-target").forEach(el => el.classList.remove("lesson-target"));
    els.lessonCard.hidden = true;
    if (state.scenarioKey === "guided") {
      state.scenarioKey = "";
      state.scenario = null;
      els.jobTitle.textContent = "Factory awaiting assignment";
      els.jobBrief.textContent = "Choose a factory job to start the machinery.";
      els.productLine.innerHTML = "";
      els.emptyLine.hidden = false;
      els.predictionBay.hidden = true;
      els.feedbackPanel.hidden = true;
      updateClueGauge(0);
      els.resetRoundButton.disabled = true;
      els.factoryShell.classList.remove("job-active", "solved");
      setFactoryState("", "Standby");
      updateControls();
    }
    announce("Guided lesson closed.");
  }

  const calculatorState = { value: "0", stored: null, operator: null, waiting: false };
  function renderCalculator() {
    els.calculatorDisplay.textContent = calculatorState.value;
  }
  function calculatePair(left, right, operator) {
    if (operator === "add") return left + right;
    if (operator === "subtract") return left - right;
    if (operator === "multiply") return left * right;
    if (operator === "divide") return right === 0 ? NaN : left / right;
    return right;
  }
  function formatCalculation(value) {
    if (!Number.isFinite(value)) return "Error";
    return String(Number(value.toPrecision(12)));
  }
  function useCalculator(action) {
    if (/^\d$/.test(action)) {
      calculatorState.value = calculatorState.waiting || calculatorState.value === "0" || calculatorState.value === "Error"
        ? action : calculatorState.value + action;
      calculatorState.waiting = false;
    } else if (action === ".") {
      if (calculatorState.waiting || calculatorState.value === "Error") {
        calculatorState.value = "0.";
        calculatorState.waiting = false;
      } else if (!calculatorState.value.includes(".")) calculatorState.value += ".";
    } else if (action === "clear") {
      Object.assign(calculatorState, { value:"0", stored:null, operator:null, waiting:false });
    } else if (action === "backspace") {
      calculatorState.value = calculatorState.value.length > 1 ? calculatorState.value.slice(0,-1) : "0";
    } else if (action === "sign" && calculatorState.value !== "0" && calculatorState.value !== "Error") {
      calculatorState.value = calculatorState.value.startsWith("-") ? calculatorState.value.slice(1) : `-${calculatorState.value}`;
    } else if (["add","subtract","multiply","divide"].includes(action)) {
      const current = Number(calculatorState.value);
      if (calculatorState.operator && !calculatorState.waiting) {
        const result = calculatePair(calculatorState.stored, current, calculatorState.operator);
        calculatorState.value = formatCalculation(result);
        calculatorState.stored = result;
      } else {
        calculatorState.stored = current;
      }
      calculatorState.operator = action;
      calculatorState.waiting = true;
    } else if (action === "equals" && calculatorState.operator && calculatorState.stored !== null) {
      const result = calculatePair(calculatorState.stored, Number(calculatorState.value), calculatorState.operator);
      calculatorState.value = formatCalculation(result);
      calculatorState.stored = null;
      calculatorState.operator = null;
      calculatorState.waiting = true;
    }
    renderCalculator();
  }

  async function verifyTeacherNumber(value) {
    const expected = "51c94a510b50e68f490e35edd977845f9b008e3bb1a5c7f0d8eecf8b0b9794bf";
    try {
      const bytes = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest("SHA-256",bytes);
      const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,"0")).join("");
      if (hash === expected) return true;
    } catch { /* Arithmetic fallback below. */ }
    return Number(value) === 3 * 1000 + 1 * 100 + 4 * 10 + 1;
  }

  els.scenarioSelect.addEventListener("change", e => e.target.value && loadScenario(e.target.value));
  els.nextButton.addEventListener("click", revealNext);
  els.callButton.addEventListener("click", stopLine);
  els.resetRoundButton.addEventListener("click", resetRound);
  els.clearButton.addEventListener("click", clearBoard);
  els.productLine.addEventListener("click", e => {
    const slot = e.target.closest(".product-slot.selectable");
    if (slot) selectDefect(Number(slot.dataset.index));
  });
  els.productLine.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const slot = e.target.closest(".product-slot.selectable");
    if (slot) { e.preventDefault(); selectDefect(Number(slot.dataset.index)); }
  });
  document.querySelector(".builder-grid").addEventListener("click", e => {
    const button = e.target.closest("[data-choice]");
    if (button) chooseFeature(button);
  });
  els.numberGuess.addEventListener("input", () => {
    state.guess.number = els.numberGuess.value === "" ? "" : Number(els.numberGuess.value);
    renderPrototype();
    validateBuilder();
  });
  els.submitButton.addEventListener("click", submitGuess);
  els.scannerButtons.addEventListener("click", e => {
    const button = e.target.closest("[data-scan]");
    if (button) toggleScanner(button);
  });
  els.viewBadgesButton.addEventListener("click", () => { renderBadges(); els.badgeDialog.showModal(); });
  els.closeBadgesButton.addEventListener("click", () => els.badgeDialog.close());
  els.doneBadgesButton.addEventListener("click", () => els.badgeDialog.close());
  els.resetBadgesButton.addEventListener("click", () => {
    if (!confirm("Reset all badges and long-term factory achievements on this browser?")) return;
    state.career = {
      ...defaultCareer, badges:{}, bestCalls:{},
      solvedJobs:{}, evidenceJobs:{}, earlyJobs:{}, repairJobs:{}
    };
    saveCareer(); renderBadges(); renderStats(); announce("All achievements reset.");
  });
  els.lessonButton.addEventListener("click", startLesson);
  els.lessonNextButton.addEventListener("click", advanceLesson);
  els.exitLessonButton.addEventListener("click", exitLesson);
  els.fullscreenButton.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { announce("Full screen is unavailable. The host page may need to allow fullscreen."); }
  });
  document.addEventListener("fullscreenchange", () => { els.fullscreenButton.textContent = document.fullscreenElement ? "↙ Exit full screen" : "⛶ Full screen"; });
  els.calculatorButton.addEventListener("click", () => {
    renderCalculator();
    els.calculatorDialog.showModal();
  });
  els.closeCalculatorButton.addEventListener("click", () => els.calculatorDialog.close());
  els.calculatorKeys.addEventListener("click", e => {
    const button = e.target.closest("[data-calc]");
    if (button) useCalculator(button.dataset.calc);
  });
  els.historyButton.addEventListener("click", () => {
    renderHistory();
    els.historyDialog.showModal();
    requestAnimationFrame(() => { els.historyLine.scrollLeft = els.historyLine.scrollWidth; });
  });
  els.closeHistoryButton.addEventListener("click", () => els.historyDialog.close());
  els.doneHistoryButton.addEventListener("click", () => els.historyDialog.close());
  document.addEventListener("keydown", e => {
    if (!els.calculatorDialog.open) return;
    const keyMap = { "+":"add", "-":"subtract", "*":"multiply", "/":"divide", "Enter":"equals", "=":"equals", "Backspace":"backspace", "Escape":null };
    const action = /^\d$/.test(e.key) || e.key === "." ? e.key : keyMap[e.key];
    if (action) {
      e.preventDefault();
      useCalculator(action);
    }
  });
  els.teacherButton.addEventListener("click", () => { els.teacherError.textContent = ""; els.teacherNumber.value = ""; els.teacherDialog.showModal(); });
  els.teacherForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (await verifyTeacherNumber(els.teacherNumber.value.trim())) window.location.href = "solutions.html";
    else { els.teacherError.textContent = "That teacher number did not match."; els.teacherNumber.select(); }
  });

  renderBadges();
  renderStats();
  buildChoices();
  if (!localStorage.getItem("patternFactoryLessonSeen")) {
    setTimeout(() => {
      if (!state.scenario && !state.lesson) startLesson();
    }, 450);
  }
})();
