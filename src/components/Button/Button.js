/**
 * @file Button component. DS §9.
 * Variants: primary | secondary | ghost | outline | icon | fab | destructive.
 * States: default | hover | focus | active | disabled | loading.
 */

import { Component } from '../Component.js';
import { createElement } from '../../utils/dom.js';

/**
 * @typedef {'primary'|'secondary'|'ghost'|'outline'|'icon'|'fab'|'destructive'} ButtonVariant
 * @typedef {'sm'|'md'|'lg'} ButtonSize
 */

/**
 * @typedef {object} ButtonProps
 * @property {string} [label]           Visible text (omit for icon-only).
 * @property {ButtonVariant} [variant]  Visual variant. Default 'primary'.
 * @property {ButtonSize} [size]        Default 'md'.
 * @property {boolean} [loading]        Shows spinner, disables interaction.
 * @property {boolean} [disabled]
 * @property {HTMLElement} [icon]       Optional leading icon element.
 * @property {string} [ariaLabel]       Required for icon-only buttons.
 * @property {(e: MouseEvent) => void} [onClick]
 * @property {'button'|'submit'} [type] Default 'button'.
 */

export class Button extends Component {
  /** @param {ButtonProps} props */
  constructor(props) { super(props); }

  /** @returns {HTMLElement} */
  render() {
    const {
      label, variant = 'primary', size = 'md', loading = false,
      disabled = false, icon, ariaLabel, onClick, type = 'button',
    } = this.props;

    const iconOnly = variant === 'icon' || variant === 'fab' || (!label && !!icon);
    const attrs = { type };
    if (ariaLabel || iconOnly) attrs['aria-label'] = ariaLabel ?? label ?? '';
    if (loading) attrs['aria-busy'] = 'true';

    const btn = createElement('button', {
      className: `ui-btn ui-btn--${variant} ui-btn--${size}`,
      attrs,
    });
    if (disabled || loading) btn.disabled = true;

    if (loading) {
      btn.append(createElement('span', { className: 'ui-btn__spinner', attrs: { 'aria-hidden': 'true' } }));
    } else if (icon) {
      icon.classList.add('ui-btn__icon');
      icon.setAttribute('aria-hidden', 'true');
      btn.append(icon);
    }
    if (label && !iconOnly) btn.append(createElement('span', { className: 'ui-btn__label', text: label }));

    if (onClick) this.on(btn, 'click', (e) => { if (!btn.disabled) onClick(/** @type {MouseEvent} */ (e)); });
    return btn;
  }
}