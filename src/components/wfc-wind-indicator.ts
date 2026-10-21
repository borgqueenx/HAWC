import { LitElement, html, css, TemplateResult, nothing, svg } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ExtendedHomeAssistant } from "../types";
import {
  ForecastAttribute,
  getNormalizedWindBearing,
  getNormalizedWindSpeed,
  getWeatherUnit,
  WeatherEntity,
} from "../data/weather";
import { ForecastWindSpeedUnit } from "../types";

const WIND_SPEED_TO_METERS_PER_SECOND: Record<string, number> = {
  "m/s": 1,
  ms: 1,
  mps: 1,
  "km/h": 1 / 3.6,
  kmh: 1 / 3.6,
  kph: 1 / 3.6,
  "mi/h": 0.44704,
  mph: 0.44704,
  milesperhour: 0.44704,
  "ft/s": 0.3048,
  "in/s": 0.0254,
  kn: 0.514444,
  kt: 0.514444,
  knot: 0.514444,
  knots: 0.514444,
};

const normalizeWindSpeedUnit = (unit: string): string =>
  unit.trim().toLocaleLowerCase().replace(/\s+/g, "");

const convertWindSpeed = (
  speed: number,
  fromUnit: string,
  toUnit: string
): number | undefined => {
  const fromFactor = WIND_SPEED_TO_METERS_PER_SECOND[
    normalizeWindSpeedUnit(fromUnit)
  ];
  const toFactor = WIND_SPEED_TO_METERS_PER_SECOND[
    normalizeWindSpeedUnit(toUnit)
  ];
  if (fromFactor === undefined || toFactor === undefined) {
    return undefined;
  }
  return (speed * fromFactor) / toFactor;
};

@customElement("wfc-wind-indicator")
export class WfcWindIndicator extends LitElement {
  @property({ attribute: false }) hass!: ExtendedHomeAssistant;
  @property({ attribute: false }) weatherEntity!: WeatherEntity;
  @property({ attribute: false }) forecast!: ForecastAttribute;
  @property({ attribute: false }) size = 35;
  @property({ attribute: false }) type: "bearing" | "direction" = "bearing";
  @property({ attribute: false }) displayUnit: ForecastWindSpeedUnit = "entity";

