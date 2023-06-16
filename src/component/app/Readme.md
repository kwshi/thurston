# What is this?

(motivation)

**Riemann's mapping theorem** states the following. Suppose $U$ is a non-empty, proper open subset of $ℂ$ and that $U$ is simply-connected, and let $z₀,z₁∈U$. Then there exists a unique biholomorphism $ϕ\colon U→𝔻$ (where $𝔻$ is the unit disk), with the property that $ϕ(z₀)=0$, and $ϕ(z₁)$ lands on the positive-real axis.

**Thurston's conjecture** (also sometimes known as the **discrete Riemann mapping theorem**) provides an insightful (and pretty!) construction/visualization the Riemann mapping theorem, which proceeds roughly as follows:

1. Given a (bounded) domain $U$, approximately triangulate $U$ via a hexagonal circle-packing of radius $ϵ$.

2. Carefully resize each circle to obtain a new packing _with the same tangency structure_ that fits “maximally” within the unit disk; i.e., boundary circles end up tangent to the boundary of the disk. This results in a mapping from circles in the original domain $U$ to circles in $𝔻$.

3. Map each triangle in $U$ (as defined by the centers of three mutually-tangent circles) to the corresponding triangle in $𝔻$ by a (uniquely-determined) affine map; gluing each piece together gives a map defined on the full triangulation.

4. Apply a (Möbius) disk automorphism to send the image of $z₀$ to $0$, and rotate the image of $z₁$ onto the real axis.

5. As $ϵ$ tends to zero, the map constructed in this manner gradually tends to the Riemann map from $U$ to $𝔻$.

## What is this app?

This app is an interactive demonstration of Thurston's conjecture. Here's how it works:

- There are two panes: the pane on the left depicts the original domain, $U$, and the pane on the right depicts the target domain, $𝔻$.

- Start by specifying $U$ using the “set domain” tools, and use the “change zero/positive-real anchor” tools to specify $z₀$ and $z₁$.

- Once this is done, the circle-packings and triangulations (of both the original domain and the unit disk) will be automatically computed and displayed. Use the “resolution” slider to adjust $ϵ$, the size of circles in the original packing.

- Use the “add drawings” tool to mark points and curves within $U$ (in the left pane); their images in $𝔻$ will be automatically computed and rendered (in the right pane).

# cool explorations

## “Koebe” map

## sharp angles

## schwarz christoffel?
