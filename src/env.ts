import { cleanEnv, str } from "envalid";

export const env = cleanEnv(process.env, {
  MQTT_BROKER_URL: str(),
  MQTT_USERNAME: str(),
  MQTT_PASSWORD: str(),
  MQTT_PREFIX: str(),
  OV_API_URL: str(),
});
