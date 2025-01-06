import { env } from "../env.js";
import { cutOffTime, departureBoard, maxItems } from "./departure-board.js";
import { createPassageStream } from "./passage.js";
import { withLineMetadata } from "./line-meta.js";
import { mqtt } from "./mqtt.js";
import { withPunctualityClass } from "./punctuality.js";
import { EmptySlot, Renderer } from "./renderer.js";
import { TPC } from "./tpcs.js";

export async function runApp() {
  const renderer = new Renderer({
    prefix: env.MQTT_PREFIX,
    slots: 6,
  });
  await renderer.start();

  const passages$ = createPassageStream([
    TPC.ElandstraatWestToCenter,
    TPC.MonstersestraatToCenter,
    TPC.LoosduinsewegToCenter,
  ]);

  const CS_SLOT_COUNT = 4;
  const HS_SLOT_COUNT = 2;

  const csBoundBoard$ = passages$.pipe(
    departureBoard([TPC.ElandstraatWestToCenter, TPC.MonstersestraatToCenter]),
    cutOffTime(8),
    maxItems(CS_SLOT_COUNT),
    withLineMetadata(),
    withPunctualityClass()
  );

  const hsBoundBoard$ = passages$.pipe(
    departureBoard([TPC.LoosduinsewegToCenter]),
    cutOffTime(7),
    maxItems(HS_SLOT_COUNT),
    withLineMetadata(),
    withPunctualityClass()
  );

  csBoundBoard$.subscribe((passes) => {
    let i = 0;
    for (; i < passes.length; i++) {
      renderer.updateSlot(i, passes[i]);
      console.log(
        `[${passes[i].displayName.padEnd(2)}] ${Math.trunc(
          passes[i].durationToArrival / 60
        )} min (${passes[i].delay < 0 ? "-" : "+"}${Math.abs(
          passes[i].delay
        )}s)`
      );
    }

    for (; i < CS_SLOT_COUNT; i++) {
      renderer.updateSlot(i, EmptySlot);
      console.log("[--] -- min (+0s)");
    }
  });

  hsBoundBoard$.subscribe((passes) => {
    let i = 0;
    for (; i < passes.length; i++) {
      renderer.updateSlot(CS_SLOT_COUNT + i, passes[i]);
      console.log(
        `[${passes[i].displayName.padEnd(2)}] ${Math.trunc(
          passes[i].durationToArrival / 60
        )} min (${passes[i].delay < 0 ? "-" : "+"}${Math.abs(
          passes[i].delay
        )}s)`
      );
    }

    for (; i < HS_SLOT_COUNT; i++) {
      renderer.updateSlot(CS_SLOT_COUNT + i, EmptySlot);
      console.log("[--] -- min (+0s)");
    }
  });
}

process.on("uncaughtException", async (err) => {
  try {
    console.error(err);
    await Promise.all([mqtt.publishAsync("clock/custom/arrivals", "")]);
    await mqtt.endAsync();
  } finally {
    process.exit(1);
  }
});

process.on("SIGINT", async (err) => {
  try {
    console.error(err);
    await Promise.all([mqtt.publishAsync("clock/custom/arrivals", "")]);
    await mqtt.endAsync();
  } finally {
    process.exit(0);
  }
});

process.on("SIGTERM", async (err) => {
  try {
    console.error(err);
    await Promise.all([mqtt.publishAsync("clock/custom/arrivals", "")]);
    await mqtt.endAsync();
  } finally {
    process.exit(0);
  }
});
