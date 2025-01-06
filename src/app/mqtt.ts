import { connectAsync } from "mqtt";
import { env } from "../env.js";

export const mqtt = await connectAsync(env.MQTT_BROKER_URL, {
  username: env.MQTT_USERNAME,
  password: env.MQTT_PASSWORD,
  protocolVersion: 5,
});
