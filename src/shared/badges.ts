/**
 * Shared helper to generate glassmorphic circular badge SVGs for Vis.js topology nodes.
 * This helper avoids duplicate SVG generator logic across network and stack topology views.
 */
export const generateCircularBadge = (
  gradientStart: string,
  gradientEnd: string,
  borderColor: string,
  iconContent: string,
  highlighted: boolean = false,
  size: number = 88,
  cx: number = 44,
  radius: number = 32
) => {
  const strokeWidth = highlighted ? 5.5 : 2.5
  const glowDeviation = highlighted ? 9 : 4
  const glowOpacity = highlighted ? 0.95 : 0.4
  const computedRadius = highlighted ? radius + 2 : radius

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="badgeGrad_${borderColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradientStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientEnd};stop-opacity:1" />
    </linearGradient>
    <filter id="badgeShadow_${borderColor.replace('#', '')}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="${glowDeviation}" flood-color="${borderColor}" flood-opacity="${glowOpacity}"/>
    </filter>
  </defs>
  <circle cx="${cx}" cy="${cx}" r="${computedRadius}" fill="url(#badgeGrad_${borderColor.replace('#', '')})" stroke="${borderColor}" stroke-width="${strokeWidth}" filter="url(#badgeShadow_${borderColor.replace('#', '')})" />
  <g transform="translate(${cx - 12}, ${cx - 12})">
    ${iconContent}
  </g>
</svg>
`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}
