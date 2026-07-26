"use strict";

const arrows = { north:"↑", east:"→", south:"↓", west:"←" };
const angles = { north:"0deg", east:"90deg", south:"180deg", west:"270deg" };
const cardinal = ["north","east","south","west"];
let selectedTool = "select";
let selectedElement = null;
let board = emptyBoard();
let boardLibrary = [];

const grid = document.getElementById("editorGrid");
const direction = document.getElementById("direction");
const gearTurn = document.getElementById("gearTurn");
const laserActive = document.getElementById("laserActive");
const wormholeActive = document.getElementById("wormholeActive");
const warpActive = document.getElementById("warpActive");
const laserOrientation = document.getElementById("laserOrientation");
const selectedSummary = document.getElementById("selectedElement");
const elementColor = document.getElementById("elementColor");
const rotateLeft = document.getElementById("rotateLeft");
const rotateRight = document.getElementById("rotateRight");
const deleteSelected = document.getElementById("deleteSelected");
const boardLibrarySelect = document.getElementById("boardLibrarySelect");
const moveBoardUp = document.getElementById("moveBoardUp");
const moveBoardDown = document.getElementById("moveBoardDown");
const fileStatus = document.getElementById("fileStatusText");
const status = document.getElementById("selectionStatus");
const validation = document.getElementById("validation");
const boardRows = document.getElementById("boardRows");
const boardColumns = document.getElementById("boardColumns");
const courseSizeLabel = document.getElementById("courseSizeLabel");

document.querySelectorAll(".tool").forEach(button => {
  button.addEventListener("click", () => selectTool(button.dataset.tool));
  button.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", button.dataset.tool));
});
direction.addEventListener("change", updateStatus);
gearTurn.addEventListener("change", updateStatus);
laserOrientation.addEventListener("change", updateStatus);
wormholeActive.addEventListener("change", updateSelectedWormholeActive);
warpActive.addEventListener("change", updateSelectedWarpActive);
rotateLeft.addEventListener("click", () => rotateSelected(-1));
rotateRight.addEventListener("click", () => rotateSelected(1));
elementColor.addEventListener("input", updateSelectedColor);
deleteSelected.addEventListener("click", deleteSelectedElement);
document.getElementById("saveBoardsFile").addEventListener("click", saveBoardsFile);
document.getElementById("testBoard").addEventListener("click", testCurrentBoard);
document.getElementById("newBoard").addEventListener("click", newBoard);
document.getElementById("duplicateBoard").addEventListener("click", duplicateBoard);
document.getElementById("deleteBoard").addEventListener("click", deleteBoard);
moveBoardUp.addEventListener("click", () => moveSelectedBoard(-1));
moveBoardDown.addEventListener("click", () => moveSelectedBoard(1));
boardLibrarySelect.addEventListener("change", loadSelectedLibraryBoard);
["boardId","boardTitle","boardBrief","maxRounds"].forEach(id => document.getElementById(id).addEventListener("input", renderPreview));
[boardRows, boardColumns].forEach(input => input.addEventListener("change", resizeBoard));

function emptyBoard() {
  return { id:"my-course", title:"My Robo-Racer Course", brief:"Reach the beacon.", maxRounds:10,
    rows:9, columns:15,
    start:null, goal:null, pits:[], deadSquares:[], belts:[], gears:[], wormholes:[], warp:null, lasers:[], walls:[],
    deck:["forward1","forward1","forward2","forward2","forward3","left","left","right","right","uturn","back1"] };
}

function selectTool(tool) {
  selectedTool = tool;
  document.querySelectorAll(".tool").forEach(button => button.classList.toggle("active", button.dataset.tool === tool));
  updateStatus();
}

function updateStatus() {
  const extra = selectedTool === "gear" ? (gearTurn.value === "1" ? "Clockwise" : "Counterclockwise") :
    selectedTool === "laser" ? laserOrientation.options[laserOrientation.selectedIndex].text :
    ["start","belt","wall"].includes(selectedTool) ? direction.options[direction.selectedIndex].text : "";
  status.textContent = `${selectedTool[0].toUpperCase()+selectedTool.slice(1)}${extra ? ` · ${extra}` : ""}`;
}

