import type { IPublishPacket } from "mqtt";
import type { DepartureLine } from "./departure-board.js";
import type { LineMetadata } from "./line-meta.js";
import { mqtt } from "./mqtt.js";
import { Punctuality, type PunctualityClass } from "./punctuality.js";

export interface RendererOptions {
  slots: number;
  prefix: string;
}

type Data = DepartureLine & PunctualityClass & LineMetadata;

export const EmptySlot = Symbol("EmptySlot");

export class Renderer {
  private slots: number;
  private prefix: string;
  private timer?: NodeJS.Timeout;
  private data: (Data | typeof EmptySlot | undefined)[];
  private dotPosition = 0;
  private messageListener: (
    topic: string,
    message: Buffer<ArrayBufferLike>,
    packet: IPublishPacket
  ) => void;
  private activeSlot: number | undefined;

  public constructor(options: RendererOptions) {
    this.slots = options.slots;
    this.prefix = options.prefix;
    this.data = Array(this.slots).fill(undefined);

    const messageListener = (
      topic: string,
      message: Buffer<ArrayBufferLike>,
      packet: IPublishPacket
    ) => {
      this.handleMessage(topic, message, packet);
    };

    this.messageListener = messageListener;
  }

  public async start() {
    mqtt.on("message", this.messageListener);
    mqtt.subscribe(`${this.prefix}/stats/currentApp`);
    for (let i = 0; i < this.slots; i++) {
      await mqtt.publishAsync(
        `${this.prefix}/custom/arrivals${i}`,
        JSON.stringify({ text: "Loading...", pos: i }),
        { qos: 2 }
      );
    }
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => this.render(), 250);
    setImmediate(() => {
      this.render();
      mqtt.publish(
        `${this.prefix}/switch`,
        JSON.stringify({ name: "arrivals0" })
      );
    });
  }

  public async stop() {
    mqtt.off("message", this.messageListener);
    await Promise.all([
      mqtt.publishAsync(`${this.prefix}/custom/arrivals`, ""),
    ]);
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  public handleMessage(
    topic: string,
    message: Buffer<ArrayBufferLike>,
    packet: IPublishPacket
  ) {
    if (topic === `${this.prefix}/stats/currentApp`) {
      if (message.toString().startsWith("arrivals")) {
        const slot = parseInt(message.toString().slice(8), 10);
        this.activeSlot = slot;
      } else {
        this.activeSlot = undefined;
      }
    }
  }

  public updateSlot(slot: number, data: Data | typeof EmptySlot) {
    this.data[slot] = data;
  }

  public updateSlots(data: (Data | typeof EmptySlot)[], start: number) {
    if (start + data.length > this.slots) {
      throw new Error("Invalid slot range");
    }

    for (let i = 0; i < data.length; i++) {
      this.data[start + i] = data[i];
    }
  }

  private render() {
    const apps = [];
    const crawlPixel = {
      dp: [(this.dotPosition = (this.dotPosition + 1) % 9), 7, "#dddddd"],
    };
    for (let i = 0; i < this.slots; i++) {
      if (this.activeSlot === undefined && i !== 0) continue;
      else if (
        this.activeSlot !== undefined &&
        this.activeSlot !== i &&
        this.activeSlot + 1 !== i
      )
        continue;

      const data = this.data[i];
      let app;
      if (data === EmptySlot) {
        app = {
          pos: i,
          draw: [
            { df: [0, 0, 9, 7, "#000000"] },
            { dt: [1, 1, "-", "#ffffff"] },
            { dt: [11, 1, "-- min", "#ffffff"] },
            crawlPixel,
          ],
        };
      } else if (data) {
        let timeColor = "#ffffff";
        if (data.punctualityClass == Punctuality.Late) {
          timeColor = "#800000";
        } else if (data.punctualityClass == Punctuality.Early) {
          timeColor = "#00cc00";
        }

        const lineOffset = data.displayName.length == 1 ? 3 : 1;

        app = {
          pos: i,
          draw: [
            { df: [0, 0, 9, 7, data.color] },
            { dl: [0, 7, 8, 7, "#ffffff"] },
            { dt: [lineOffset, 1, data.displayName, data.textColor] },
            {
              dt: [
                11,
                1,
                `${String(Math.trunc(data.durationToArrival / 60))} min`,
                timeColor,
              ],
            },
            crawlPixel,
          ],
        };
      } else {
        app = { text: "Loading...", duration: 3, pos: i };
      }

      mqtt.publish(`${this.prefix}/custom/arrivals${i}`, JSON.stringify(app));
    }
  }
}
