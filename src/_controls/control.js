/**
 * @template C
 */
export class Control {
  /**
   * @param {HTMLElement} target
   * @returns {void}
   */
  addTo(target) {
    target.appendChild(this.onAdd());
  }

  /**
   * @param {HTMLElement} target
   * @returns {void}
   */
  prependTo(target) {
    target.prepend(this.onAdd());
  }

  /**
   * @returns {void}
   */
  remove() {
    this.onRemove();
  }

  /**
   * @abstract
   * @param {C} config
   * @returns {void}
   */
  setConfig(config) {
    throw new Error('Not implemented');
  }

  /**
   * @abstract
   * @returns {HTMLElement}
   */
  onAdd() {
    throw new Error('Not implemented');
  }

  /**
   * @abstract
   * @return {void}
   */
  onRemove() {
    throw new Error('Not implemented');
  }
}