export interface CyclePosition {
  position: number;
}

export class StudyCycle {
  constructor(
    public readonly id: number,
    public currentRound: number,
    public nextItemOrder: number,
  ) {}

  advance(items: CyclePosition[]) {
    if (items.length === 0) {
      return null;
    }

    const foundIndex = items.findIndex(
      (item) => item.position === this.nextItemOrder,
    );
    const nextIndex = foundIndex === -1 ? 0 : (foundIndex + 1) % items.length;
    const wraps = foundIndex !== -1 && foundIndex === items.length - 1;

    if (wraps) {
      this.currentRound += 1;
    }

    this.nextItemOrder = items[nextIndex].position;

    return {
      currentRound: this.currentRound,
      nextItemOrder: this.nextItemOrder,
      nextPosition: this.nextItemOrder,
    };
  }
}
