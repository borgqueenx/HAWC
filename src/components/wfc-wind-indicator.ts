import { LitElement, html, css, TemplateResult, nothing } from "lit";
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
      transform-box: fill-box;
      transform-origin: left center;
    }
    .wfc-wind-flag-fold {
      fill: none;
      stroke: #fff;
      stroke-width: 0.7;
      opacity: 0.28;
      pointer-events: none;
    }
    .wfc-wind-flag-cloth.is-moving {
      animation: wfc-wind-flag-wave var(--wfc-wind-flag-duration) ease-in-out
        infinite alternate;
    }
    .wfc-wind-speed {
      color: var(--primary-text-color);
      font-size: var(--ha-font-size-xs, 12px);
      font-weight: 600;
      line-height: 14px;
      text-align: center;
      white-space: nowrap;
    }
    @keyframes wfc-wind-flag-wave {
      0% {
        transform: rotate(var(--wfc-wind-flag-counter-sway)) skewY(-1deg);
      }
      50% {
        transform: rotate(0deg) skewY(0deg);
      }
      100% {
        transform: rotate(var(--wfc-wind-flag-sway)) skewY(1deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .wfc-wind-flag-cloth.is-moving {
        animation: none;
      }
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
    const animationDuration = 2.1 - 1.55 * speedRatio;
    const flagSway = 0.5 + 4.5 * speedRatio;
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
        style="color: ${lineColor}; --wfc-wind-flag-duration: ${animationDuration}s; --wfc-wind-flag-sway: ${flagSway}deg; --wfc-wind-flag-counter-sway: -${flagSway}deg"
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
              class="wfc-wind-flag-cloth ${isCalm ? "" : "is-moving"}"
              d="M8 4 C16 4 22 6 28 5 C34 4 39 5 44 6 L44 18 C37 17 32 16 27 18 C20 20 14 17 8 20 Z"
            />
            <path
              class="wfc-wind-flag-fold"
              d="M9 11 C17 10 22 13 29 12 C35 11 39 12 43 12"
            />
          </g>
        </svg>
        <span class="wfc-wind-speed">${speed}</span>
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
