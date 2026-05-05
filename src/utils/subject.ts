export class Subject<T> {
  private _value: T;
  private listeners = new Set<(v: T) => void>();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  next(value: T): void {
    this._value = value;
    this.listeners.forEach((l) => l(value));
  }

  getValue(): T {
    return this._value;
  }

  subscribe(fn: (v: T) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
