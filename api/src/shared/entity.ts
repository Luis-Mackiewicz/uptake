import { assertPositiveInteger } from "./guards.js";

export abstract class OrderedEntity {
  #position: number;

  constructor(position: number) {
    this.#position = assertPositiveInteger(position, "Posição inválida");
  }

  get position(): number {
    return this.#position;
  }

  protected set position(value: number) {
    this.#position = assertPositiveInteger(value, "Posição inválida");
  }
}
