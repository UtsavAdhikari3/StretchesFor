import { useLayoutEffect, type RefObject } from 'react';
import { t, type Locale } from '../../i18n';

const translatedAttributes = ['aria-label', 'aria-description', 'alt', 'placeholder', 'title'] as const;

function translateTree(root: HTMLElement, locale: Locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const source = node.textContent?.trim();
    if (source) {
      const translated = t(locale, source);
      if (translated !== source && node.textContent) node.textContent = node.textContent.replace(source, translated);
    }
    node = walker.nextNode();
  }
  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    translatedAttributes.forEach((attribute) => {
      const source = element.getAttribute(attribute);
      if (source) element.setAttribute(attribute, t(locale, source));
    });
  });
}

export function useLocalizedDom(ref: RefObject<HTMLElement | null>, locale: Locale) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || locale === 'en') return;
    translateTree(root, locale);
    const observer = new MutationObserver(() => {
      observer.disconnect();
      translateTree(root, locale);
      observer.observe(root, { childList: true, characterData: true, subtree: true });
    });
    observer.observe(root, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  });
}

