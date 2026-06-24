document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');

  if (themeSwitch) {
    themeSwitch.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.removeAttribute('data-theme');
        if (themeLabel) themeLabel.textContent = "Modo Escuro Ativado";
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeLabel) themeLabel.textContent = "Modo Claro Ativado";
      }
    });
  }
});