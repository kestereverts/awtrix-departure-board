import { mergeMap, Observable, share, tap, timer } from "rxjs";
import { fetchDepartures, type TPCResponse } from "../ovapi/api.js";
import { TPC } from "./tpcs.js";

export function createPassageStream(
  tpcs: TPC[],
  refreshRate: number = 5000
): Observable<TPCResponse> {
  return timer(0, refreshRate).pipe(
    mergeMap(() => fetchDepartures(tpcs)),
    tap(() => {
      console.log("\n");
      console.log(new Date());
    }),
    share()
  );
}