function buildGrid() {
  grid.innerHTML = "";
  grid.style.setProperty("--editor-rows", board.rows);
  grid.style.setProperty("--editor-columns", board.columns);
  grid.style.setProperty("--editor-aspect", board.columns / board.rows);
  courseSizeLabel.textContent = `${board.columns} × ${board.rows} course`;
  for (let r=0;r<board.rows;r++) for (let c=0;c<board.columns;c++) {
    const cell = document.createElement("button");
    cell.type = "button"; cell.className = "editor-cell";
    cell.setAttribute("role","gridcell");
    cell.setAttribute("aria-label",`Row ${r+1}, column ${c+1}`);
    cell.addEventListener("click", () => place(selectedTool,r,c));
    cell.addEventListener("dragover", event => event.preventDefault());
    cell.addEventListener("drop", event => { event.preventDefault(); place(event.dataTransfer.getData("text/plain") || selectedTool,r,c); });
    grid.append(cell);
  }
}

function place(tool,r,c) {
  if (tool === "select") { selectedElement = inspectCell(r,c); render(); return; }
  if (tool === "erase") { eraseCell(r,c); selectedElement = null; }
  else if (tool === "start") { board.start = [r,c,direction.value]; selectedElement={type:"start",r,c}; }
  else if (tool === "goal") { board.goal = [r,c]; selectedElement={type:"goal",r,c}; }
  else if (tool === "pit") { togglePoint(board.pits,r,c); selectedElement=inspectCell(r,c); }
  else if (tool === "dead-square") { togglePoint(board.deadSquares,r,c); selectedElement=inspectCell(r,c); }
  else if (tool === "belt") { upsert(board.belts,[r,c,direction.value]); selectedElement={type:"belt",r,c}; }
  else if (tool === "gear") { upsert(board.gears,[r,c,Number(gearTurn.value)]); selectedElement={type:"gear",r,c}; }
  else if (tool === "wormhole") {
    upsert(board.wormholes,[r,c,wormholeActive.checked]);
    selectedElement={type:"wormhole",r,c};
  }
  else if (tool === "warp") {
    board.warp=[r,c,warpActive.checked];
    selectedElement={type:"warp",r,c};
  }
  else if (tool === "laser") {
    upsert(board.lasers,[r,c,laserActive.checked,laserOrientation.value,elementColor.value]);
    selectedElement={type:"laser",r,c};
  }
  else if (tool === "wall") {
    const side = direction.value[0];
    const key = `${r},${c},${side}`;
    board.walls = board.walls.includes(key) ? board.walls.filter(item => item !== key) : [...board.walls,key];
    selectedElement = board.walls.includes(key) ? {type:"wall",r,c,side} : null;
  }
  render();
}

function inspectCell(r,c) {
  if (board.start?.[0]===r && board.start?.[1]===c) return {type:"start",r,c};
  if (board.goal?.[0]===r && board.goal?.[1]===c) return {type:"goal",r,c};
  if (board.warp?.[0]===r && board.warp?.[1]===c) return {type:"warp",r,c};
  if (board.deadSquares.some(item=>item[0]===r&&item[1]===c)) return {type:"dead-square",r,c};
  for (const type of ["pit","belt","gear","wormhole","laser"]) {
    const key = type === "pit" ? "pits" : `${type}s`;
    if (board[key].some(item=>item[0]===r&&item[1]===c)) return {type,r,c};
  }
  const wall = board.walls.find(item=>item.startsWith(`${r},${c},`));
  return wall ? {type:"wall",r,c,side:wall.split(",")[2]} : null;
}

