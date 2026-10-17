import { html, LitElement, nothing, TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement, property } from "lit/decorators.js";
import { WeatherForecastCardConfig } from "../types";
import { renderSunWeatherIcon } from "./animation/sun-weather-icons";

@customElement("wfc-weather-condition-icon-provider")
export class WfcWeatherConditionIconProvider extends LitElement {
  @property({ attribute: false }) public config!: WeatherForecastCardConfig;
  @property({ attribute: false }) public classes?: string;
  @property({ attribute: false }) public isNightTime = false;
  @property({ attribute: false }) public state = "exceptional";

  protected createRenderRoot() {
    return this;
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.state || !this.config) return nothing;
    const classes = this.classes
      ? `wfc-weather-condition-icon-slot ${this.classes}`
      : "wfc-weather-condition-icon-slot";
    return html`<div class="${classes}" data-condition="${this.state}">
      ${this.getWeatherStateIcon()}
    </div>`;
  }

  private getWeatherStateIcon(): TemplateResult | typeof nothing {
    if (this.config?.icons_path?.trim()) {
      const { path, state } = this.getCustomWeatherIconPath();
      return html`<img src="${path}" alt="${state}" />`;
    }

    const userDefinedIcon = getComputedStyle(this).getPropertyValue(
      `--weather-icon-${this.state}`
    );
    if (userDefinedIcon) {
      return html`<div
        style="background-size: cover;${styleMap({
          "background-image": userDefinedIcon,
        })}"
      ></div>`;
    }

    if (!weatherSVGs.has(this.state)) return nothing;
    const condition =
      this.isNightTime && this.state === "sunny"
        ? "clear-night"
        : this.isNightTime && this.state === "partlycloudy"
          ? "partlycloudy-night"
          : this.state;
    return html`${unsafeSVG(
      renderSunWeatherIcon(condition, 100, this.config.animated_icons !== false)
    )}`;
  }

  private getCustomWeatherIconPath = (): { path: string; state: string } => {
    let condition = weatherSVGs.has(this.state) ? this.state : "exceptional";
    if (this.isNightTime) {
      if (this.state === "partlycloudy") condition = "partlycloudy-night";
      else if (this.state === "sunny") condition = "clear-night";
    }
    const iconsPath = this.config.icons_path?.trim().replace(/\/$/, "");
    return { path: `${iconsPath}/${condition}.svg`, state: condition };
  };
}

const weatherSVGs = new Set<string>([
  "clear-night",
  "cloudy",
  "exceptional",
  "fog",
  "lightning",
  "lightning-rainy",
  "partlycloudy",
  "pouring",
  "rainy",
  "hail",
  "snowy",
  "snowy-rainy",
  "sunny",
  "windy",
  "windy-variant",
]);

declare global {
  interface HTMLElementTagNameMap {
    "wfc-weather-condition-icon-provider": WfcWeatherConditionIconProvider;
  }
}
