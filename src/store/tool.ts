import * as Store from "svelte/store";
import type * as Complex from "$lib/complex";
import type * as Segment from "$lib/segment";
import type * as Polygon from "$lib/polygon";

export const enum Mode {
  Polygon,
  DomainSlit,
  DomainRectangle,
  AnchorZero,
  AnchorAxis,
  Draw,
}

export type State =
  | {
      readonly mode: Mode.Polygon;
      readonly polygon: Polygon.Polygon;
    }
  | {
      readonly mode: Mode.DomainSlit;
      readonly slit?: Segment.Segment;
    }
  | { readonly mode: Mode.DomainRectangle; readonly diagonal?: Segment.Segment }
  | { readonly mode: Mode.AnchorZero }
  | { readonly mode: Mode.AnchorAxis }
  | { readonly mode: Mode.Draw; readonly drawing: Polygon.Polygon };

export const tool = Store.writable<State>({
  mode: Mode.Draw,
  drawing: [],
});

export const position = Store.writable<Complex.Complex | null>(null);
