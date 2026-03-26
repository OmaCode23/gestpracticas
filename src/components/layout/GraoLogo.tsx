type GraoLogoProps = {
  className?: string;
  compact?: boolean;
};

export default function GraoLogo({ className = "", compact = false }: GraoLogoProps) {
  return (
    <svg
      viewBox="0 0 286 143"
      className={className}
      role="img"
      aria-label="IES El Grao Valencia"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="286" height="143" rx={compact ? 18 : 0} fill="transparent" />
      <g fill="none" stroke="#9f1d3e" strokeLinecap="round">
        <path d="M106 12c-18 12-30 33-35 62" strokeWidth="10" />
        <path d="M121 9c-19 13-31 36-36 69" strokeWidth="10" />
        <path d="M137 9c-18 14-29 39-32 74" strokeWidth="10" />
        <path d="M188 40c35 4 62 33 65 68 1 11 0 23-5 35" strokeWidth="16" />
      </g>
      <circle cx="176" cy="91" r="8" fill="#9f1d3e" />
      {!compact && (
        <>
          <text
            x="2"
            y="122"
            fill="#75757c"
            fontSize="28"
            letterSpacing="1.8"
            style={{ fontFamily: "'Trebuchet MS', 'Arial', sans-serif", fontWeight: 500 }}
          >
            IES EL GRAO
          </text>
          <text
            x="3"
            y="140"
            fill="#66666d"
            fontSize="17"
            letterSpacing="8"
            style={{ fontFamily: "'Trebuchet MS', 'Arial', sans-serif", fontWeight: 700 }}
          >
            VALENCIA
          </text>
          <rect x="253" y="132" width="30" height="3" rx="1.5" fill="#9f1d3e" />
        </>
      )}
    </svg>
  );
}
