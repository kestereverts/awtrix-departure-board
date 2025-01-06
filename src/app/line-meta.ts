import { map, pipe } from "rxjs";
import type { WithPass } from "./departure-board.js";

export interface LineMetadata {
  readonly color: string;
  readonly textColor: string;
  readonly displayName: string;
}

const metadata: Record<string, LineMetadata> = {
  "2": {
    color: "#fcc203",
    textColor: "#000000",
    displayName: "2",
  },
  "42": {
    color: "#fcc203",
    textColor: "#000000",
    displayName: "2k",
  },
  "3": {
    color: "#7f1a6b",
    textColor: "#ffffff",
    displayName: "3",
  },
  "34": {
    color: "#7f1a6b",
    textColor: "#ffffff",
    displayName: "34",
  },
  "4": {
    color: "#dc7a09",
    textColor: "#ffffff",
    displayName: "4",
  },
  "11": {
    color: "#77503c",
    textColor: "#ffffff",
    displayName: "11",
  },
};

export function getLineMetadata(line: string): LineMetadata {
  if (line in metadata) {
    return metadata[line];
  }
  return {
    color: "#006600",
    textColor: "#ffffff",
    displayName: line,
  };
}

export function withLineMetadata() {
  return pipe(
    map(<T extends WithPass>(passables: T[]): (T & LineMetadata)[] => {
      return passables.map((passable) => {
        const { color, textColor, displayName } = getLineMetadata(
          passable.pass.LinePlanningNumber
        );
        return {
          ...passable,
          color,
          textColor,
          displayName,
        };
      });
    })
  );
}
