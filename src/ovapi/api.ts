import { env } from "../env.js";

export type TPCResponse = {
  [key: string]: TPCDepartures;
};

export interface TPCDepartures {
  readonly Stop: Stop;
  readonly Passes: { [key: string]: Pass };
  readonly GeneralMessages: GeneralMessages;
}

export interface Stops {
  [key: string]: Pass;
}

export interface Journey {
  ServerTime: string;
  Stops: Stops;
}

export type JourneyResponse = {
  [key: string]: Journey;
};

export interface GeneralMessages {}

export interface Pass {
  readonly IsTimingStop: boolean;
  readonly DestinationName50: string;
  readonly DataOwnerCode: string;
  readonly OperatorCode: string;
  readonly FortifyOrderNumber: number;
  readonly TransportType: string;
  readonly Latitude: number;
  readonly Longitude: number;
  readonly JourneyNumber: number;
  readonly JourneyPatternCode: number;
  readonly LocalServiceLevelCode: number;
  readonly LineDirection: number;
  readonly OperationDate: string;
  readonly TimingPointCode: string;
  readonly WheelChairAccessible: string;
  readonly LineName: string;
  readonly LinePublicNumber: string;
  readonly LastUpdateTimeStamp: string;
  readonly DestinationCode: string;
  readonly ExpectedDepartureTime: string;
  readonly UserStopOrderNumber: number;
  readonly ProductFormulaType: string;
  readonly TimingPointName: string;
  readonly LinePlanningNumber: string;
  readonly TimingPointDataOwnerCode: string;
  readonly TimingPointTown: string;
  readonly TripStopStatus: string;
  readonly UserStopCode: string;
  readonly JourneyStopType: string;
  readonly TargetArrivalTime: string;
  readonly TargetDepartureTime: string;
  readonly ExpectedArrivalTime: string;
  readonly NumberOfCoaches?: number;
  readonly TimingPointWheelChairAccessible: string;
  readonly TimingPointVisualAccessible: string;
}

export interface Stop {
  readonly Longitude: number;
  readonly Latitude: number;
  readonly TimingPointTown: string;
  readonly TimingPointName: string;
  readonly TimingPointCode: string;
  readonly StopAreaCode: null;
  readonly TimingPointWheelChairAccessible: string;
  readonly TimingPointVisualAccessible: string;
}

const userAgent = "AWTRIX 3 Departure Board (https://github.com/kestereverts)";

export async function fetchDepartures(
  timingPointCodes: string[]
): Promise<TPCResponse> {
  try {
    console.time("fetchDepartures");
    if (timingPointCodes.length === 0) {
      return {};
    }
    const url = `${env.OV_API_URL}/tpc/${timingPointCodes
      .map((tcp) => encodeURIComponent(tcp))
      .join(",")}/departures`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
      },
    });
    try {
      return await response.json();
    } catch (e) {
      console.log(response.status, await response.text());
      throw e;
    }
  } finally {
    console.timeEnd("fetchDepartures");
  }
}

export async function fetchJourneys(
  journeyIds: string[]
): Promise<JourneyResponse> {
  if (journeyIds.length === 0) {
    return {};
  }
  const url = `${env.OV_API_URL}/journey/${journeyIds
    .map((tcp) => encodeURIComponent(tcp))
    .join(",")}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
    },
  });
  return await response.json();
}
