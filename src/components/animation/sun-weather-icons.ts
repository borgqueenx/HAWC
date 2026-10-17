/*
 * SVG weather icons adapted from Sun Weather Card by korova-sq.
 * Source: https://github.com/korova-sq/sun-weather-card/blob/main/sun-weather-card.js
 * Copyright (c) 2026 korova-sq. Licensed under the MIT License.
 * See THIRD_PARTY_NOTICES.md for the required license notice.
 */
class SunWeatherIcons {
  private cloudPath(): string {
    return "M5 18a3.6 3.6 0 0 1 .4-7.18A5 5 0 0 1 15.4 9.4a3.4 3.4 0 0 1 -.4 8.6H5z";
  }

  icon(condition: string, size: number, animated: boolean): string {
    const map: Record<string, () => string> = {
      sunny: () => this._iconSunny(size),
      "clear-night": () => this._iconClearNight(size),
      partlycloudy: () => this._iconPartlyCloudy(size),
      "partlycloudy-night": () => this._iconPartlyCloudyNight(size),
      cloudy: () => this._iconCloudy(size),
      fog: () => this._iconFog(size),
      windy: () => this._iconWindy(size),
      "windy-variant": () => this._iconWindy(size),
      rainy: () => this._iconRain(size, 3),
      pouring: () => this._iconRain(size, 5),
      hail: () => this._iconHail(size),
      snowy: () => this._iconSnow(size),
      "snowy-rainy": () => this._iconSnow(size),
      lightning: () => this._iconLightning(size, false),
      "lightning-rainy": () => this._iconLightning(size, true),
      exceptional: () => this._iconExceptional(size),
    };
    const fn = map[condition] || map.cloudy;
    let svg = fn();
    // se le animazioni sono disattivate, rimuovi i tag SMIL (icone statiche)
    if (!animated) {
      svg = svg
        .replace(/<animateTransform\b[^>]*\/>/g, "")
        .replace(/<animate\b[^>]*\/>/g, "");
      // gli elementi animati in opacita' partono invisibili (opacity="0"):
      // senza animazione resterebbero nascosti, quindi li rendo visibili.
      // Le opacita' parziali (0.3, 0.7...) sono scelte estetiche: non si toccano.
      svg = svg.replace(/opacity="0"/g, 'opacity="1"');
    }
    return svg;
  }

  private _iconSunny(size: number): string {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <g stroke="#ffb703" stroke-width="1.6" stroke-linecap="round">
          <g>
            <line x1="12" y1="1" x2="12" y2="4"/>
            <line x1="12" y1="20" x2="12" y2="23"/>
            <line x1="1" y1="12" x2="4" y2="12"/>
            <line x1="20" y1="12" x2="23" y2="12"/>
            <line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/>
            <line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/>
            <line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/>
            <line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/>
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="24s" repeatCount="indefinite"/>
          </g>
        </g>
        <circle cx="12" cy="12" r="5" fill="#ffb703"/>
      </svg>
    `;
  }

  private _iconClearNight(size: number): string {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="M15 3a9 9 0 1 0 6 15.9A9 9 0 0 1 15 3z" fill="#a9b6d6"/>
        <circle cx="6" cy="6" r="0.9" fill="#fff">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="9" cy="4" r="0.7" fill="#fff">
          <animate attributeName="opacity" values="1;0.2;1" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="4" cy="10" r="0.6" fill="#fff">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;
  }

  private _iconPartlyCloudy(size: number): string {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <g>
          <g stroke="#ffb703" stroke-width="1.3" stroke-linecap="round">
            <line x1="8" y1="1.5" x2="8" y2="3.5"/>
            <line x1="1.5" y1="8" x2="3.5" y2="8"/>
            <line x1="3.4" y1="3.4" x2="4.8" y2="4.8"/>
            <line x1="12.6" y1="3.4" x2="11.2" y2="4.8"/>
            <line x1="12.5" y1="8" x2="14.5" y2="8"/>
            <line x1="8" y1="12.5" x2="8" y2="14.5"/>
            <line x1="3.4" y1="12.6" x2="4.8" y2="11.2"/>
            <line x1="12.6" y1="12.6" x2="11.2" y2="11.2"/>
            <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="28s" repeatCount="indefinite"/>
          </g>
          <circle cx="8" cy="8" r="3.4" fill="#ffb703"/>
        </g>
        <g>
          <path d="${this.cloudPath()}" fill="#b8c2d0" transform="translate(3,4)"/>
          <animateTransform attributeName="transform" type="translate" values="-1 0;1 0;-1 0" dur="6s" repeatCount="indefinite"/>
        </g>
      </svg>
    `;
  }

