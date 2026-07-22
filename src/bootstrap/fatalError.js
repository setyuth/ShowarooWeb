/**
 * @file Minimal fatal-error fallback UI.
 *
 * Rendered only when boot cannot complete. Uses plain DOM + inline-safe styles
 * (design tokens may not be loaded yet) and textContent only. Never exposes raw
 * error details to end users, per the design system's error-state rules.
 */

/**
 * @param {HTMLElement | null} mount
 * @returns {void}
 */
export function renderFatalError(mount) {
  const target = mount ?? document.body;
  if (!target) return;

  const wrap = document.createElement('div');
  wrap.setAttribute('role', 'alert');
  wrap.style.cssText = [
    'min-height:60vh', 'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center', 'gap:12px',
    'padding:24px', 'text-align:center', 'font-family:system-ui,sans-serif',
    'color:#fff', 'background:#090909',
  ].join(';');

  const title = document.createElement('h1');
  title.textContent = 'Something went wrong';
  title.style.cssText = 'font-size:1.25rem;margin:0';

  const message = document.createElement('p');
  message.textContent = 'ShowAroo could not start. Please refresh the page to try again.';
  message.style.cssText = 'color:#D1D5DB;margin:0;max-width:36ch';

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Reload';
  retry.style.cssText = [
    'margin-top:8px', 'padding:8px 16px', 'border-radius:8px',
    'background:#E50914', 'color:#fff', 'font-weight:600', 'cursor:pointer',
  ].join(';');
  retry.addEventListener('click', () => window.location.reload());

  wrap.append(title, message, retry);
  target.replaceChildren(wrap);
}