function rotateSelected(step) {
  if (!selectedElement) return;
  const {type,r,c} = selectedElement;
  if (type === "start") board.start[2] = rotated(board.start[2],step);
  else if (type === "belt") board.belts.find(x=>x[0]===r&&x[1]===c)[2] = rotated(board.belts.find(x=>x[0]===r&&x[1]===c)[2],step);
  else if (type === "laser") {
    const laser = board.lasers.find(x=>x[0]===r&&x[1]===c);
    laser[3] = laserOrientationOf(laser[3]) === "vertical" ? "horizontal" : "vertical";
  } else if (type === "gear") {
    const gear = board.gears.find(x=>x[0]===r&&x[1]===c);
    gear[2] *= -1;
  } else if (type === "wall") {
    const oldKey = `${r},${c},${selectedElement.side}`;
    const nextSide = rotated({n:"north",e:"east",s:"south",w:"west"}[selectedElement.side],step)[0];
    board.walls = board.walls.filter(item=>item!==oldKey);
    const newKey = `${r},${c},${nextSide}`;
    if (!board.walls.includes(newKey)) board.walls.push(newKey);
    selectedElement.side = nextSide;
  }
  render();
}
function rotated(value,step) { return cardinal[(cardinal.indexOf(value)+step+4)%4]; }
function updateSelectedColor() {
  if (selectedElement?.type !== "laser") return;
  const laser=board.lasers.find(x=>x[0]===selectedElement.r&&x[1]===selectedElement.c);
  laser[4]=elementColor.value; render();
}
function updateSelectedWormholeActive() {
  if (selectedElement?.type !== "wormhole") return;
  const wormhole=board.wormholes.find(x=>x[0]===selectedElement.r&&x[1]===selectedElement.c);
  wormhole[2]=wormholeActive.checked;
  render();
}
function updateSelectedWarpActive() {
  if (selectedElement?.type !== "warp") return;
  board.warp[2]=warpActive.checked;
  render();
}
function deleteSelectedElement() {
  if (!selectedElement) return;
  const {type,r,c} = selectedElement;
  if(type==="start") board.start=null;
  else if(type==="goal") board.goal=null;
  else if(type==="warp") board.warp=null;
  else if(type==="dead-square") board.deadSquares=board.deadSquares.filter(item=>item[0]!==r||item[1]!==c);
  else if(type==="wall") board.walls=board.walls.filter(item=>item!==`${r},${c},${selectedElement.side}`);
  else {
    const key=type==="pit"?"pits":`${type}s`;
    board[key]=board[key].filter(item=>item[0]!==r||item[1]!==c);
  }
  selectedElement=null; render();
}

function togglePoint(list,r,c) {
  const index = list.findIndex(item => item[0]===r && item[1]===c);
  if (index >= 0) list.splice(index,1); else list.push([r,c]);
}
function upsert(list,item) {
  const index = list.findIndex(value => value[0]===item[0] && value[1]===item[1]);
  if (index >= 0) list[index]=item; else list.push(item);
}
function eraseCell(r,c) {
  if (board.start?.[0]===r && board.start?.[1]===c) board.start=null;
  if (board.goal?.[0]===r && board.goal?.[1]===c) board.goal=null;
  if (board.warp?.[0]===r && board.warp?.[1]===c) board.warp=null;
  ["pits","deadSquares","belts","gears","wormholes","lasers"].forEach(key => board[key]=board[key].filter(item => item[0]!==r || item[1]!==c));
  board.walls=board.walls.filter(item => !item.startsWith(`${r},${c},`));
}

function render() {
  [...grid.children].forEach((cell,index) => {
    const r=Math.floor(index/board.columns), c=index%board.columns;
    cell.className="editor-cell"; cell.innerHTML="";
    let symbol="";
    if (board.goal?.[0]===r && board.goal?.[1]===c) { cell.classList.add("has-goal"); symbol="★"; }
    if (board.pits.some(x=>x[0]===r&&x[1]===c)) { cell.classList.add("has-pit"); symbol="●"; }
    if (board.deadSquares.some(x=>x[0]===r&&x[1]===c)) { cell.classList.add("has-dead-square"); symbol=""; }
    const belt=board.belts.find(x=>x[0]===r&&x[1]===c); if(belt){cell.classList.add("has-belt",`belt-${belt[2]}`);symbol=arrows[belt[2]];}
    const gear=board.gears.find(x=>x[0]===r&&x[1]===c); if(gear){cell.classList.add("has-gear");symbol=gear[2]>0?"↻":"↺";}
    const wormhole=board.wormholes.find(x=>x[0]===r&&x[1]===c);
    if(wormhole){
      cell.classList.add("has-wormhole");
      if(wormhole[2]===false) cell.classList.add("wormhole-off");
      symbol="@";
    }
    if(board.warp?.[0]===r && board.warp?.[1]===c) {
      cell.classList.add("has-warp");
      if(board.warp[2]===false) cell.classList.add("warp-off");
      symbol="◎";
    }
    const laser=board.lasers.find(x=>x[0]===r&&x[1]===c); if(laser){
      const laserDir=laserOrientationOf(laser[3]);
      cell.classList.add("has-laser");
      if(laserDir==="vertical") cell.classList.add("laser-vertical");
      if(!laser[2]) cell.classList.add("laser-off");
      cell.style.setProperty("--laser-color",laser[4]||"#da2722");
      symbol=laserDir==="vertical"?"┃":"━";
    }
    board.walls.filter(x=>x.startsWith(`${r},${c},`)).forEach(x=>cell.classList.add(`wall-${x.split(",")[2]}`));
    if(symbol){const span=document.createElement("span");span.className="main-symbol";span.textContent=symbol;cell.append(span);}
    if(board.start?.[0]===r&&board.start?.[1]===c){const marker=document.createElement("span");marker.className="start-marker";marker.style.setProperty("--angle",angles[board.start[2]]);marker.textContent="▲";cell.append(marker);}
    if(selectedElement?.r===r&&selectedElement?.c===c) cell.classList.add("selected-element");
  });
  renderInspector();
  renderPreview();
}

