import { describe, expect, it } from "vitest";
import { fixture } from "@open-wc/testing";
import { html } from "lit";
import { MockHass } from "./mocks/hass";
import { ExtendedHomeAssistant } from "../src/types";
import { WfcWindIndicator } from "../src/components/wfc-wind-indicator";
import { ForecastAttribute, WeatherEntity } from "../src/data/weather";

import "../src/components/wfc-wind-indicator";

describe("wfc-wind-indicator", () => {
  describe("rendering", () => {
    it("should render nothing when hass is not provided", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: 180,
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${null}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector("svg")).toBeNull();
    });

    it("should render nothing when forecast is not provided", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${null}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector("svg")).toBeNull();
    });

    it("should render nothing when weatherEntity is not provided", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: 180,
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${null}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector("svg")).toBeNull();
    });

    it("should render a wind flag and speed label for valid data", async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 180,
      });

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.querySelector(".wfc-wind-flag-mast")).not.toBeNull();
      expect(svg?.querySelector(".wfc-wind-flag-cloth")).not.toBeNull();
      expect(svg?.querySelector(".wfc-wind-speed")).not.toBeNull();
    });

    it("should display wind speed in a centered label", async () => {
      const element = await createFixture({
        windSpeed: 15.7,
        windBearing: 90,
      });

      const text = element.shadowRoot?.querySelector(".wfc-wind-speed");
      expect(text?.textContent).toBe("57km/h"); // rounded
      expect(text?.querySelector(".wfc-wind-speed-unit")?.textContent).toBe("km/h");
      expect(text?.getAttribute("x")).toBe("24");
    });

    it("should handle zero wind speed", async () => {
      const element = await createFixture({
        windSpeed: 0,
        windBearing: 0,
      });

      const text = element.shadowRoot?.querySelector(".wfc-wind-speed");
      expect(text?.textContent).toBe("0km/h");
    });

    it("should set aria-label with wind data", async () => {
      const element = await createFixture({
        windSpeed: 12,
        windBearing: 270,
      });

      const indicator = element.shadowRoot?.querySelector(".wfc-wind-indicator");
      expect(indicator?.getAttribute("aria-label")).toBe(
        "Wind speed: 43 km/h, bearing from 270 degrees"
      );
    });

    it("should render with default values when wind_speed is undefined", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_bearing: 90,
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg).not.toBeNull();
      const text = element.shadowRoot?.querySelector(".wfc-wind-speed");
      expect(text?.textContent).toBe("0km/h"); // defaults to 0
    });

    it("should render with default values when wind_bearing is undefined", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 5,
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg).not.toBeNull();
      const group = element.shadowRoot?.querySelector("g g");
      expect(group?.getAttribute("transform")).toContain("rotate(0");
    });

    it("should render with default values when both wind properties are undefined", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {} as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg).not.toBeNull();
      const text = element.shadowRoot?.querySelector(".wfc-wind-speed");
      expect(text?.textContent).toBe("0km/h");
      const group = element.shadowRoot?.querySelector("g g");
      expect(group?.getAttribute("transform")).toContain("rotate(90");
    });
  });

  describe("wind bearing rotation", () => {
    it("should apply correct rotation transform for north (0 degrees)", async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 0,
      });

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(-90");
    });

    it("should apply correct rotation transform for east (90 degrees)", async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 90,
      });

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(0");
    });

    it("should apply correct rotation transform for south (180 degrees)", async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 180,
      });

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(90");
    });

    it("should apply correct rotation transform for west (270 degrees)", async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 270,
      });

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(180");
    });
  });

  describe("type: bearing vs direction", () => {
    it('should use bearing as-is when type is "bearing"', async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 45,
        type: "bearing",
      });

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(-45");
    });

    it('should add 180 degrees when type is "direction"', async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 45,
        type: "direction",
      });

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      // 45 + 180 = 225
      expect(transform).toContain("rotate(135");
    });

    it('should wrap around 360 when type is "direction" and bearing + 180 > 360', async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 270,
        type: "direction",
      });

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      // (270 + 180) % 360 = 90
      expect(transform).toContain("rotate(0");
    });

    it('should use original bearing in aria-label when type is "bearing"', async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 45,
        type: "bearing",
      });

      const indicator = element.shadowRoot?.querySelector(".wfc-wind-indicator");
      expect(indicator?.getAttribute("aria-label")).toBe(
        "Wind speed: 36 km/h, bearing from 45 degrees"
      );
    });

    it('should use computed bearing in aria-label when type is "direction"', async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 45,
        type: "direction",
      });

      const indicator = element.shadowRoot?.querySelector(".wfc-wind-indicator");
      // 45 + 180 = 225
      expect(indicator?.getAttribute("aria-label")).toBe(
        "Wind speed: 36 km/h, blowing toward 225 degrees"
      );
    });

    it('should use wrapped bearing in aria-label when type is "direction" and wraps', async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 270,
        type: "direction",
      });

      const indicator = element.shadowRoot?.querySelector(".wfc-wind-indicator");
      // (270 + 180) % 360 = 90
      expect(indicator?.getAttribute("aria-label")).toBe(
        "Wind speed: 36 km/h, blowing toward 90 degrees"
      );
    });
  });

  describe("wind flag colors", () => {
    it("should use the same red and white stripes at every wind speed", async () => {
      const expectedColors = [
        "#ff9e91",
        "#ffffff",
        "#ff9e91",
        "#ffffff",
        "#ff9e91",
      ];

      for (const windSpeed of [1 / 3.6, 25 / 3.6, 40 / 3.6]) {
        const element = await createFixture({ windSpeed, windBearing: 0 });
        const stripes = element.shadowRoot?.querySelectorAll(
          "#wfc-wind-stripes rect"
        );

        expect(Array.from(stripes ?? [], (stripe) => stripe.getAttribute("fill")))
          .toEqual(expectedColors);
      }
    });

    it("should keep the mast the same neutral color at every wind speed", async () => {
      for (const windSpeed of [1 / 3.6, 25 / 3.6, 40 / 3.6]) {
        const element = await createFixture({ windSpeed, windBearing: 0 });
        const mast = element.shadowRoot?.querySelector<SVGPathElement>(
          ".wfc-wind-flag-mast"
        );

        expect(mast?.getAttribute("stroke")).toBe("#c6cbd1");
      }
    });
  });

  describe("cardinal wind bearing", () => {
    it("should handle cardinal direction 'N' (0 degrees)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "N",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(-90");
    });

    it("should handle cardinal direction 'E' (90 degrees)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "E",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(0");
    });

    it("should handle cardinal direction 'S' (180 degrees)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "S",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(90");
    });

    it("should handle cardinal direction 'W' (270 degrees)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "W",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(180");
    });

    it("should handle intercardinal direction 'NE' (45 degrees)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "NE",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(-45");
    });

    it("should handle intercardinal direction 'SE' (135 degrees)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "SE",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(45");
    });

    it("should handle intercardinal direction 'SW' (225 degrees)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "SW",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(135");
    });

    it("should handle intercardinal direction 'NW' (315 degrees)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "NW",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(225");
    });

    it("should handle lowercase cardinal directions (case-insensitive)", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "ne",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(-45");
    });

    it("should handle numeric string wind bearings", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "180",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(90");
    });

    it("should handle decimal numeric string wind bearings", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "45.5",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const group = element.shadowRoot?.querySelector("g g");
      const transform = group?.getAttribute("transform");
      expect(transform).toContain("rotate(-44.5");
    });

    it("should render a static flag for invalid cardinal direction strings", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "INVALID",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg).not.toBeNull();
      const polygon = element.shadowRoot?.querySelector(".wfc-wind-flag-cloth");
      expect(polygon).not.toBeNull();
      const indicator = element.shadowRoot?.querySelector(".wfc-wind-indicator");
      expect(indicator?.getAttribute("aria-label")).toBe("Wind speed: 36 km/h");
    });

    it("should render a static flag for empty string wind bearing", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg).not.toBeNull();
      const polygon = element.shadowRoot?.querySelector(".wfc-wind-flag-cloth");
      expect(polygon).not.toBeNull();
      const indicator = element.shadowRoot?.querySelector(".wfc-wind-indicator");
      expect(indicator?.getAttribute("aria-label")).toBe("Wind speed: 36 km/h");
    });

    it("should render a static flag for NaN numeric string wind bearing", async () => {
      const mockHass = new MockHass();
      const hass = mockHass.getHass() as ExtendedHomeAssistant;
      const weatherEntity = hass.states["weather.demo"];
      const forecast: ForecastAttribute = {
        wind_speed: 10,
        wind_bearing: "not-a-number",
      } as ForecastAttribute;

      const element = await fixture<WfcWindIndicator>(
        html`<wfc-wind-indicator
          .hass=${hass}
          .weatherEntity=${weatherEntity}
          .forecast=${forecast}
        ></wfc-wind-indicator>`
      );
      await element.updateComplete;

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg).not.toBeNull();
      const polygon = element.shadowRoot?.querySelector(".wfc-wind-flag-cloth");
      expect(polygon).not.toBeNull();
      const indicator = element.shadowRoot?.querySelector(".wfc-wind-indicator");
      expect(indicator?.getAttribute("aria-label")).toBe("Wind speed: 36 km/h");
    });
  });

  describe("custom sizing", () => {
    it("should use default size of 35", async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 0,
      });

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg?.getAttribute("width")).toBe("35");
      expect(svg?.getAttribute("height")).toBe("35");
    });

    it("should accept custom size", async () => {
      const element = await createFixture({
        windSpeed: 10,
        windBearing: 0,
        size: 50,
      });

      const svg = element.shadowRoot?.querySelector("svg");
      expect(svg?.getAttribute("width")).toBe("50");
      expect(svg?.getAttribute("height")).toBe("50");
    });

    it("should use fixed flag geometry with a square mast edge and rounded tip", async () => {
      const element = await createFixture({ windSpeed: 10, windBearing: 0 });
      const svg = element.shadowRoot?.querySelector("svg");
      const mast = element.shadowRoot?.querySelector<SVGPathElement>(".wfc-wind-flag-mast");
      const cloth = element.shadowRoot?.querySelector<SVGPathElement>(".wfc-wind-flag-cloth");

      expect(svg?.getAttribute("viewBox")).toBe("0 0 48 48");
      expect(mast?.getAttribute("d")).toBe("M8 3v26");
      expect(cloth?.getAttribute("d")).toContain("Q46 8 46 12");
    });
  });
});

interface CreateFixtureOptions {
  hass?: ExtendedHomeAssistant;
  weatherEntity?: WeatherEntity;
  forecast?: ForecastAttribute;
  windSpeed: number;
  windBearing: number;
  size?: number;
  type?: "bearing" | "direction";
}

const createFixture = async (options: CreateFixtureOptions) => {
  const mockHass = new MockHass();
  const hass = options.hass ?? (mockHass.getHass() as ExtendedHomeAssistant);
  const weatherEntity = options.weatherEntity ?? hass.states["weather.demo"];
  const forecast: ForecastAttribute =
    options.forecast ??
    ({
      wind_speed: options.windSpeed,
      wind_bearing: options.windBearing,
    } as ForecastAttribute);

  const element = await fixture<WfcWindIndicator>(
    html`<wfc-wind-indicator
      .hass=${hass}
      .weatherEntity=${weatherEntity}
      .forecast=${forecast}
      .type=${options.type ?? "bearing"}
    ></wfc-wind-indicator>`
  );

  // Only override defaults if explicitly provided
  if (options.size !== undefined) element.size = options.size;

  await element.updateComplete;

  return element;
};
