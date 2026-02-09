interface RedPandaMascotProps {
  /** Width & height in pixels (square viewBox) */
  size?: number
  className?: string
  /** Show full body with waving pose, or just the head */
  variant?: 'full' | 'head'
}

/**
 * Cute kawaii-style red panda mascot for sed.fyi.
 * `full` variant: friendly waving red panda with striped tail.
 * `head` variant: face only (good for small icons / favicon).
 */
const RedPandaMascot = ({ size = 120, className, variant = 'full' }: RedPandaMascotProps) => {
  if (variant === 'head') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Red panda mascot"
        role="img"
      >
        {/* Head (round) */}
        <circle cx="50" cy="54" r="36" fill="#ee5b1e" />

        {/* Inner face / cream cheeks */}
        <ellipse cx="50" cy="60" rx="28" ry="26" fill="#fde4d4" />

        {/* Ears */}
        <circle cx="22" cy="26" r="14" fill="#ee5b1e" />
        <circle cx="78" cy="26" r="14" fill="#ee5b1e" />
        {/* Inner ear */}
        <circle cx="22" cy="26" r="8" fill="#401008" />
        <circle cx="78" cy="26" r="8" fill="#401008" />

        {/* Eye patches (dark teardrop markings) */}
        <ellipse cx="36" cy="52" rx="10" ry="11" fill="#b93210" />
        <ellipse cx="64" cy="52" rx="10" ry="11" fill="#b93210" />

        {/* Eyes */}
        <circle cx="36" cy="52" r="5" fill="#401008" />
        <circle cx="64" cy="52" r="5" fill="#401008" />
        {/* Eye shine */}
        <circle cx="38" cy="50" r="2" fill="white" />
        <circle cx="66" cy="50" r="2" fill="white" />

        {/* Nose */}
        <ellipse cx="50" cy="64" rx="4" ry="3" fill="#401008" />

        {/* Mouth */}
        <path
          d="M46 68 Q50 72 54 68"
          stroke="#401008"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Forehead stripe */}
        <path
          d="M42 38 Q50 32 58 38"
          stroke="#b93210"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // Full body variant with waving pose
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Red panda mascot waving"
      role="img"
    >
      {/* === Tail (behind body) === */}
      <g>
        {/* Tail base */}
        <path
          d="M60 175 Q30 170 20 145 Q10 120 25 105 Q35 95 45 105 Q55 115 50 135 Q48 155 65 165"
          fill="#ee5b1e"
          stroke="none"
        />
        {/* Tail stripes */}
        <path
          d="M30 148 Q22 140 26 130"
          stroke="#401008"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M25 125 Q20 118 24 110"
          stroke="#401008"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* === Body === */}
      <ellipse cx="100" cy="170" rx="40" ry="35" fill="#ee5b1e" />
      {/* Belly */}
      <ellipse cx="100" cy="175" rx="28" ry="24" fill="#fde4d4" />

      {/* === Feet === */}
      <ellipse cx="80" cy="200" rx="14" ry="8" fill="#401008" />
      <ellipse cx="120" cy="200" rx="14" ry="8" fill="#401008" />

      {/* === Left arm (resting) === */}
      <path d="M65 160 Q50 170 52 180 Q54 188 62 185 Q68 178 70 168" fill="#ee5b1e" stroke="none" />
      <ellipse cx="55" cy="183" rx="6" ry="5" fill="#401008" />

      {/* === Right arm (waving!) === */}
      <path
        d="M135 160 Q155 140 160 120 Q163 108 155 105 Q147 108 145 118 Q140 135 130 150"
        fill="#ee5b1e"
        stroke="none"
      />
      <ellipse cx="157" cy="108" rx="6" ry="5" fill="#401008" transform="rotate(-20 157 108)" />

      {/* === Head === */}
      <circle cx="100" cy="110" r="42" fill="#ee5b1e" />

      {/* Inner face / cream area */}
      <ellipse cx="100" cy="118" rx="32" ry="30" fill="#fde4d4" />

      {/* Ears */}
      <circle cx="68" cy="76" r="16" fill="#ee5b1e" />
      <circle cx="132" cy="76" r="16" fill="#ee5b1e" />
      {/* Inner ear dark */}
      <circle cx="68" cy="76" r="9" fill="#401008" />
      <circle cx="132" cy="76" r="9" fill="#401008" />
      {/* Inner ear highlight */}
      <circle cx="68" cy="74" r="5" fill="#b93210" />
      <circle cx="132" cy="74" r="5" fill="#b93210" />

      {/* Eye patches (dark teardrop markings) */}
      <ellipse cx="84" cy="108" rx="12" ry="13" fill="#b93210" />
      <ellipse cx="116" cy="108" rx="12" ry="13" fill="#b93210" />

      {/* Eyes */}
      <circle cx="84" cy="108" r="6" fill="#401008" />
      <circle cx="116" cy="108" r="6" fill="#401008" />
      {/* Eye shine */}
      <circle cx="86.5" cy="106" r="2.5" fill="white" />
      <circle cx="118.5" cy="106" r="2.5" fill="white" />

      {/* Nose */}
      <ellipse cx="100" cy="122" rx="5" ry="3.5" fill="#401008" />

      {/* Mouth — happy smile */}
      <path
        d="M93 127 Q100 133 107 127"
        stroke="#401008"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Forehead stripe */}
      <path
        d="M88 94 Q100 86 112 94"
        stroke="#b93210"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Cheek blush */}
      <ellipse cx="74" cy="118" rx="6" ry="4" fill="#f6a070" opacity="0.5" />
      <ellipse cx="126" cy="118" rx="6" ry="4" fill="#f6a070" opacity="0.5" />
    </svg>
  )
}

export default RedPandaMascot
