(() => {
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = localStorage.getItem('tunetransit-site-theme') || 'system'; } catch {}
  if (!['system', 'light', 'dark'].includes(preference)) preference = 'system';
  function apply() {
    document.documentElement.dataset.siteTheme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    document.querySelectorAll('[data-site-appearance]').forEach(button => {
      const selected = button.dataset.siteAppearance === preference;
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('.appearance-check').textContent = selected ? '✓' : '○';
    });
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach((trigger, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'website-appearance';
      trigger.before(wrapper);
      wrapper.append(trigger);
      trigger.textContent = 'Appearance';
      trigger.removeAttribute('aria-pressed');
      trigger.setAttribute('aria-label', 'Website appearance');
      trigger.setAttribute('aria-expanded', 'false');
      const panel = document.createElement('div');
      panel.id = `website-appearance-${index}`;
      panel.className = 'website-appearance-panel';
      panel.hidden = true;
      panel.setAttribute('role', 'group');
      panel.setAttribute('aria-label', 'Website appearance');
      trigger.setAttribute('aria-controls', panel.id);
      const miniature = '<i class="preview-search"></i><span class="preview-actions"><i></i><i></i></span><span class="preview-art"><i>♪</i><i>♪</i><i>♪</i></span>';
      panel.innerHTML = '<strong>Appearance</strong><div class="website-appearance-options">' + ['system', 'light', 'dark'].map(mode => `<button type="button" data-site-appearance="${mode}" aria-label="${mode[0].toUpperCase()+mode.slice(1)} appearance"><span class="appearance-preview preview-${mode}" aria-hidden="true"><span class="miniature miniature-light">${miniature}</span><span class="miniature miniature-dark">${miniature}</span></span><span class="appearance-option-label"><span class="appearance-check" aria-hidden="true">○</span>${mode[0].toUpperCase()+mode.slice(1)}</span></button>`).join('') + '</div>';
      wrapper.append(panel);
      function close(returnFocus = false) {
        panel.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        if (returnFocus) trigger.focus();
      }
      trigger.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        trigger.setAttribute('aria-expanded', String(!panel.hidden));
        if (!panel.hidden) panel.querySelector('[aria-pressed="true"]').focus();
      });
      panel.addEventListener('click', event => {
        const choice = event.target.closest('[data-site-appearance]');
        if (!choice) return;
        preference = choice.dataset.siteAppearance;
        try { localStorage.setItem('tunetransit-site-theme', preference); } catch {}
        apply();
      });
      document.addEventListener('click', event => { if (!wrapper.contains(event.target)) close(); });
      wrapper.addEventListener('focusout', event => { if (!wrapper.contains(event.relatedTarget)) close(); });
      wrapper.addEventListener('keydown', event => {
        if (event.key.startsWith('Arrow')) event.stopPropagation();
        if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation(); close(true); }
      });
    });
    apply();
  });
  system.addEventListener('change', apply);
})();
