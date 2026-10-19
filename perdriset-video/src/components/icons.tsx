import React from "react";

/* Icônes SVG en trait arrondi (même style que la pub Promptly, pas d'emoji). */

type IconProps = { size?: number; color?: string; stroke?: number };
const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 22, color = "#fff", stroke = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const IconWrench: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M14.7 6.3a4.5 4.5 0 0 0 5.6 5.6l-8.6 8.6a2.1 2.1 0 0 1-3-3l8.6-8.6a4.5 4.5 0 0 0-2.6-2.6z" />
    <path d="M14.7 6.3 17 4l3 3-2.3 2.3" />
  </Svg>
);
export const IconCalendar: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4M8.5 14.5l2.2 2.2 4.3-4.3" />
  </Svg>
);
export const IconKey: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="15" r="4.5" />
    <path d="M11.2 11.8 20 3M16.5 6.5l2.5 2.5M14 9l2 2" />
  </Svg>
);
export const IconTag: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.6 6.6a1.5 1.5 0 0 1-2.1 0z" />
    <circle cx="8.2" cy="8.2" r="1.4" />
  </Svg>
);
export const IconUsers: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.5 3.5 5.2" />
  </Svg>
);
export const IconBriefcase: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3 12.5h18" />
  </Svg>
);
export const IconLeaf: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" />
    <path d="M5 19c3-4 6-7 10-9" />
  </Svg>
);
export const IconPin: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);
export const IconPhone: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11 11 0 0 0 5.2 5.2l1.4-2.1 4.2 1.6V17a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5z" />
  </Svg>
);
export const IconGlobe: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.7 5.7 3.7 9s-1.2 6.3-3.7 9c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3z" />
  </Svg>
);
export const IconCheck: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
