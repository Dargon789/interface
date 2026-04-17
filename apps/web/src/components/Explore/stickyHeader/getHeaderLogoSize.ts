import type { MediaQueryState } from 'ui/src'
import { fonts, type TextVariantTokens } from 'ui/src/theme/fonts'
import { HEADER_LOGO_SIZE } from '~/components/Explore/stickyHeader/constants'

/** `useMedia()`-shaped input; only `sm` / `md` are read (others optional for tests). */
type HeaderLayoutMedia = Partial<Pick<MediaQueryState, 'sm' | 'md'>>

/**
 * Resolves header logo size from sticky header state and viewport.
 * Used by TokenDetailsHeader, PoolDetailsHeader, and TDP skeleton for consistent sizing.
 */
export function getHeaderLogoSize({ isCompact, media }: { isCompact: boolean; media: HeaderLayoutMedia }): number {
  // if small breakpoint, return fixed small size
  if (media.sm) {
    return HEADER_LOGO_SIZE.small
  }

  // on medium-large screens, animate between medium/full size at the top scroll position and compact size on scroll down
  if (isCompact) {
    return HEADER_LOGO_SIZE.compact
  }
  if (media.md) {
    return HEADER_LOGO_SIZE.medium
  }
  return HEADER_LOGO_SIZE.expanded
}

/** Subset of UI text variants used for details header title. */
type HeaderTitleVariant = Extract<TextVariantTokens, 'heading3' | 'subheading1' | 'subheading2'>

/**
 * Resolves header title Text variant from sticky header state and viewport.
 * Used by TokenDetailsHeader (and skeleton) for consistent title sizing.
 */
export function getHeaderTitleVariant({
  isCompact,
  media,
}: {
  isCompact: boolean
  media: HeaderLayoutMedia
}): HeaderTitleVariant {
  if (media.sm) {
    return 'subheading2'
  }
  if (media.md) {
    return 'subheading1'
  }
  if (isCompact) {
    return 'subheading2'
  }
  return 'heading3'
}

/**
 * Resolves header title line height in px for skeleton/placeholder sizing.
 * Uses theme fonts for the variant from getHeaderTitleVariant.
 */
export function getHeaderTitleLineHeight({
  isCompact,
  media,
}: {
  isCompact: boolean
  media: HeaderLayoutMedia
}): number {
  const variant = getHeaderTitleVariant({ isCompact, media })
  return fonts[variant].lineHeight
}
