import { html, LitElement, nothing, svg, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { actionHandler } from "../hass";
import { computeEntityName } from "../entity-name";
import {
  getMoonPhaseInfo,
  getSuntimesInfo,
  moonLitPath,
  normalizeDate,
} from "../helpers";
import {
  ActionConfig,
  ActionHandlerEvent,
  handleAction,
  hasAction,
} from "custom-card-helpers";
import type { HassEntity } from "home-assistant-js-websocket";
import {
  CURRENT_WEATHER_ATTRIBUTES,
  CurrentWeatherAttributes,
  CurrentWeatherAttributeConfig,
  ExtendedHomeAssistant,
  WeatherForecastCardConfig,
} from "../types";
import {
  ForecastAttribute,
  formatCustomEntityAttributeValue,
  formatTemperature,
  formatWeatherEntityAttributeValue,
  WEATHER_ATTRIBUTE_ICON_MAP,
  WeatherEntity,
} from "../data/weather";

import "./wfc-weather-condition-icon-provider";
import "./wfc-current-weather-attributes";

export type NormalizedAttributeConfig = {
  name?: CurrentWeatherAttributes | string;
  entity?: string;
  label?: string;
  icon?: string;
};

type SecondaryInfo = {
  icon?: string;
  stateObj?: HassEntity;
  value?: string;
};

type TemperatureExtrema = {
  high?: string;
  low?: string;
};

type ExtendedCurrentWeatherAttribute =
  | (typeof CURRENT_WEATHER_ATTRIBUTES)[number]
  | "precipitation";

const EXTENDED_WEATHER_ATTRIBUTE_ICON_MAP: {
  [key in ExtendedCurrentWeatherAttribute]: string;
} = {
  ...WEATHER_ATTRIBUTE_ICON_MAP,
  precipitation: "mdi:weather-rainy",
};

@customElement("wfc-current-weather")
export class WfcCurrentWeather extends LitElement {
  @property({ attribute: false }) hass!: ExtendedHomeAssistant;
  @property({ attribute: false }) weatherEntity!: WeatherEntity;
  @property({ attribute: false }) hourlyForecast?: ForecastAttribute[];
  @property({ attribute: false }) dailyForecast?: ForecastAttribute[];
  @property({ attribute: false }) config!: WeatherForecastCardConfig;
  @state() private _now = new Date();
  private _clockTimer?: number;

  connectedCallback(): void {
    super.connectedCallback();
    this._clockTimer = window.setInterval(() => {
      this._now = new Date();
    }, 30_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._clockTimer !== undefined) {
      window.clearInterval(this._clockTimer);
      this._clockTimer = undefined;
    }
  }

  protected createRenderRoot() {
    return this;
  }

  render(): TemplateResult | typeof nothing {
    if (!this.hass || !this.weatherEntity) {
      return nothing;
    }

    const { state } = this.weatherEntity;
    const currentTemperature = this.getTemperature();
    const secondaryInfo = this.getSecondaryWeatherAttribute();
    const isNightTime = this.isNightTime();
    const attributes = this.getConfiguredAttributes();
    const sunPath =
      this.config.current?.show_sun_path !== false
        ? this.getSunPath()
        : nothing;
    const agenda =
      this.config.current?.show_agenda !== false ? this.getAgendaItems() : [];
    const hasAgenda =
      this.config.current?.show_agenda !== false &&
      (agenda.length > 0 ||
        (this.config.current?.agenda_entities?.length ?? 0) > 0);
    const datetimeOffset = Math.max(
      0,
      Math.min(200, this.config.current?.datetime_offset ?? 0)
    );
    const datetimeWeatherGap = Math.max(
      -100,
      Math.min(100, this.config.current?.datetime_weather_gap ?? 0)
    );
    const agendaSunGap = Math.max(
      0,
      Math.min(100, this.config.current?.agenda_sun_gap ?? 12)
    );
    const datetimeHeader =
      this.config.current?.show_time !== false ||
      this.config.current?.show_date !== false
        ? html`<div
            class="wfc-current-datetime ${this.config.current
              ?.datetime_position === "bottom"
              ? "wfc-datetime-bottom"
              : "wfc-datetime-top"}"
            style=${styleMap({
              transform: `translateY(-${datetimeOffset}px)`,
            })}
          >
            ${this.config.current?.show_time !== false
              ? html`<span class="wfc-current-clock"
                  >${this._now.toLocaleTimeString(this.hass.locale?.language, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</span
                >`
              : nothing}
            ${this.config.current?.show_date !== false
              ? html`<span class="wfc-current-date"
                  >${this._now.toLocaleDateString(this.hass.locale?.language, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}</span
                >`
              : nothing}
          </div>`
        : nothing;
    const name = computeEntityName(
      this.hass,
      this.weatherEntity,
      this.config.name
    );

    return html`
      <div
        class="wfc-current-weather"
        style=${styleMap({
          "--wfc-datetime-weather-gap": `${datetimeWeatherGap}px`,
        })}
      >
        ${this.config.current?.datetime_position !== "bottom"
          ? datetimeHeader
          : nothing}
        <div class="wfc-current-conditions">
          <wfc-weather-condition-icon-provider
            .config=${this.config}
            .state=${state}
            .isNightTime=${isNightTime}
            .classes=${"wfc-current-icon"}
          ></wfc-weather-condition-icon-provider>
          <div class="wfc-name-state">
            <span class="wfc-current-state">
              ${this.hass.formatEntityState(this.weatherEntity)}
            </span>
            ${name
              ? html`<span class="wfc-name wfc-secondary">${name}</span>`
              : nothing}
          </div>
          <div class="wfc-current-primary-secondary">
            ${currentTemperature !== null
              ? html`
                  <div
                    class="wfc-current-temperature"
                    .actionHandler=${actionHandler({
                      stopPropagation: true,
                      hasHold: hasAction(
                        this.config.hold_action as ActionConfig
                      ),
                      hasDoubleClick: hasAction(
                        this.config.double_tap_action as ActionConfig
                      ),
                    })}
                    @action=${this.onAction}
                  >
                    ${currentTemperature}
                  </div>
                `
              : nothing}
            ${secondaryInfo
              ? html`
                  <div class="wfc-current-secondary-info">
                    ${secondaryInfo.stateObj
                      ? html`
                          <ha-state-icon
                            class="wfc-current-secondary-icon wfc-secondary"
                            .hass=${this.hass}
                            .stateObj=${secondaryInfo.stateObj}
                            .icon=${secondaryInfo.icon}
                          ></ha-state-icon>
                        `
                      : secondaryInfo.icon
                        ? html`
                            <ha-attribute-icon
                              class="wfc-current-secondary-icon wfc-secondary"
                              .hass=${this.hass}
                              .icon=${secondaryInfo.icon}
                            ></ha-attribute-icon>
                          `
                        : nothing}
                    <span class="wfc-current-secondary-value wfc-secondary"
                      >${secondaryInfo.value}</span
                    >
                  </div>
                `
              : nothing}
          </div>
        </div>
        ${sunPath !== nothing || hasAgenda
          ? html`<div
              class="wfc-sun-agenda-row ${this.config.current
                ?.agenda_position === "left"
                ? "wfc-agenda-left"
                : "wfc-agenda-right"}"
              style=${styleMap({ "--wfc-agenda-sun-gap": `${agendaSunGap}px` })}
            >
              ${this.config.current?.agenda_position === "left"
                ? this.renderAgenda(agenda)
                : nothing}
              ${sunPath}
              ${this.config.current?.agenda_position !== "left"
                ? this.renderAgenda(agenda)
                : nothing}
            </div>`
          : nothing}
        ${attributes.length > 0
          ? html`<wfc-current-weather-attributes
              .hass=${this.hass}
              .weatherEntity=${this.weatherEntity}
              .config=${this.config}
              .attributeConfigs=${attributes}
            ></wfc-current-weather-attributes>`
          : nothing}
        ${this.config.current?.datetime_position === "bottom"
          ? datetimeHeader
          : nothing}
      </div>
    `;
  }

  private getSunPath(): TemplateResult | typeof nothing {
    const suntimes = getSuntimesInfo(this.hass, this._now);
    if (
      !suntimes ||
      Number.isNaN(suntimes.sunrise.getTime()) ||
      Number.isNaN(suntimes.sunset.getTime())
    ) {
      return nothing;
    }
    const now = this._now.getTime();
    const daytime =
      now >= suntimes.sunrise.getTime() && now < suntimes.sunset.getTime();
    let arcStart = suntimes.sunrise;
    let arcEnd = suntimes.sunset;
    let leftCaption = "Sunrise";
    let rightCaption = "Sunset";
    let progress: number;
    if (daytime) {
      progress = (now - arcStart.getTime()) / (arcEnd.getTime() - arcStart.getTime());
    } else {
      const yesterday = new Date(this._now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(this._now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nightStart =
        now < suntimes.sunrise.getTime()
          ? getSuntimesInfo(this.hass, yesterday)?.sunset
          : suntimes.sunset;
      const nightEnd =
        now < suntimes.sunrise.getTime()
          ? suntimes.sunrise
          : getSuntimesInfo(this.hass, tomorrow)?.sunrise;
      if (!nightStart || !nightEnd || nightEnd <= nightStart) return nothing;
      arcStart = nightStart;
      arcEnd = nightEnd;
      leftCaption = "Sunset";
      rightCaption = "Sunrise";
      progress =
        (now - arcStart.getTime()) / (arcEnd.getTime() - arcStart.getTime());
    }
    progress = Math.max(0, Math.min(1, progress));
    const x = 20 + 200 * progress;
    const y = 28 - 72 * progress * (1 - progress);
    const moon = getMoonPhaseInfo(this.hass, this._now);
    const moonLit = moonLitPath(moon.fraction, moon.litRight);
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const leftTimeText = arcStart.toLocaleTimeString(
      this.hass.locale?.language,
      timeOptions
    );
    const rightTimeText = arcEnd.toLocaleTimeString(
      this.hass.locale?.language,
      timeOptions
    );
    return html`<div
      class="wfc-sun-path"
      aria-label="${leftCaption} ${leftTimeText}, ${rightCaption} ${rightTimeText}"
    >
      <svg
        class="wfc-sun-arc"
        viewBox="0 0 240 56"
        role="img"
        aria-hidden="true"
      >
        <path class="wfc-sun-arc-track" d="M20 28 Q120 -8 220 28" />
        <defs>
          <radialGradient id="wfc-sun-arc-sun-halo">
            <stop
              offset="0%"
              stop-color="var(--weather-forecast-card-sunrise-color, #ffb300)"
              stop-opacity="0.24"
            />
            <stop
              offset="45%"
              stop-color="var(--weather-forecast-card-sunrise-color, #ffb300)"
              stop-opacity="0.12"
            />
            <stop
              offset="100%"
              stop-color="var(--weather-forecast-card-sunrise-color, #ffb300)"
              stop-opacity="0"
            />
          </radialGradient>
          <filter
            id="wfc-sun-arc-ray-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          class="wfc-sun-arc-progress ${daytime ? "" : "wfc-sun-arc-progress-night"}"
          pathLength="100"
          stroke-dasharray="${progress * 100} 100"
          d="M20 28 Q120 -8 220 28"
        />
        ${daytime
          ? svg`<g
              class="wfc-sun-arc-sun"
              transform="translate(${x} ${y})"
            >
              <circle class="wfc-sun-arc-sun-glow" r="16" />
              <circle class="wfc-sun-arc-sun-disc" r="5.5" />
              <path
                class="wfc-sun-arc-sun-rays"
                filter="url(#wfc-sun-arc-ray-glow)"
                d="M0-8v-4M0 8v4M-8 0h-4M8 0h4M-5.7-5.7l-2.8-2.8M5.7 5.7l2.8 2.8M5.7-5.7l2.8-2.8M-5.7 5.7l-2.8 2.8"
              />
            </g>`
          : svg`<svg
              class="wfc-moon-arc-marker"
              x="${x - 7.2}"
              y="${y - 7.2}"
              width="14.4"
              height="14.4"
              viewBox="0 0 100 100"
            >
              <defs>
                <filter
                  id="wfc-moon-arc-gaussian-glow"
                  x="-150%"
                  y="-150%"
                  width="400%"
                  height="400%"
                >
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="18"
                    result="glow"
                  />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="${moonLit}"
                fill="#f7f8ff"
                filter="url(#wfc-moon-arc-gaussian-glow)"
              />
            </svg>`}
        <text class="wfc-sun-time-label" x="20" y="43" text-anchor="start">
          ${leftTimeText}
        </text>
        <text class="wfc-sun-caption-label" x="19" y="55.5" text-anchor="start">
          ${leftCaption}
        </text>
        <text class="wfc-sun-time-label" x="220" y="43" text-anchor="end">
          ${rightTimeText}
        </text>
        <text class="wfc-sun-caption-label" x="220" y="55.5" text-anchor="end">
          ${rightCaption}
        </text>
      </svg>
    </div>`;
  }

  private getAgendaItems(): Array<{
    title: string;
    time: string;
    day: string;
    timestamp: number;
  }> {
    const entities = this.config.current?.agenda_entities ?? [];
    const today = new Date(
      this._now.getFullYear(),
      this._now.getMonth(),
      this._now.getDate()
    );
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const end = new Date(tomorrow);
    end.setDate(end.getDate() + 1);
    return entities
      .flatMap((entityId) => {
        const eventEntity = this.hass.states[entityId];
        const attributes = eventEntity?.attributes;
        const startValue = attributes?.start_time ?? attributes?.start;
        const start =
          typeof startValue === "string" ? new Date(startValue) : undefined;
        if (
          !start ||
          Number.isNaN(start.getTime()) ||
          start < today ||
          start >= end
        )
          return [];
        const title =
          attributes?.message ?? attributes?.summary ?? attributes?.title;
        const message = typeof title === "string" ? title : entityId;
        return [
          {
            title: message,
            time: start.toLocaleTimeString(this.hass.locale?.language, {
              hour: "2-digit",
              minute: "2-digit",
            }),
            day: start < tomorrow ? "Today" : "Tomorrow",
            timestamp: start.getTime(),
          },
        ];
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  private renderAgenda(
    items: Array<{
      title: string;
      time: string;
      day: string;
      timestamp: number;
    }>
  ): TemplateResult | typeof nothing {
    const eventType = items.some((item) => item.day === "Today")
      ? "today"
      : items.some((item) => item.day === "Tomorrow")
        ? "tomorrow"
        : "none";
    const alertType =
      this.config.current?.agenda_alert === false || eventType === "none"
        ? ""
        : eventType;
    const iconSize = Math.max(
      16,
      Math.min(
        80,
        eventType === "today"
          ? (this.config.current?.agenda_icon_today_size ?? 40)
          : eventType === "tomorrow"
            ? (this.config.current?.agenda_icon_tomorrow_size ?? 40)
            : (this.config.current?.agenda_icon_no_event_size ?? 40)
      )
    );
    const textSize = Math.max(
      8,
      Math.min(
        32,
        eventType === "today"
          ? (this.config.current?.agenda_text_today_size ?? 14)
          : eventType === "tomorrow"
            ? (this.config.current?.agenda_text_tomorrow_size ?? 14)
            : (this.config.current?.agenda_text_no_event_size ?? 14)
      )
    );
    const alertScale =
      eventType === "today"
        ? Math.max(
            100,
            Math.min(150, this.config.current?.agenda_alert_today_size ?? 122)
          )
        : eventType === "tomorrow"
          ? Math.max(
              100,
              Math.min(
                150,
                this.config.current?.agenda_alert_tomorrow_size ?? 110
              )
            )
          : 100;
    const alertSpeed =
      eventType === "today"
        ? Math.max(
            1,
            Math.min(12, this.config.current?.agenda_alert_today_speed ?? 3.2)
          )
        : Math.max(
            1,
            Math.min(
              12,
              this.config.current?.agenda_alert_tomorrow_speed ?? 5.2
            )
          );
    const alertClass = alertType ? `wfc-agenda-alert-${alertType}` : "";
    const iconClass = alertType ? `wfc-agenda-icon-alert-${alertType}` : "";
    return html`<div
      class="wfc-agenda ${alertClass}"
      role="button"
      tabindex="0"
      .actionHandler=${actionHandler({})}
      @action=${this.onAgendaAction}
      @pointerdown=${this.stopAgendaPropagation}
      @click=${this.stopAgendaPropagation}
      @contextmenu=${this.stopAgendaPropagation}
      style=${styleMap({
        "--wfc-agenda-icon-size": `${iconSize}px`,
        "--wfc-agenda-alert-scale": `${alertScale / 100}`,
        "--wfc-agenda-alert-speed": `${alertSpeed}s`,
        "--wfc-agenda-text-size": `${textSize}px`,
      })}
      aria-label="Upcoming calendar events. Tap to open the calendar."
    >
      <svg
        class="wfc-agenda-icon ${iconClass}"
        style=${styleMap({
          "--wfc-agenda-alert-scale": `${alertScale / 100}`,
          "--wfc-agenda-alert-speed": `${alertSpeed}s`,
        })}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="2.5" y="4" width="19" height="17.5" rx="2" />
        <path d="M7 2v4M17 2v4M3 8.5h18M7 12.5h2m4 0h2m-8 4h2m4 0h2" />
      </svg>
      <div class="wfc-agenda-items">
        ${items.length
          ? items
              .slice(0, 3)
              .map(
                (item) =>
                  html`<div class="wfc-agenda-item">
                    <span class="wfc-agenda-time"
                      >${item.day} · ${item.time}</span
                    ><span class="wfc-agenda-title">${item.title}</span>
                  </div>`
              )
          : html`<span class="wfc-agenda-empty"
              >No events today or tomorrow</span
            >`}
      </div>
    </div>`;
  }

  private isNightTime(): boolean {
    const suntimesInfo = getSuntimesInfo(this.hass, new Date());

    return this.config.forecast?.show_sun_times && suntimesInfo
      ? suntimesInfo.isNightTime
      : false;
  }

  private getConfiguredAttributes(): NormalizedAttributeConfig[] {
    const showAttr = this.config.current?.show_attributes;

    if (showAttr === undefined || showAttr === null) {
      return [];
    }

    // Handle boolean: true means all attributes, false means none
    if (typeof showAttr === "boolean") {
      return showAttr
        ? CURRENT_WEATHER_ATTRIBUTES.map((name) => ({ name }))
        : [];
    }

    // Handle single string: "humidity"
    if (typeof showAttr === "string") {
      return [{ name: showAttr as CurrentWeatherAttributes }];
    }

    // Handle single object: { name: "humidity", entity: "sensor.my_humidity" }
    if (!Array.isArray(showAttr) && typeof showAttr === "object") {
      return showAttr.name || showAttr.entity
        ? [showAttr as CurrentWeatherAttributeConfig]
        : [];
    }

    // Handle array: mixed strings and objects. The editor inserts a null
    // placeholder when a new list item is added, so drop null/empty entries.
    // Keep any item that identifies a value source: a name (weather attribute)
    // or an entity (arbitrary custom attribute).
    if (Array.isArray(showAttr)) {
      return showAttr
        .filter((item) => item != null)
        .map((item) =>
          typeof item === "string"
            ? { name: item as CurrentWeatherAttributes }
            : (item as CurrentWeatherAttributeConfig)
        )
        .filter((item) => Boolean(item.name) || Boolean(item.entity));
    }

    return [];
  }

  private onAction = (event: ActionHandlerEvent): void => {
    const temperatureEntity = this.config.current?.temperature_entity;
    const config = temperatureEntity
      ? {
          ...this.config,
          entity: temperatureEntity,
        }
      : this.config;

    handleAction(this, this.hass!, config, event.detail.action);
  };

  private onAgendaAction = (event: ActionHandlerEvent): void => {
    event.stopPropagation();
    handleAction(
      this,
      this.hass,
      {
        ...this.config,
        tap_action: this.config.current?.agenda_tap_action,
      },
      event.detail.action
    );
  };

  private stopAgendaPropagation = (event: Event): void => {
    event.stopPropagation();
  };

  private getTemperature(): string | null {
    const temperatureEntity = this.config.current?.temperature_entity;
    if (temperatureEntity) {
      const tempEntity = this.hass.states[temperatureEntity];
      if (tempEntity) {
        return formatTemperature(
          this.hass,
          this.weatherEntity,
          tempEntity.state,
          this.config.current?.temperature_precision
        );
      }
    }

    if (this.weatherEntity.attributes.temperature != null) {
      return formatTemperature(
        this.hass,
        this.weatherEntity,
        this.weatherEntity.attributes.temperature,
        this.config.current?.temperature_precision
      );
    }

    return null;
  }

  private getSecondaryWeatherAttribute(): SecondaryInfo | null {
    const forecast = this.hourlyForecast;

    const rawSecondaryInfoAttribute =
      this.config.current?.secondary_info_attribute;

    if (rawSecondaryInfoAttribute) {
      // Normalize to object form
      const secondaryAttr =
        typeof rawSecondaryInfoAttribute === "string"
          ? { name: rawSecondaryInfoAttribute as CurrentWeatherAttributes }
          : rawSecondaryInfoAttribute;

      const {
        name,
        entity: customEntityId,
        icon: explicitIcon,
      } = secondaryAttr;

      if (customEntityId) {
        // Custom entity path: skip the in-attributes check
        const value = formatCustomEntityAttributeValue(
          this.hass,
          this.weatherEntity,
          this.config,
          name,
          customEntityId
        );

        if (value != null) {
          const customEntity = this.hass.states[customEntityId];

          if (!name) {
            // Entity-only: let ha-state-icon resolve the entity's own icon.
            return { stateObj: customEntity, icon: explicitIcon, value };
          }

          const icon =
            explicitIcon ??
            customEntity?.attributes?.icon ??
            (EXTENDED_WEATHER_ATTRIBUTE_ICON_MAP as Record<string, string>)[
              name
            ];

          return { icon, value };
        }
      } else if (name && name in this.weatherEntity.attributes) {
        // Weather entity path: existing behavior
        const nameAsKnown = name as CurrentWeatherAttributes;
        const weatherAttrIcon =
          EXTENDED_WEATHER_ATTRIBUTE_ICON_MAP[nameAsKnown];

        const value = formatWeatherEntityAttributeValue(
          this.hass,
          this.weatherEntity,
          this.config,
          name
        );

        if (value != null) {
          const icon = explicitIcon ?? weatherAttrIcon;
          return { icon, value };
        }
      }
    }

    const extrema = this.getTemperatureExtrema();

    if (extrema) {
      return {
        value: `${extrema.high} / ${extrema.low}`,
      };
    }

    let value: number;
    let attribute: ExtendedCurrentWeatherAttribute;

    if (forecast && forecast.length && forecast[0]?.precipitation != null) {
      value = forecast[0].precipitation!;
      attribute = "precipitation";
    } else if ("humidity" in this.weatherEntity.attributes) {
      value = this.weatherEntity.attributes.humidity!;
      attribute = "humidity";
    } else {
      return null;
    }

    const weatherAttrIcon = EXTENDED_WEATHER_ATTRIBUTE_ICON_MAP[attribute];

    return {
      icon: weatherAttrIcon,
      value: this.hass.formatEntityAttributeValue(
        this.weatherEntity,
        attribute,
        value
      ),
    };
  }

  private getTemperatureExtrema(): TemperatureExtrema | null {
    if (!this.hourlyForecast?.length || !this.dailyForecast?.length) {
      return null;
    }

    const todayTimestamp = normalizeDate(new Date().toISOString());

    let minTemp =
      this.dailyForecast[0]?.templow ??
      this.dailyForecast[0]?.temperature ??
      Infinity;
    let maxTemp = this.dailyForecast[0]?.temperature ?? -Infinity;

    for (const entry of this.hourlyForecast) {
      if (normalizeDate(entry.datetime) === todayTimestamp) {
        const low = entry.templow ?? entry.temperature;
        const high = entry.temperature;

        if (low != null && low < minTemp) {
          minTemp = low;
        }

        if (high != null && high > maxTemp) {
          maxTemp = high;
        }
      }
    }

    if (minTemp === Infinity || maxTemp === -Infinity) {
      return null;
    }

    return {
      high: formatTemperature(
        this.hass,
        this.weatherEntity,
        maxTemp,
        this.config.current?.temperature_precision
      ),
      low: formatTemperature(
        this.hass,
        this.weatherEntity,
        minTemp,
        this.config.current?.temperature_precision
      ),
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wfc-current-weather": WfcCurrentWeather;
  }
}
