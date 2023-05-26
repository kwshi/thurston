import matplotlib.pyplot as mpl
import math


def cosine_law(a: float, b: float, c: float):
    return math.acos((a * a + b * b - c * c) / (2 * a * b))


def angles(r: float, r1: float, r2: float, r3: float):
    return (
        cosine_law(r + r1, r + r2, r1 + r2),
        cosine_law(r + r2, r + r3, r2 + r3),
        cosine_law(r + r3, r + r1, r3 + r1),
    )


def plot_circles(size: float, r: float, r1: float, r2: float, r3: float):
    s1 = r + r1
    s2 = r + r2
    s3 = r + r3

    θ12, θ23, θ31 = angles(r, r1, r2, r3)

    ax = mpl.gca()
    ax.set_xlim((-size, size))
    ax.set_ylim((-size, size))
    ax.add_patch(mpl.Circle((0, 0), r))

    ax.add_patch(mpl.Circle((s1, 0), r1))
    ax.add_patch(mpl.Circle((s2 * math.cos(θ12), s2 * math.sin(θ12)), r2))
    ax.add_patch(mpl.Circle((s3 * math.cos(θ12 + θ23), s3 * math.sin(θ12 + θ23)), r3))
    ax.add_patch(
        mpl.Circle(
            (s1 * math.cos(θ12 + θ23 + θ31), s1 * math.sin(θ12 + θ23 + θ31)),
            r1,
            color="green",
        )
    )


def iterate(r: float, r1: float, r2: float, r3: float):
    θ12, θ23, θ31 = angles(r, r1, r2, r3)

    t = (θ12 + θ23 + θ31) / 6
    r̂ = r * math.sin(t) / (1 - math.sin(t))

    r_next = r̂ * (math.sqrt(2 / (1 - math.cos(2 * math.pi / 3))) - 1)
    return r_next


def main():
    r, r1, r2, r3 = 1, 0.3, 0.7, 0.4
    size = r + max(r1, r2, r3)
    for i in range(3):
        mpl.subplot(1, 3, i + 1, aspect=1)
        plot_circles(size, r, r1, r2, r3)
        r = iterate(r, r1, r2, r3)
        print(r)

    mpl.show()


main()
