interface Props {
  enabled: boolean;
  supported: boolean;
  onToggle: () => void;
  label?: string;
}

export default function VoiceToggle({ enabled, supported, onToggle, label = 'Voice guidance' }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!supported}
      aria-pressed={enabled}
      aria-label={supported ? `${label}: ${enabled ? 'on' : 'off'}` : 'Voice guidance is not supported in this browser'}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-muted transition-[border-color,color,background-color] hover:not-disabled:border-line-strong hover:not-disabled:bg-surface-raised hover:not-disabled:text-ink disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {enabled ? <><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" /></> : <><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="m17 10 4 4m0-4-4 4" /></>}
      </svg>
      <span>{label}</span>
      <span className={enabled ? 'rounded bg-brand/12 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-brand' : 'rounded bg-surface-raised px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-subtle'}>{enabled ? 'On' : 'Off'}</span>
    </button>
  );
}
