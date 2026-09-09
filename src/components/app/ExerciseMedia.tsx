import { useEffect, useState } from 'react';
import type { Exercise } from '../../data/types';
import { getExerciseIllustration } from '../../data/exerciseIllustrations';
import { exerciseMediaAssets } from '../../data/exerciseMediaAssets';
import { t, type Locale } from '../../i18n';

export default function ExerciseMedia({ exercise, locale = 'en' }: { exercise: Exercise; locale?: Locale }) {
  const illustration = getExerciseIllustration(exercise.id);
  const supplied = exerciseMediaAssets[exercise.id];
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setFailed(false); setPlaying(false); }, [exercise.id]);
  const tr = (s: string) => t(locale, s);
  if ((!illustration && !supplied) || failed) return <aside className="sf-written-guide"><p className="sf-eyebrow">{tr('Before you begin')}</p><h3>{tr('Set up comfortably')}</h3><p>{tr(exercise.instructions[0])}</p><p><strong>{tr('Make it easier')}</strong><br />{tr(exercise.easier)}</p><p className="sf-note">{tr(exercise.expectedSensation)}</p></aside>;
  const asset = supplied ?? { ...illustration!, type: 'image' as const };
  return <figure className="sf-media">
    {asset.type === 'video' ? <video controls playsInline preload="none" poster={supplied?.poster} src={asset.src} width={asset.width} height={asset.height} aria-label={tr(asset.alt)} onError={() => setFailed(true)} />
      : asset.type === 'gif' && !playing ? <>{supplied?.poster && <img src={supplied.poster} alt={tr(asset.alt)} width={asset.width} height={asset.height} />}<button className="sf-button" onClick={() => setPlaying(true)}>{tr('Play demonstration')}</button></>
      : <img src={asset.src} alt={tr(asset.alt)} width={asset.width} height={asset.height} loading="lazy" onError={() => setFailed(true)} />}
    {asset.type === 'gif' && playing && <button className="sf-text-button" onClick={() => setPlaying(false)}>{tr('Pause demonstration')}</button>}
    <figcaption>{tr('Follow the written steps and stay within a comfortable range.')}</figcaption>
  </figure>;
}