function renderInspector() {
  const selected = selectedElement;
  if (!selected) {
    selectedSummary.textContent="Nothing selected. Choose Select, then click an element.";
    rotateLeft.disabled=true; rotateRight.disabled=true; elementColor.disabled=true; deleteSelected.disabled=true;
    return;
  }
  const names={start:"Robot start",goal:"Goal",pit:"Pit","dead-square":"Dead square",belt:"Conveyor",gear:"Gear",wormhole:"Wormhole",warp:"Warp",laser:"Laser",wall:"Wall"};
  let detail="";
  if(selected.type==="start") detail=board.start[2];
  if(selected.type==="belt") detail=board.belts.find(x=>x[0]===selected.r&&x[1]===selected.c)[2];
  if(selected.type==="gear") detail=board.gears.find(x=>x[0]===selected.r&&x[1]===selected.c)[2]>0?"clockwise":"counterclockwise";
  if(selected.type==="wormhole") {
    const wormhole=board.wormholes.find(x=>x[0]===selected.r&&x[1]===selected.c);
    wormholeActive.checked=wormhole[2]!==false;
    detail=wormhole[2]===false?"starts inactive":"starts active";
  }
  if(selected.type==="warp") {
    warpActive.checked=board.warp[2]!==false;
    detail=board.warp[2]===false?"starts unavailable":"starts available";
  }
  if(selected.type==="laser") {
    const laser=board.lasers.find(x=>x[0]===selected.r&&x[1]===selected.c);
    detail=laserOrientationOf(laser[3]); elementColor.value=laser[4]||"#da2722";
  }
  if(selected.type==="wall") detail=({n:"north",e:"east",s:"south",w:"west"})[selected.side];
  selectedSummary.textContent=`${names[selected.type]} at row ${selected.r+1}, column ${selected.c+1}${detail?` · ${detail}`:""}.`;
  const rotatable=["start","belt","gear","laser","wall"].includes(selected.type);
  rotateLeft.disabled=!rotatable; rotateRight.disabled=!rotatable;
  elementColor.disabled=selected.type!=="laser"; deleteSelected.disabled=false;
}

