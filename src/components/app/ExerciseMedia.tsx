import { useEffect, useState } from 'react';
import type { Exercise } from '../../data/types';
import { getExerciseIllustration } from '../../data/exerciseIllustrations';
import { exerciseMediaResolver, type ExerciseMediaResolver, type ProviderExercise } from '../../lib/exerciseProviders';
import { t, type Locale } from '../../i18n';

interface Props { exercise: Exercise; resolver?: ExerciseMediaResolver; locale?: Locale }

export default function ExerciseMedia({ exercise, resolver = exerciseMediaResolver, locale = 'en' }: Props) {
  const illustration = getExerciseIllustration(exercise.id);
  const [media, setMedia] = useState<ProviderExercise | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(!illustration);

  useEffect(() => {
    setFailed(false);
    if (illustration) { setMedia(null); setLoading(false); return; }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    resolver.resolveWgerCandidates(exercise.sourceRef, (type) => document.createElement('video').canPlayType(type), controller.signal)
      .then((candidates) => candidates[0] ?? null)
      .then((candidate) => candidate ? candidate : resolver.resolveExerciseDbCandidate(exercise.sourceRef, controller.signal))
      .then((candidate) => { if (!cancelled) { setMedia(candidate); setLoading(false); } })
      .catch(() => { if (!cancelled) { setMedia(null); setLoading(false); } });
    return () => { cancelled = true; controller.abort(); };
  }, [exercise.id, illustration, resolver]);

  if (illustration) return <figure className="overflow-hidden rounded-2xl border border-line bg-surface"><img src={illustration.src} width={illustration.width} height={illustration.height} loading="lazy" alt={t(locale, illustration.alt)} onError={() => setFailed(true)} className={`mx-auto h-auto max-h-[32rem] w-full object-contain ${failed ? 'hidden' : ''}`} />{failed && <Unavailable locale={locale} /> }<figcaption className="border-t border-line px-4 py-3 text-xs leading-5 text-subtle">{t(locale, 'stretchesfor illustration. Written steps are the authoritative guidance; this illustration has not been clinically reviewed.')}</figcaption></figure>;
  if (loading) return <div role="status" className="grid min-h-64 place-items-center rounded-2xl border border-line bg-surface text-sm text-subtle">{t(locale, 'Loading demonstration…')}</div>;
  if (!media || failed) return <Unavailable locale={locale} />;
  const label = `${exercise.name} ${t(locale, 'exercise demonstration')}`;
  const onError = () => setFailed(true);
  return <figure className="overflow-hidden rounded-2xl border border-line bg-surface">{media.media.type === 'video' ? <video controls playsInline width={640} poster={media.media.poster} aria-label={label} src={media.media.url} onError={onError} className="mx-auto max-h-[32rem] w-full object-contain" /> : <img src={media.media.url} width={640} height={480} loading="lazy" alt={label} onError={onError} className="mx-auto max-h-[32rem] w-full object-contain" />}<figcaption className="border-t border-line px-4 py-3 text-xs text-subtle">{t(locale, 'Demonstration supplied by')} {media.media.provider === 'exerciseDb' ? 'ExerciseDB' : 'Wger'}{media.media.author ? ` ${t(locale, 'by')} ${media.media.author}` : ''}.</figcaption></figure>;
}

function Unavailable({ locale }: { locale: Locale }) { return <div role="status" className="grid min-h-64 place-items-center rounded-2xl border border-line bg-surface px-6 text-center text-sm text-subtle">{t(locale, 'Demonstration unavailable—follow the written steps.')}</div>; }
