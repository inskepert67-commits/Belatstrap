(() => {
  const s = {
    blockContextMenu: true,
    blockSelection: true,
    blockDrag: true,
    blockCopy: true,
    blockCommonShortcuts: true,
    devToolsOverlay: true,
    devToolsRedirect: false,
    devToolsCheckIntervalMs: 600,
    devToolsThresholdPx: 160,
  };

  const stop = (e) => {
    if (!e) return false;
    try { e.preventDefault(); } catch (_) {}
    try { e.stopPropagation(); } catch (_) {}
    try { e.stopImmediatePropagation(); } catch (_) {}
    return false;
  };

  if (s.blockContextMenu) {
    document.addEventListener('contextmenu', stop, { capture: true });
  }

  if (s.blockSelection) {
    document.addEventListener('selectstart', stop, { capture: true });
  }

  if (s.blockDrag) {
    document.addEventListener('dragstart', stop, { capture: true });
  }

  if (s.blockCopy) {
    document.addEventListener('copy', stop, { capture: true });
    document.addEventListener('cut', stop, { capture: true });
    document.addEventListener('paste', stop, { capture: true });
  }

  if (s.blockCommonShortcuts) {
    document.addEventListener(
      'keydown',
      (e) => {
        const key = (e.key || '').toLowerCase();
        const ctrl = !!e.ctrlKey;
        const meta = !!e.metaKey;
        const alt = !!e.altKey;
        const shift = !!e.shiftKey;

        if (key === 'f12') return stop(e);

        if ((ctrl || meta) && key === 'u') return stop(e);
        if ((ctrl || meta) && key === 's') return stop(e);
        if ((ctrl || meta) && key === 'p') return stop(e);

        if ((ctrl || meta) && shift && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) return stop(e);
        if (ctrl && shift && (key === 's' || key === 'e')) return stop(e);

        if (key === 'escape' && (ctrl || meta || shift)) return stop(e);

        if (alt && (key === 'arrowleft' || key === 'arrowright') && (ctrl || meta)) return stop(e);
      },
      { capture: true }
    );
  }

  const overlayId = '__bt_protect_overlay';
  let overlayEl = null;

  const ensureOverlay = () => {
    if (overlayEl && overlayEl.isConnected) return overlayEl;
    overlayEl = document.getElementById(overlayId);
    if (overlayEl) return overlayEl;

    overlayEl = document.createElement('div');
    overlayEl.id = overlayId;
    overlayEl.setAttribute('role', 'presentation');
    overlayEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0.92)',
      'color:#ffffff',
      'font-family:"Zalando Sans Expanded",system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial',
      'letter-spacing:0.14em',
      'text-transform:uppercase',
      'font-size:12px',
      'user-select:none',
      'padding:24px',
      'text-align:center',
    ].join(';');

    const inner = document.createElement('div');
    inner.style.cssText = [
      'max-width:560px',
      'border:1px solid rgba(255,255,255,0.18)',
      'padding:22px 18px',
      'background:rgba(10,10,10,0.55)',
      'backdrop-filter:blur(10px)',
    ].join(';');
    inner.textContent = 'Protected content';

    overlayEl.appendChild(inner);

    const mount = () => {
      if (!document.body) return;
      if (!overlayEl.isConnected) document.body.appendChild(overlayEl);
    };

    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });

    return overlayEl;
  };

  const setOverlayVisible = (visible) => {
    if (!s.devToolsOverlay) return;
    const el = ensureOverlay();
    el.style.display = visible ? 'flex' : 'none';
  };

  const isDevToolsOpen = () => {
    const w = Math.abs((window.outerWidth || 0) - (window.innerWidth || 0));
    const h = Math.abs((window.outerHeight || 0) - (window.innerHeight || 0));
    return w > s.devToolsThresholdPx || h > s.devToolsThresholdPx;
  };

  let lastOpen = false;
  const check = () => {
    const open = isDevToolsOpen();
    if (open !== lastOpen) {
      lastOpen = open;
      if (open) {
        setOverlayVisible(true);
        if (s.devToolsRedirect) {
          try { window.location.replace('about:blank'); } catch (_) {}
        }
      } else {
        setOverlayVisible(false);
      }
    }
  };

  if (s.devToolsOverlay || s.devToolsRedirect) {
    window.addEventListener('resize', check, { passive: true });
    setInterval(check, Math.max(250, s.devToolsCheckIntervalMs | 0));
    check();
  }
})();
