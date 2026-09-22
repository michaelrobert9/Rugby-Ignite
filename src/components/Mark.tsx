// The Rugby Ignite mark — a flame inside a pointed shield (Brand Book v8, "the
// icon is unchanged"). One colour: Ember. Never recoloured, stretched, rotated,
// outlined, or separated from the shield. The shield outline carries it down to
// favicon size. `tone="reversed"` draws it for a navy panel.

export default function Mark({
  size = 40,
  tone = 'ember',
  title = 'Rugby Ignite',
}: {
  size?: number;
  tone?: 'ember' | 'reversed';
  title?: string;
}) {
  const color = tone === 'reversed' ? 'var(--paper)' : 'var(--ember)';
  return (
    <svg
      width={(size * 44) / 52}
      height={size}
      viewBox="0 0 44 52"
      fill="none"
      role="img"
      aria-label={title}
      style={{ flex: 'none', display: 'block' }}
    >
      {/* Shield */}
      <path
        d="M22 2.5 L40 9.5 V25 C40 37 32 46 22 49.5 C12 46 4 37 4 25 V9.5 Z"
        stroke={color}
        strokeWidth={3.2}
        strokeLinejoin="round"
      />
      {/* Flame (Material "whatshot"), scaled and centred in the shield) */}
      <g transform="translate(6.4 10.2) scale(1.28)" fill={color}>
        <path d="M13.5 0.67s0.74 2.65 0.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l0.03-0.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-0.36 3.6-1.21 4.62-2.58 0.39 1.29 0.59 2.65 0.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
      </g>
    </svg>
  );
}
