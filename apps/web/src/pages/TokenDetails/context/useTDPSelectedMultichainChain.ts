import { useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { withChainSearchParam } from '~/features/params/chainQueryParam'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export function useTDPSelectedMultichainChain(): {
  selectedMultichainChainId: UniverseChainId | undefined
  setSelectedMultichainChainId: (chainId: UniverseChainId | undefined) => void
} {
  const [, setSearchParams] = useSearchParams()
  const selectedMultichainChainId = useTDPStore((s) => s.selectedMultichainChainId)
  const storeSetter = useTDPStore((s) => s.actions.setSelectedMultichainChainId)

  const setSelectedMultichainChainId = useEvent((chainId: UniverseChainId | undefined) => {
    storeSetter(chainId)
    setSearchParams((prev) => withChainSearchParam(prev, chainId), { replace: true })
  })

  return { selectedMultichainChainId, setSelectedMultichainChainId }
}
