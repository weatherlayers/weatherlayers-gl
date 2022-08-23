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