function currentBoard() {
  return {...board,id:document.getElementById("boardId").value.trim()||"untitled",
    title:document.getElementById("boardTitle").value.trim()||"Untitled Course",
    brief:document.getElementById("boardBrief").value.trim(),
    rows:Number(boardRows.value) || board.rows,
    columns:Number(boardColumns.value) || board.columns,
    maxRounds:Number(document.getElementById("maxRounds").value)||10};
}
function validate(value) {
  const errors=[];
  const coordinates=[value.start,value.goal,...value.pits,...value.deadSquares,...value.belts,...value.gears,...value.wormholes,...value.lasers,value.warp].filter(Boolean);
  if(coordinates.some(item=>item[0]<0||item[0]>=value.rows||item[1]<0||item[1]>=value.columns)) errors.push("An element is outside the selected board dimensions.");
  if(!value.start) errors.push("Add one robot start.");
  if(!value.goal) errors.push("Add one goal.");
  if(value.start&&value.goal&&value.start[0]===value.goal[0]&&value.start[1]===value.goal[1]) errors.push("Start and goal must differ.");
  if(value.goal&&value.pits.some(x=>x[0]===value.goal[0]&&x[1]===value.goal[1])) errors.push("The goal cannot contain a pit.");
  if(value.start&&value.deadSquares.some(x=>x[0]===value.start[0]&&x[1]===value.start[1])) errors.push("The robot start cannot be on a dead square.");
  if(value.goal&&value.deadSquares.some(x=>x[0]===value.goal[0]&&x[1]===value.goal[1])) errors.push("The goal cannot be on a dead square.");
  if(value.walls.some(item=>{const [r,c,side]=item.split(",");return Number(r)<0||Number(r)>=value.rows||Number(c)<0||Number(c)>=value.columns||!["n","e","s","w"].includes(side);})) errors.push("A wall is outside the selected board dimensions.");
  value.belts.forEach(([r,c,d])=>{const delta={north:[-1,0],east:[0,1],south:[1,0],west:[0,-1]}[d];if(r+delta[0]<0||r+delta[0]>=value.rows||c+delta[1]<0||c+delta[1]>=value.columns)errors.push(`Conveyor at row ${r+1}, column ${c+1} exits the board.`);});
  return errors;
}
function renderPreview() {
  const value=currentBoard(), errors=validate(value);
  validation.textContent=errors.length?errors.join(" "):"Board structure is valid and ready to save.";
  validation.classList.toggle("valid",!errors.length);
}
function applyImported(value){
  const hasDimensions=Number(value.rows)>0&&Number(value.columns)>0;
  board={...emptyBoard(),...value,rows:hasDimensions?Number(value.rows):9,columns:hasDimensions?Number(value.columns):9};
  board.wormholes=board.wormholes.map(x=>[x[0],x[1],x[2]!==false]);
  board.deadSquares=board.deadSquares.map(x=>[x[0],x[1]]);
  board.warp=board.warp ? [board.warp[0],board.warp[1],board.warp[2]!==false] : null;
  board.lasers=board.lasers.map(x=>[x[0],x[1],x[2],laserOrientationOf(x[3]),x[4]||"#da2722"]);
  selectedElement=null;
  document.getElementById("boardId").value=board.id;
  document.getElementById("boardTitle").value=board.title;
  document.getElementById("boardBrief").value=board.brief;
  document.getElementById("maxRounds").value=board.maxRounds;
  boardRows.value=board.rows;
  boardColumns.value=board.columns;
  buildGrid();
  render();
}

async function loadBoardLibrary() {
  try {
    fileStatus.textContent="Loading data/boards.json…";
    const response=await fetch("api/boards",{cache:"no-store"});
    if(!response.ok) throw new Error(`Could not load boards.json (${response.status}).`);
    const value=await response.json();
    if(!Array.isArray(value)) throw new Error("The board library must be a JSON array.");
    boardLibrary=value.map(normalizeBoard);
    renderBoardLibrary();
    fileStatus.textContent=`Loaded ${boardLibrary.length} board${boardLibrary.length===1?"":"s"} from data/boards.json.`;
    const recovery=sessionStorage.getItem("roboRacerRecoveryBoard");
    if(recovery) {
      applyImported(JSON.parse(recovery));
      boardLibrarySelect.value="";
      updateBoardOrderButtons();
      fileStatus.textContent="Recovered an unsaved board. Click Save board to write it to data/boards.json.";
    } else if(boardLibrary.length) {
      boardLibrarySelect.value=boardLibrary[0].id;
      loadSelectedLibraryBoard();
    }
  } catch(error) {
    fileStatus.textContent="The save-capable editor service is not running. Close the old local server, then launch start-editor.cmd.";
  }
}

async function saveBoardsFile() {
  const value=currentBoard(), errors=validate(value);
  if(errors.length){validation.textContent=errors.join(" ");return;}
  const duplicate=boardLibrary.find(item=>item.id===value.id);
  if(duplicate) boardLibrary[boardLibrary.indexOf(duplicate)]=value; else boardLibrary.push(value);
  try {
    const response=await fetch("api/boards",{
      method:"PUT",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(boardLibrary)
    });
    if(!response.ok) throw new Error((await response.text()) || `Save failed (${response.status}).`);
    renderBoardLibrary();
    boardLibrarySelect.value=value.id;
    sessionStorage.removeItem("roboRacerRecoveryBoard");
    fileStatus.textContent=`Saved ${value.title} to boards.json. It is ready to test, commit, and push.`;
  } catch(error) {
    sessionStorage.setItem("roboRacerRecoveryBoard",JSON.stringify(value));
    fileStatus.textContent="Could not reach the save service. Keep this tab open, close the old local server, run start-editor.cmd, then click Save board again.";
  }
}

