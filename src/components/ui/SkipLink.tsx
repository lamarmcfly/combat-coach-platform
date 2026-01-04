'use client';

interface SkipLinkProps {
  targetId?: string;
  children?: React.ReactNode;
}

/**
 * Skip link for keyboard navigation
 * Allows users to skip to main content
 */
export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
    >
      {children}
    </a>
  );
}

/**
 * Visually hidden element for screen readers only
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
}: {
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <Component className="sr-only">{children}</Component>
  );
}

/**
 * Live region for announcing updates to screen readers
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}
