import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useEvent } from 'utilities/src/react/hooks'
import { OrderDirection } from '~/appGraphql/data/util'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { getAuctionMetadata } from '~/components/Toucan/Config/config'
import type { EnrichedAuction } from '~/state/explore/topAuctions/useTopAuctions'

/**
 * Sort fields for auction table
 */
export enum AuctionSortField {
  FDV = 'FDV',
  COMMITTED_VOLUME = 'Committed Volume',
  TIME_REMAINING = 'Time Remaining',
}

export function AuctionTableHeader({
  category,
  isCurrentSortMethod,
  direction,
  onSort,
}: {
  category: AuctionSortField
  isCurrentSortMethod: boolean
  direction: OrderDirection
  onSort: () => void
}) {
  const { t } = useTranslation()
  const handleSortCategory = useEvent(onSort)

  const HEADER_TEXT = {
    [AuctionSortField.FDV]: t('stats.fdv'),
    [AuctionSortField.COMMITTED_VOLUME]: t('toucan.auction.committedVolume'),
    [AuctionSortField.TIME_REMAINING]: t('toucan.auction.timeRemaining'),
  }

  return (
    <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory} group>
      <Flex row gap="$gap4" alignItems="center">
        <Flex opacity={isCurrentSortMethod ? 1 : 0}>
          <HeaderArrow orderDirection={direction} size="$icon.16" />
        </Flex>
        <HeaderSortText active={isCurrentSortMethod} variant="body3">
          {HEADER_TEXT[category]}
        </HeaderSortText>
      </Flex>
    </ClickableHeaderRow>
  )
}

export function TokenNameCell({ auction }: { auction: EnrichedAuction }) {
  // Check for metadata overrides from config
  const metadataOverride =
    auction.auction?.chainId && auction.auction.tokenAddress
      ? getAuctionMetadata({ chainId: auction.auction.chainId, tokenAddress: auction.auction.tokenAddress })
      : undefined

  const tokenName = metadataOverride?.tokenName ?? auction.auction?.tokenName
  const tokenSymbol = metadataOverride?.tokenSymbol ?? auction.auction?.tokenSymbol

  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start">
      <Flex pr="$spacing4">
        <TokenLogo
          url={metadataOverride?.logoUrl ?? auction.logoUrl}
          size={24}
          chainId={auction.auction?.chainId}
          symbol={tokenSymbol}
          name={tokenName}
        />
      </Flex>
      <EllipsisText>{tokenName ?? tokenSymbol ?? auction.auction?.tokenAddress ?? '—'}</EllipsisText>
      <EllipsisText $platform-web={{ minWidth: 'fit-content' }} $lg={{ display: 'none' }} color="$neutral2">
        {tokenSymbol}
      </EllipsisText>
      {auction.verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
    </Flex>
  )
}
