import type * as Complex from "$lib/complex";
import type * as Lattice from "$lib/lattice";

export type Radius = { radius: number };
export type Position = { position: Complex.Complex };
export type Data<T> = { data: T };

export type Full = Radius & Position & Data<Lattice.Coordinate>;
