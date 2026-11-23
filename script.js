(() => {
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-switch');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const themeKey = 'wonil.theme';

  function savedTheme() {
    try {
      const value = localStorage.getItem(themeKey);
      return value === 'light' || value === 'dark' ? value : null;
    } catch { return null; }
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    root.dataset.theme = theme;
    const label = dark ? '라이트 모드로 전환' : '다크 모드로 전환';
    themeButton.title = label;
    themeButton.setAttribute('aria-label', label);
    themeMeta.content = dark ? '#151d28' : '#f6f5ef';
  }
  function followPreference() {
    applyTheme(savedTheme() || (systemTheme.matches ? 'dark' : 'light'));
  }
  followPreference();
  systemTheme.addEventListener('change', followPreference);
  window.addEventListener('storage', event => {
    if (event.key === themeKey || event.key === null) followPreference();
  });
  themeButton.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(themeKey, next); } catch {}
    applyTheme(next);
  });

  const menuButton = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('nav-links');
  const links = [...menu.querySelectorAll('a')];
  const masthead = document.querySelector('.masthead');
  const mobile = matchMedia('(max-width: 760px)');

  function setMenu(open, returnFocus = false) {
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    menuButton.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    if (open) links[0].focus();
    else if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  links.forEach(link => link.addEventListener('click', () => {
    if (!menu.classList.contains('is-open')) return;
    setMenu(false);
    const section = document.getElementById(link.hash.slice(1));
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false, true);
  });
  function closeOutside(event) {
    if (menu.classList.contains('is-open') && !masthead.contains(event.target)) setMenu(false);
  }
  document.addEventListener('pointerdown', closeOutside);
  document.addEventListener('focusin', closeOutside);
  mobile.addEventListener('change', () => setMenu(false));

  const tabs = [...document.querySelectorAll('.stack-tab')];
  function selectTab(active) {
    tabs.forEach(tab => {
      const selected = tab === active;
      tab.tabIndex = selected ? 0 : -1;
      tab.setAttribute('aria-selected', String(selected));
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      switch (event.key) {
        case 'ArrowRight': next = (index + 1) % tabs.length; break;
        case 'ArrowLeft': next = (index + tabs.length - 1) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });
  selectTab(tabs[0]);
  root.classList.add('tabs-ready');

  // Related-project links and shared fragments should land on the complete entry.
  function openProject(hash) {
    const target = document.getElementById(hash.slice(1));
    if (target?.matches('details.project-entry')) target.open = true;
  }
  window.addEventListener('hashchange', () => openProject(location.hash));
  document.querySelectorAll('.related a').forEach(link => {
    link.addEventListener('click', () => openProject(link.hash));
  });
  openProject(location.hash);

  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  let frame = 0;
  function markCurrent() {
    const top = masthead.getBoundingClientRect().height + 40;
    let index = -1;
    let latestTop = -Infinity;
    sections.forEach((section, i) => {
      const position = section.getBoundingClientRect().top;
      if (position > top) return;
      // Introduction and awards share a row on desktop. Honor the section link used.
      if (position > latestTop + 1 || (Math.abs(position - latestTop) <= 1 && location.hash === links[i].hash)) {
        index = i;
        latestTop = position;
      }
    });
    const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
    if (window.scrollY >= maxScroll - 2) {
      index = links.length - 1;
      // Adjacent sections near the footer can share the same final scroll position.
      const requested = links.findIndex(link => link.hash === location.hash);
      if (requested >= 0) {
        const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
        const destination = window.scrollY + sections[requested].getBoundingClientRect().top - padding;
        if (destination >= maxScroll - 2) index = requested;
      }
    }
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    frame = 0;
  }
  function scheduleCurrent() {
    if (!frame) frame = requestAnimationFrame(markCurrent);
  }
  window.addEventListener('scroll', scheduleCurrent, { passive: true });
  window.addEventListener('resize', scheduleCurrent);
  window.addEventListener('hashchange', scheduleCurrent);
  document.querySelectorAll('.project-entry').forEach(entry => entry.addEventListener('toggle', scheduleCurrent));
  markCurrent();

  const email = document.querySelector('.email-link');
  const copyButton = document.getElementById('copy-email');
  const copyStatus = document.getElementById('copy-status');
  let copyTimer;
  copyButton.addEventListener('click', async () => {
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      copyStatus.textContent = '이메일 주소를 복사했습니다.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(email);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = '이메일 주소를 선택했습니다. 복사해 주세요.';
    }
    copyTimer = setTimeout(() => { copyStatus.textContent = ''; }, 4000);
  });
  root.classList.add('enhanced');
})();
