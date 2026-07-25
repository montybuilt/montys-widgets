const fs = require("fs");

const boards = JSON.parse(fs.readFileSync("data/boards.json", "utf8"));
const vectors = {
  north: [-1, 0, "n", "s"],
  east: [0, 1, "e", "w"],
  south: [1, 0, "s", "n"],
  west: [0, -1, "w", "e"]
};

function fail(board, message) {
  throw new Error(`${board.id}: ${message}`);
}

function inBounds(board, row, column) {
  return row >= 0 && row < board.rows && column >= 0 && column < board.columns;
}

function blocked(board, row, column, direction) {
  const [dr, dc, side, opposite] = vectors[direction];
  return board.walls.includes(`${row},${column},${side}`) ||
    board.walls.includes(`${row + dr},${column + dc},${opposite}`);
}

function hasRoute(board) {
  const pitKeys = new Set(board.pits.map(([row, column]) => `${row},${column}`));
  const goalKey = `${board.goal[0]},${board.goal[1]}`;
  const queue = [[board.start[0], board.start[1]]];
  const visited = new Set([`${queue[0][0]},${queue[0][1]}`]);

  while (queue.length) {
    const [row, column] = queue.shift();
    if (`${row},${column}` === goalKey) return true;
    Object.entries(vectors).forEach(([direction, [dr, dc]]) => {
      const nextRow = row + dr;
      const nextColumn = column + dc;
      const key = `${nextRow},${nextColumn}`;
      if (!inBounds(board, nextRow, nextColumn) || pitKeys.has(key) || visited.has(key) ||
          blocked(board, row, column, direction)) return;
      visited.add(key);
      queue.push([nextRow, nextColumn]);
    });
  }
  return false;
}

boards.forEach(board => {
  if (board.rows !== 9 || board.columns !== 15) fail(board, "dimensions are not 9 × 15");
  const coordinates = [
    board.start, board.goal, ...board.pits, ...board.belts, ...board.gears,
    ...(board.wormholes || []), ...(board.deadSquares || []), ...board.lasers, ...(board.warp ? [board.warp] : [])
  ];
  coordinates.forEach(([row, column]) => {
    if (!inBounds(board, row, column)) fail(board, `element outside board at ${row},${column}`);
  });
  board.walls.forEach(wall => {
    const [row, column, side] = wall.split(",");
    if (!inBounds(board, Number(row), Number(column)) || !["n", "e", "s", "w"].includes(side)) {
      fail(board, `invalid wall ${wall}`);
    }
  });
  board.belts.forEach(([row, column, direction]) => {
    const vector = vectors[direction];
    if (!vector) fail(board, `invalid conveyor direction ${direction}`);
    if (!inBounds(board, row + vector[0], column + vector[1])) {
      fail(board, `conveyor exits board at ${row},${column}`);
    }
  });
  if (!hasRoute(board)) fail(board, "no wall-and-pit-safe route from start to goal");
});

console.log(`Validated ${boards.length} boards at 9 × 15.`);
