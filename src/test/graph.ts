import * as Tap from "tap";
import * as Graph from "../lib/graph";

Tap.test("graph", (t) => {
  const result = Graph.Example.triangle(5);
  t.strictSame(result.missing, new Map());

  t.end();
});