  static styles = css`
    :host {
      display: flex;
      width: 40px;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }
    .wfc-wind-flag {
      display: block;
      overflow: visible;
    }
    .wfc-wind-flag-mast {
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      opacity: 0.8;
    }
    .wfc-wind-flag-cloth {
      fill: currentColor;
    }
    .wfc-wind-flag-fold {
      fill: none;
      stroke: #fff;
      stroke-width: 0.7;
      opacity: 0.28;
      pointer-events: none;
    }
    .wfc-wind-speed {
      fill: var(--primary-text-color);
      font-size: 16px;
      font-weight: 600;
      text-anchor: end;
      paint-order: stroke;
      stroke: var(--ha-card-background, var(--card-background-color, #1a2634));
      stroke-width: 3.5px;
      stroke-linejoin: round;
    }
  `;

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this.forecast || !this.weatherEntity) {
      return nothing;
    }

    const rawWindSpeed = this.forecast.wind_speed ?? 0;
    const sourceUnit = getWeatherUnit(this.hass, this.weatherEntity, "wind_speed");
    const targetUnit = this.displayUnit === "entity" ? sourceUnit : this.displayUnit;
    const convertedSpeed = convertWindSpeed(
      rawWindSpeed,
      sourceUnit,
      targetUnit
    );
    const windSpeed = convertedSpeed ?? rawWindSpeed;
    const shownUnit = convertedSpeed === undefined ? sourceUnit : targetUnit;
    const windBearing = getNormalizedWindBearing(this.forecast);
    const windSpeedKmh = convertWindSpeed(rawWindSpeed, sourceUnit, "km/h") ?? 0;
    const speed = Math.round(windSpeed);
    const lineColor = this.computeLineColor();

    let bearing = windBearing;
    if (bearing !== undefined && this.type === "direction") {
      bearing = (bearing + 180) % 360;
    }

    const hasBearing = Number.isFinite(bearing);
    const isCalm = windSpeedKmh < 2;
    const speedRatio = Math.max(0, Math.min(1, (windSpeedKmh - 2) / 38));
    const flagRotation =
      isCalm ? 90 : hasBearing && bearing !== undefined ? bearing - 90 : 0;
    const animationDuration = 2.2 - 1.8 * speedRatio;
    const wave = 1 + 6 * speedRatio;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = !isCalm && !reduceMotion;
    const wavePhases = [
      [-1, 0, 1, 1, 0],
      [0, -1, 0, 1, 1],
      [1, 0, -1, 0, 1],
      [1, 1, 0, -1, 0],
      [-1, 0, 1, 1, 0],
    ] as const;
    const flagFrames = wavePhases.map(([a, b, c, d, e]) => {
      const y14 = 4 + a * wave;
      const y18 = 4 + b * wave;
      const y24 = 5 + c * wave;
      const y31 = 6 + d * wave;
      const y37 = 5 + e * wave;
      return `M8 4 C14 ${y14} 18 ${y18} 24 ${y24} C31 ${y31} 37 ${y37} 44 5 L44 18 C37 ${19 + e * wave} 31 ${17 + d * wave} 25 ${17 + c * wave} C19 ${17 + b * wave} 14 ${18 + a * wave} 8 20 Z`;
    });
    const foldFrames = wavePhases.map(([a, b, c, d, e]) =>
      `M9 8 C16 ${8 + a * wave * 0.55} 20 ${8 + b * wave * 0.55} 25 ${12 + c * wave * 0.55} C31 ${16 + d * wave * 0.55} 37 ${16 + e * wave * 0.55} 43 13`
    );
    const speedLabel = `${speed} ${shownUnit}`;

    return html`
      <div
        class="wfc-wind-indicator"
        role="img"
        aria-label="${hasBearing
          ? this.type === "direction"
            ? `Wind speed: ${speedLabel}, blowing toward ${bearing} degrees`
            : `Wind speed: ${speedLabel}, bearing from ${bearing} degrees`
          : `Wind speed: ${speedLabel}`}"
        style="color: ${lineColor}"
      >
        <svg
          class="wfc-wind-flag"
          width="${this.size}"
          height="24"
          viewBox="0 0 48 32"
          aria-hidden="true"
        >
          <path class="wfc-wind-flag-mast" d="M8 3v26" />
          <g transform="rotate(${flagRotation} 8 9)">
            <path
              class="wfc-wind-flag-cloth"
              d="M8 4 C15 1 20 4 25 8 C31 13 36 12 44 9 L44 15 C37 20 32 21 25 16 C18 11 14 12 8 20 Z"
            >
              ${shouldAnimate
                ? svg`<animate
                    attributeName="d"
                    dur="${animationDuration}s"
                    values="${flagFrames.join(";")}"
                    keyTimes="0;0.25;0.5;0.75;1"
                    calcMode="spline"
                    keySplines="0.35 0 0.65 1;0.35 0 0.65 1;0.35 0 0.65 1;0.35 0 0.65 1"
                    repeatCount="indefinite"
                  />`
                : nothing}
            </path>
            <path
              class="wfc-wind-flag-fold"
              d="M9 8 C16 5 20 8 25 12 C31 17 37 17 43 13"
            >
              ${shouldAnimate
                ? svg`<animate
                    attributeName="d"
                    dur="${animationDuration}s"
                    values="${foldFrames.join(";")}"
                    keyTimes="0;0.25;0.5;0.75;1"
                    calcMode="spline"
                    keySplines="0.35 0 0.65 1;0.35 0 0.65 1;0.35 0 0.65 1;0.35 0 0.65 1"
                    repeatCount="indefinite"
                  />`
                : nothing}
            </path>
          </g>
          <text class="wfc-wind-speed" x="47" y="31">${speed}</text>
        </svg>
      </div>
    `;
  }

  private computeLineColor(): string {
    const speedMS = getNormalizedWindSpeed(
      this.hass,
      this.weatherEntity,
      this.forecast
    );

    if (!speedMS || speedMS <= 3) {
      return "var(--wfc-wind-low)";
    }
    if (speedMS <= 8) {
      return "var(--wfc-wind-medium)";
    }

    return "var(--wfc-wind-high)";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wfc-wind-indicator": WfcWindIndicator;
  }
}
