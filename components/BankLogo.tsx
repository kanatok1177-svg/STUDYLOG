export function BankLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 銀行の建物 */}
      <rect x="8" y="28" width="48" height="26" rx="2" fill="#223047" />
      <polygon points="32,8 58,26 6,26" fill="#223047" />
      <rect x="14" y="34" width="6" height="16" fill="#EEF0E6" />
      <rect x="26" y="34" width="6" height="16" fill="#EEF0E6" />
      <rect x="38" y="34" width="6" height="16" fill="#EEF0E6" />
      <rect x="6" y="54" width="52" height="4" rx="1" fill="#223047" />

      {/* 屋根の投入口(お金が入っていく場所) */}
      <rect x="28" y="15" width="8" height="2.4" rx="1" fill="#0D1520" />

      {/* 入口(お金が出ていく場所) */}
      <rect x="27" y="46" width="10" height="8" rx="1.5" fill="#0D1520" />

      {/* 入金コイン: 上空から屋根の投入口へ吸い込まれていく */}
      <g>
        <circle cx="0" cy="0" r="6" fill="#B98F2C" stroke="#EEF0E6" strokeWidth="1.5" />
        <text
          x="0"
          y="2.6"
          fontSize="7"
          fontWeight="700"
          fill="#223047"
          textAnchor="middle"
          fontFamily="serif"
        >
          円
        </text>
        <animateMotion
          path="M6 4 C 16 -6, 24 4, 32 16"
          dur="2.6s"
          repeatCount="indefinite"
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="linear"
        />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.15;0.75;1"
          dur="2.6s"
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          additive="sum"
          values="1;1;0.3"
          keyTimes="0;0.7;1"
          dur="2.6s"
          repeatCount="indefinite"
        />
      </g>

      {/* 出金コイン: 入口からせり出して外へ運ばれていく */}
      <g>
        <circle cx="0" cy="0" r="5" fill="#A63D33" stroke="#EEF0E6" strokeWidth="1.5" />
        <text
          x="0"
          y="2.2"
          fontSize="6"
          fontWeight="700"
          fill="#EEF0E6"
          textAnchor="middle"
          fontFamily="serif"
        >
          円
        </text>
        <animateMotion
          path="M32 50 C 40 52, 50 48, 58 40"
          dur="2.6s"
          begin="1.3s"
          repeatCount="indefinite"
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="linear"
        />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.15;0.75;1"
          dur="2.6s"
          begin="1.3s"
          repeatCount="indefinite"
        />
      </g>
    </svg>
  );
}
