class Deque<T> {
  #buffer: T[];
  #start: number;
  #end: number;

  constructor() {
    this.#buffer = new Array<T>(1);
  }

  at(i: number) {}

  #maybeGrow() {
    if (this.#start === this.#end) {
      const length = this.#buffer.length;
      const postLength = length - this.#start;

      this.#buffer.length <<= 1;
      if (this.#start < postLength) {
        this.#buffer.copyWithin(length, 0, this.#start);
        this.#end += length;
      } else {
        this.#buffer.copyWithin(postLength + length, this.#start, postLength);
        this.#start += length;
      }
    }
  }

  push(value: T) {
    this.#maybeGrow();
    this.#buffer[this.#end++] = value;
    this.#end %= this.#buffer.length;
  }

  shift(value: T) {
    this.#maybeGrow();
    this.#start = (this.#start - 1 + this.#buffer.length) % this.#buffer.length;
    this.#buffer[this.#start] = value;
  }

  pop() {}
  unshift() {}

  *[Symbol.iterator]() {}
}
