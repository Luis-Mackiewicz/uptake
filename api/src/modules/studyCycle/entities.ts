import { assertPositiveInteger } from "../../shared/guards.js";

export interface CyclePosition {
  position: number;
}

export class StudyCycle {
  #currentRound: number;
  #nextItemOrder: number;

  constructor(currentRound: number, nextItemOrder: number) {
    this.#currentRound = assertPositiveInteger(
      currentRound,
      "Rodada do ciclo inválida",
    );
    this.#nextItemOrder = assertPositiveInteger(
      nextItemOrder,
      "Próxima posição inválida",
    );
  }

  advance(items: CyclePosition[]) {
    if (items.length === 0) {
      return null;
    }

    const foundIndex = items.findIndex(
      (item) => item.position === this.#nextItemOrder,
    );
    const nextIndex = foundIndex === -1 ? 0 : (foundIndex + 1) % items.length;

    if (foundIndex !== -1 && foundIndex === items.length - 1) {
      this.#currentRound += 1;
    }

    this.#nextItemOrder = items[nextIndex].position;

    return {
      currentRound: this.#currentRound,
      nextItemOrder: this.#nextItemOrder,
    };
  }
}