function renderBoardLibrary() {
  const selectedId=boardLibrarySelect.value;
  boardLibrarySelect.innerHTML="";
  if(!boardLibrary.length) boardLibrarySelect.add(new Option("No saved boards",""));
  boardLibrary.forEach(item=>boardLibrarySelect.add(new Option(item.title,item.id)));
  if(boardLibrary.some(item=>item.id===selectedId)) boardLibrarySelect.value=selectedId;
  document.getElementById("deleteBoard").disabled=!boardLibrary.length;
  updateBoardOrderButtons();
}
function loadSelectedLibraryBoard() {
  const selected=boardLibrary.find(item=>item.id===boardLibrarySelect.value);
  if(selected) applyImported(selected);
  updateBoardOrderButtons();
}
function updateBoardOrderButtons() {
  const index=boardLibrary.findIndex(item=>item.id===boardLibrarySelect.value);
  moveBoardUp.disabled=index<=0;
  moveBoardDown.disabled=index<0||index>=boardLibrary.length-1;
}
function moveSelectedBoard(step) {
  const id=boardLibrarySelect.value;
  const index=boardLibrary.findIndex(item=>item.id===id);
  const destination=index+step;
  if(index<0||destination<0||destination>=boardLibrary.length) return;

  [boardLibrary[index],boardLibrary[destination]]=[boardLibrary[destination],boardLibrary[index]];
  renderBoardLibrary();
  boardLibrarySelect.value=id;
  updateBoardOrderButtons();
  fileStatus.textContent=`Moved ${boardLibrary[destination].title} ${step<0?"up":"down"}. Click Save board to write the new order to boards.json.`;
}
function newBoard() {
  applyImported(emptyBoard());
  document.getElementById("boardId").value=`course-${boardLibrary.length+1}`;
  document.getElementById("boardTitle").value="New Robo-Racer Course";
  renderPreview();
  boardLibrarySelect.value="";
  updateBoardOrderButtons();
  fileStatus.textContent="New board started. Save to boards.json when it is valid.";
}
function duplicateBoard() {
  const source=currentBoard();
  applyImported({...source,id:`${source.id}-copy`,title:`${source.title} Copy`});
  boardLibrarySelect.value="";
  updateBoardOrderButtons();
  fileStatus.textContent="Board duplicated. Give it a unique ID, then save it.";
}
function deleteBoard() {
  const id=boardLibrarySelect.value;
  if(!id) return;
  boardLibrary=boardLibrary.filter(item=>item.id!==id);
  renderBoardLibrary();
  if(boardLibrary.length){boardLibrarySelect.value=boardLibrary[0].id;loadSelectedLibraryBoard();}else newBoard();
  fileStatus.textContent="Board removed from the working library. Click Save to boards.json to write the change.";
}
function testCurrentBoard() {
  const value=currentBoard(), errors=validate(value);
  if(errors.length){validation.textContent=errors.join(" ");return;}
  localStorage.setItem("roboRacerTestBoard",JSON.stringify(value));
  window.open("index.html?testBoard=1","_blank");
}
function normalizeBoard(value) {
  const hasDimensions=Number(value.rows)>0&&Number(value.columns)>0;
  const normalized={...emptyBoard(),...value,rows:hasDimensions?Number(value.rows):9,columns:hasDimensions?Number(value.columns):9};
  normalized.wormholes=normalized.wormholes.map(x=>[x[0],x[1],x[2]!==false]);
  normalized.deadSquares=normalized.deadSquares.map(x=>[x[0],x[1]]);
  normalized.warp=normalized.warp ? [normalized.warp[0],normalized.warp[1],normalized.warp[2]!==false] : null;
  normalized.lasers=normalized.lasers.map(x=>[x[0],x[1],x[2],laserOrientationOf(x[3]),x[4]||"#da2722"]);
  return normalized;
}
function laserOrientationOf(value) {
  return value === "north" || value === "south" || value === "vertical" ? "vertical" : "horizontal";
}

function resizeBoard() {
  const rows=Math.max(6,Math.min(15,Number(boardRows.value)||board.rows));
  const columns=Math.max(9,Math.min(20,Number(boardColumns.value)||board.columns));
  board.rows=rows;
  board.columns=columns;
  boardRows.value=rows;
  boardColumns.value=columns;
  selectedElement=null;
  buildGrid();
  render();
}

buildGrid();
render();
loadBoardLibrary();
