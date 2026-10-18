import { describe, expect, it } from "vitest";
import { WeatherForecastCard } from "../src/weather-forecast-card";
import { ForecastMode, WeatherForecastCardConfig } from "../src/types";

import "../src/index";

function createCard(
  config: Partial<WeatherForecastCardConfig> = {}
): WeatherForecastCard {
  const card = document.createElement(
    "hawc-card"
  ) as WeatherForecastCard;

  card.setConfig({
    type: "custom:hawc-card",
    entity: "weather.demo",
    ...config,
  } as WeatherForecastCardConfig);

  return card;
}

describe("weather-forecast-card grid options", () => {
  it("reports columns and leaves row sizing to the content in Sections view", () => {
    const options = createCard().getGridOptions();

    expect(options.columns).toBe(12);
    expect(options.rows).toBeUndefined();
    expect(options.min_rows).toBeUndefined();
  });

  it("does not force row counts for different card layouts", () => {
    const configs: Partial<WeatherForecastCardConfig>[] = [
      {},
      { show_current: false },
      { show_forecast: false },
      { forecast: { mode: ForecastMode.Chart } },
      { current: { show_attributes: true } },
    ];

    for (const config of configs) {
      const options = createCard(config).getGridOptions();
      expect(options.rows).toBeUndefined();
      expect(options.min_rows).toBeUndefined();
    }
  });

  it("estimates a larger masonry size for chart mode than simple mode", () => {
    const simple = createCard({
      forecast: { mode: ForecastMode.Simple },
    }).getCardSize();
    const chart = createCard({
      forecast: { mode: ForecastMode.Chart },
    }).getCardSize();

    expect(chart).toBeGreaterThan(simple);
  });

  it("reserves extra height when current attributes are shown", () => {
    const without = createCard({
      current: { show_attributes: false },
    }).getCardSize();
    const withAttrs = createCard({
      current: { show_attributes: true },
    }).getCardSize();

    expect(withAttrs).toBeGreaterThan(without);
  });

  it("reduces masonry size when either card block is hidden", () => {
    const both = createCard().getCardSize();
    const currentOnly = createCard({ show_forecast: false }).getCardSize();
    const forecastOnly = createCard({ show_current: false }).getCardSize();

    expect(currentOnly).toBeLessThan(both);
    expect(forecastOnly).toBeLessThan(both);
  });

  it("widens the minimum columns only when both blocks are shown", () => {
    expect(createCard().getGridOptions().min_columns).toBe(6);
    expect(
      createCard({ show_forecast: false }).getGridOptions().min_columns
    ).toBe(4);
    expect(
      createCard({ show_current: false }).getGridOptions().min_columns
    ).toBe(4);
  });

  it("exposes a positive integer masonry card size", () => {
    const card = createCard();
    const size = card.getCardSize();

    expect(Number.isInteger(size)).toBe(true);
    expect(size).toBeGreaterThan(0);
  });
});
