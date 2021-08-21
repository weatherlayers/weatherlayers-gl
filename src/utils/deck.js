/*
 * Copyright (c) 2021 WeatherLayers.com
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * @param {any} deckgl
 * @param {number} [fps]
 * @returns {(redrawReason: string) => void}
 */
export function throttledAnimateRender(deckgl, fps = 30) {
  const fpsInterval = 1000 / fps;
  let lastRenderTime = 0;

  return function (redrawReason) {
    if (redrawReason !== 'Deck._animate') {
      deckgl._drawLayers(redrawReason);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastRenderTime;
    if (elapsed > fpsInterval) {
      lastRenderTime = now;
      deckgl._drawLayers(redrawReason);
    }
  };
}