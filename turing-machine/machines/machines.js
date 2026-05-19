/* Local in-repo sample machines map.
   This avoids AJAX/file:// loading issues by providing sample program texts
   directly to `LoadSampleProgram` when `SAMPLE_MACHINES[name]` exists. */

var SAMPLE_MACHINES = {
  "palindrome": "; Palindrome detector sample program\n; $INITIAL_TAPE: abba\n\n; This is a very small illustrative example only.\n; For a full working example, replace with the original program.\n\n0 _ _ r 1\n1 a a r 1\n1 b b r 1\n1 _ _ l halt-accept\n",

  "binaryadd": "; Binary addition sample program\n; $INITIAL_TAPE: 101+11\n\n; Placeholder program - replace with full version as needed\n0 _ _ r 0\n",

  "bitflipper": "; Bit flipper - flips every 0 to 1 and 1 to 0 on the tape\n; $INITIAL_TAPE: 10110\n\n; Simple program: stay in state 0, flip bits and move right; halt on blank.\n\n0 0 1 r 0\n0 1 0 r 0\n0 _ _ * halt-accept\n",

  "universal": "; Universal Turing machine sample (placeholder)\n; $INITIAL_TAPE: 1101\n\n; Placeholder content\n0 _ _ r halt\n"
};
