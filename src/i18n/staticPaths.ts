import { locales } from './config';

export const localeStaticPaths = () => locales.map((locale) => ({ params: { locale } }));