  private _iconPartlyCloudyNight(size: number): string {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <g>
          <path d="M15 3a9 9 0 1 0 6 15.9A9 9 0 0 1 15 3z" fill="#a9b6d6" transform="translate(1.3 1.4) scale(0.5)"/>
        </g>
        <g>
          <path d="${this.cloudPath()}" fill="#b8c2d0" transform="translate(3,4)"/>
          <animateTransform attributeName="transform" type="translate" values="-1 0;1 0;-1 0" dur="6s" repeatCount="indefinite"/>
        </g>
      </svg>
    `;
  }

  private _iconCloudy(size: number): string {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <g>
          <path d="${this.cloudPath()}" fill="#9aa7b8" transform="translate(-3,-2) scale(0.85)"/>
          <animateTransform attributeName="transform" type="translate" values="-1 0;0.5 0;-1 0" dur="7s" repeatCount="indefinite"/>
        </g>
        <g>
          <path d="${this.cloudPath()}" fill="#c3cbd6"/>
          <animateTransform attributeName="transform" type="translate" values="0.5 0;-1 0;0.5 0" dur="5s" repeatCount="indefinite"/>
        </g>
      </svg>
    `;
  }

  private _iconFog(size: number): string {
    const lines = [7, 11, 15, 19]
      .map(
        (y, i) => `
      <line x1="2" y1="${y}" x2="22" y2="${y}" stroke="#9aa7b8" stroke-width="1.8" stroke-linecap="round">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="${3 + i * 0.4}s" repeatCount="indefinite"/>
      </line>
    `
      )
      .join("");
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${lines}</svg>`;
  }

  private _iconWindy(size: number): string {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="M2 8h13a2.5 2.5 0 1 0 -2.4-3.2" fill="none" stroke="#9aa7b8" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M2 13h17a2.5 2.5 0 1 1 -2.4 3.2" fill="none" stroke="#b8c2d0" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="2" y1="19" x2="14" y2="19" stroke="#c3cbd6" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    `;
  }

  private _iconRain(size: number, drops: number): string {
    const lines = Array.from({ length: drops })
      .map((_, i) => {
        const x = 6 + i * (14 / (drops - 1 || 1));
        const delay = (i * 0.25).toFixed(2);
        return `
        <line x1="${x}" y1="13" x2="${x - 1.5}" y2="18" stroke="#4d9de0" stroke-width="1.6" stroke-linecap="round" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="1s" begin="${delay}s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0 -3;0 3" dur="1s" begin="${delay}s" repeatCount="indefinite"/>
        </line>
      `;
      })
      .join("");
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="${this.cloudPath()}" fill="#9aa7b8" transform="translate(0,-3)"/>
        ${lines}
      </svg>
    `;
  }

  private _iconHail(size: number): string {
    const dots = [7, 11, 15]
      .map(
        (x, i) => `
      <circle cx="${x}" cy="14" r="1.3" fill="#a9c4e0" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="1.1s" begin="${i * 0.3}s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 -2;0 5" dur="1.1s" begin="${i * 0.3}s" repeatCount="indefinite"/>
      </circle>
    `
      )
      .join("");
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="${this.cloudPath()}" fill="#9aa7b8" transform="translate(0,-3)"/>
        ${dots}
      </svg>
    `;
  }

  private _iconSnow(size: number): string {
    const flakes = [6, 11, 16]
      .map(
        (x, i) => `
      <circle cx="${x}" cy="13" r="1.2" fill="#e3ecf7" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="${i * 0.5}s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 -2;2 6" dur="2.2s" begin="${i * 0.5}s" repeatCount="indefinite"/>
      </circle>
    `
      )
      .join("");
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="${this.cloudPath()}" fill="#b8c2d0" transform="translate(0,-3)"/>
        ${flakes}
      </svg>
    `;
  }

  private _iconLightning(size: number, withRain: boolean): string {
    const rain = withRain
      ? `
      <line x1="7" y1="14" x2="5.5" y2="18" stroke="#4d9de0" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>
    `
      : "";
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="${this.cloudPath()}" fill="#8b96a8" transform="translate(0,-3)"/>
        ${rain}
        <path d="M13 12l-4 6h3l-1 4 5-7h-3z" fill="#ffd23f" opacity="0.3">
          <animate attributeName="opacity" values="0.3;1;0.3;0.3;1;0.3" dur="2.4s" repeatCount="indefinite"/>
        </path>
      </svg>
    `;
  }

  private _iconExceptional(size: number): string {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="M12 2 L22 20 L2 20 Z" fill="none" stroke="#e8590c" stroke-width="1.6" stroke-linejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="14" stroke="#e8590c" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="12" cy="17" r="1" fill="#e8590c"/>
      </svg>
    `;
  }
}

const iconFactory = new SunWeatherIcons();

export const renderSunWeatherIcon = (
  condition: string,
  size: number,
  animated = true
): string => iconFactory.icon(condition, size, animated);
