import { DateTime } from "luxon";
import { map, mergeMap, pipe, tap, type Observable } from "rxjs";
import { fetchJourneys, type Pass, type TPCResponse } from "../ovapi/api.js";

export interface WithPass {
  pass: Pass;
}

export interface DepartureLine {
  /**
   * Duration in seconds until arrival
   */
  durationToArrival: number;

  /**
   * Deplay in seconds. Negative values indicate early arrival.
   */
  delay: number;
}

export function departureBoard(tpcs: string[]) {
  return pipe(mapToPasses(tpcs), departureLine(), sort());
}

function mapToPasses(tpcs: string[]) {
  return pipe(
    map((tpcResponse: TPCResponse) => {
      return tpcs
        .map((tpc) => tpcResponse[tpc].Passes)
        .flatMap((passes) => Object.values(passes))
        .map((pass) => ({ pass } as WithPass));
    })
  );
}

function departureLine() {
  return pipe(
    map(<T extends WithPass>(passables: T[]): (T & DepartureLine)[] => {
      return passables.map((passable) => {
        const expected = DateTime.fromISO(passable.pass.ExpectedArrivalTime, {
          zone: "Europe/Amsterdam",
        });
        const target = DateTime.fromISO(passable.pass.TargetArrivalTime, {
          zone: "Europe/Amsterdam",
        });

        const durationToArrival = expected.diffNow("seconds").seconds;

        const delay = expected.diff(target, "seconds").seconds;
        return {
          ...passable,
          durationToArrival,
          delay,
        };
      });
    })
  );
}

function mapToJourneyIdList(tpcs: string[]) {
  return pipe(
    map((tpcResponse: TPCResponse) => {
      return tpcs
        .map((tpc) => tpcResponse[tpc].Passes)
        .flatMap((passes) => Object.keys(passes));
    })
  );
}

function mapToPassesFromJourneyList(tpcs: string[]) {
  return pipe(
    mergeMap(async (journeyIdList: string[]) => {
      const journeys = await fetchJourneys(journeyIdList);
      return Object.values(journeys)
        .flatMap((journey) => Object.values(journey.Stops))
        .filter((pass) => tpcs.includes(pass.TimingPointCode));
    })
  );
}

function sort() {
  return pipe(
    map(<T extends WithPass>(passables: T[]): T[] => {
      return passables.toSorted(
        (a, b) =>
          DateTime.fromISO(a.pass.ExpectedArrivalTime, {
            zone: "Europe/Amsterdam",
          }).toMillis() -
          DateTime.fromISO(b.pass.ExpectedArrivalTime, {
            zone: "Europe/Amsterdam",
          }).toMillis()
      );
    })
  );
}

export function cutOffTime(cutOff: number) {
  return pipe(
    map(<T extends WithPass>(passables: T[]): T[] => {
      return passables.filter((passable) => {
        const diff = DateTime.fromISO(passable.pass.ExpectedArrivalTime, {
          zone: "Europe/Amsterdam",
        }).diffNow("minutes").minutes;
        return diff >= cutOff && diff < 100;
      });
    })
  );
}

export function maxItems(numberOfDepartures: number) {
  return pipe(
    map(<T>(items: T[]) => {
      //console.log("before", items);
      const rv = items.slice(0, numberOfDepartures);
      //console.log("after", rv);
      return rv;
    })
  );
}
