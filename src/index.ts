import { WeatherForecastCard } from "./weather-forecast-card";
import * as pjson from "../package.json";
import "./editor/weather-forecast-card-editor";

declare global {
  interface Window {
    customCards: Array<object>;
  }
}

customElements.define("hawc-card", WeatherForecastCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "hawc-card",
  name: "HAWC - Highly Animated Weather Card",
  description: "Animated weather forecast card for Home Assistant",
});

console.info(
  `%cHAWC %c${pjson.version}`,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray"
);
