import * as Tap from "tap";
import * as Misc from "../lib/misc";

Tap.test("adjacentPairs", (t) => {
  const cases = [
    { input: [], output: [] },
    { input: [1], output: [] },
    {
      input: [2, 5],
      output: [
        [2, 5],
        [5, 2],
      ],
    },
    {
      input: [2, 7, 9],
      output: [
        [2, 7],
        [7, 9],
        [9, 2],
      ],
    },
  ];

  for (const { input, output } of cases)
    t.strictSame([...Misc.adjacentPairs(input)], output);

  t.end();
});
