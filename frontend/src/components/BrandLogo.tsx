/** Brand mark: a four-colour faceted gem. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 497 465" aria-hidden className={className}>
      <polygon points="110,0 388,0 347,139 150,139" fill="#FF4B14" />
      <polygon points="0,139 110,0 150,139" fill="#FBB000" />
      <polygon points="497,139 388,0 347,139" fill="#FBB000" />
      <polygon points="0,139 150,139 248,465" fill="#0099FF" />
      <polygon points="497,139 347,139 248,465" fill="#0099FF" />
      <polygon points="150,139 347,139 248,465" fill="#006635" />
    </svg>
  );
}
