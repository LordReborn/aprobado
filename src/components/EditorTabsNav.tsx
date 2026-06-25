import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const MOBILE_MQ = '(max-width: 768px)';

type EditorTabsNavProps = {
  children: ReactNode;
};

function isMobileTabsLayout(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches;
}

export function EditorTabsNav({ children }: EditorTabsNavProps) {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [scrollState, setScrollState] = useState({ start: false, end: false });

  const updateScrollState = useCallback(() => {
    const el = navRef.current;
    if (!el || isMobileTabsLayout()) {
      setScrollState({ start: false, end: false });
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth - clientWidth > 1;

    setScrollState({
      start: overflow && scrollLeft > 1,
      end: overflow && scrollLeft + clientWidth < scrollWidth - 1,
    });
  }, []);

  const scrollActiveTabIntoView = useCallback(() => {
    if (isMobileTabsLayout()) return;

    const el = navRef.current;
    if (!el) return;

    const active = el.querySelector('.editor-tab-button-active');
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, children]);

  useEffect(() => {
    scrollActiveTabIntoView();
    const timer = window.setTimeout(updateScrollState, 300);
    return () => window.clearTimeout(timer);
  }, [location.pathname, scrollActiveTabIntoView, updateScrollState]);

  const wrapperClass = [
    'editor-tabs-scroll',
    scrollState.start && 'editor-tabs-scroll--start',
    scrollState.end && 'editor-tabs-scroll--end',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      <nav ref={navRef} className="editor-tabs" aria-label="Secciones del editor">
        {children}
      </nav>
    </div>
  );
}
