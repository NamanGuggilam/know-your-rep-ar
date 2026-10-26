import { useId } from "react";
import type { SVGProps } from "react";

// Simple line icons. Always paired with a visible text label, so they are hidden from screen readers.
function Icon({ children, size = 22, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement> & { size?: number };

export const PhoneIcon = (p: P) => (
  <Icon {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </Icon>
);
export const MailIcon = (p: P) => (
  <Icon {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </Icon>
);
export const PinIcon = (p: P) => (
  <Icon {...p}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);
export const GlobeIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
  </Icon>
);
export const SpeakerIcon = (p: P) => (
  <Icon {...p}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
  </Icon>
);
export const PauseIcon = (p: P) => (
  <Icon {...p}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </Icon>
);
export const StopIcon = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="5" width="14" height="14" rx="1" />
  </Icon>
);
export const PencilIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Icon>
);
export const CopyIcon = (p: P) => (
  <Icon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
);
export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
export const InfoIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Icon>
);
export const LocateIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
  </Icon>
);
export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);
export const ExternalIcon = (p: P) => (
  <Icon {...p} size={p.size ?? 16}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
  </Icon>
);
/** The universal access symbol: a person with open arms inside a circle. */
export const AccessIcon = (p: P) => (
  <Icon {...p} size={p.size ?? 26}>
    <circle cx="12" cy="12" r="10.5" />
    <circle cx="12" cy="6.4" r="1.6" fill="currentColor" stroke="none" />
    <path d="M6.5 9.6c1.9.5 3.7.8 5.5.8s3.6-.3 5.5-.8" />
    <path d="M12 10.4v3.4" />
    <path d="M12 13.8l-2.6 4.6M12 13.8l2.6 4.6" />
  </Icon>
);
export const ArrowIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const AlertIcon = (p: P) => (
  <Icon {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Icon>
);
export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
export const PersonIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

/**
 * Original mark: a diamond (Arkansas is the Diamond State) inside "Infinity" rings.
 * Not a seal, a government logo, or any character's likeness.
 */
export function InfinityMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="var(--glow)" strokeWidth="1.25" strokeDasharray="2 3" />
      <path d="M20 9 28 20 20 31 12 20Z" fill="var(--ink)" />
      <path d="M20 9 23 20 20 31 17 20Z" fill="var(--accent)" />
    </svg>
  );
}

// Star shapes for the site badge (8 small stars in the diamond band, 1 center star).
const BAND_STARS = "M32.00 7.40 L32.52 8.79 L34.00 8.85 L32.84 9.77 L33.23 11.20 L32.00 10.38 L30.77 11.20 L31.16 9.77 L30.00 8.85 L31.48 8.79ZM53.50 28.90 L54.02 30.29 L55.50 30.35 L54.34 31.27 L54.73 32.70 L53.50 31.88 L52.27 32.70 L52.66 31.27 L51.50 30.35 L52.98 30.29ZM32.00 50.40 L32.52 51.79 L34.00 51.85 L32.84 52.77 L33.23 54.20 L32.00 53.38 L30.77 54.20 L31.16 52.77 L30.00 51.85 L31.48 51.79ZM10.50 28.90 L11.02 30.29 L12.50 30.35 L11.34 31.27 L11.73 32.70 L10.50 31.88 L9.27 32.70 L9.66 31.27 L8.50 30.35 L9.98 30.29ZM42.75 18.15 L43.27 19.54 L44.75 19.60 L43.59 20.52 L43.98 21.95 L42.75 21.13 L41.52 21.95 L41.91 20.52 L40.75 19.60 L42.23 19.54ZM42.75 39.65 L43.27 41.04 L44.75 41.10 L43.59 42.02 L43.98 43.45 L42.75 42.63 L41.52 43.45 L41.91 42.02 L40.75 41.10 L42.23 41.04ZM21.25 39.65 L21.77 41.04 L23.25 41.10 L22.09 42.02 L22.48 43.45 L21.25 42.63 L20.02 43.45 L20.41 42.02 L19.25 41.10 L20.73 41.04ZM21.25 18.15 L21.77 19.54 L23.25 19.60 L22.09 20.52 L22.48 21.95 L21.25 21.13 L20.02 21.95 L20.41 20.52 L19.25 19.60 L20.73 19.54Z";
const CENTER_STAR = "M32.00 24.00 L33.85 28.95 L39.13 29.18 L35.00 32.47 L36.41 37.57 L32.00 34.65 L27.59 37.57 L29.00 32.47 L24.87 29.18 L30.15 28.95Z";

/**
 * Site badge: U.S. flag colors and stripes, with the Arkansas flag's diamond and stars.
 * Original artwork, not a seal or any official insignia. Fixed colors in every theme.
 */
export function SiteMark({ size = 44 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={id}>
          <rect width="64" height="64" rx="6" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="64" height="64" fill="#162e51" />
        <rect y="46" width="64" height="4.5" fill="#b50909" />
        <rect y="50.5" width="64" height="4.5" fill="#ffffff" />
        <rect y="55" width="64" height="4.5" fill="#b50909" />
        <rect y="59.5" width="64" height="4.5" fill="#ffffff" />
      </g>
      <path d="M32 4 59 31 32 58 5 31Z" fill="#ffffff" />
      <path d="M32 6 57 31 32 56 7 31Z" fill="#b50909" />
      <path d="M32 14 49 31 32 48 15 31Z" fill="#ffffff" />
      <path d={BAND_STARS} fill="#ffffff" />
      <path d={CENTER_STAR} fill="#162e51" />
    </svg>
  );
}
