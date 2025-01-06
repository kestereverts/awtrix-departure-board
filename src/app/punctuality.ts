import { map, pipe } from "rxjs";
import type { DepartureLine } from "./departure-board.js";

export enum Punctuality {
  OnTime,
  Late,
  Early,
}

export interface PunctualityClass {
  punctualityClass: Punctuality;
}

export function withPunctualityClass() {
  return pipe(
    map(
      <T extends DepartureLine>(
        departureLines: T[]
      ): (T & PunctualityClass)[] => {
        return departureLines.map((departureLine) => {
          let punctualityClass = Punctuality.OnTime;

          if (departureLine.delay >= 120) {
            punctualityClass = Punctuality.Late;
          } else if (departureLine.delay <= -60) {
            punctualityClass = Punctuality.Early;
          }

          return { ...departureLine, punctualityClass };
        });
      }
    )
  );
}
