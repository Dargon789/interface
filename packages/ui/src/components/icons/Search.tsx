import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Search, AnimatedSearch] = createIcon({
  name: 'Search',
  getIcon: (props) => (
    <Svg viewBox="0 0 26 26" fill="none" {...props}>
      <Path
        d="M11.9166 2.16663C6.53185 2.16663 2.16663 6.53185 2.16663 11.9166C2.16663 17.3014 6.53185 21.6666 11.9166 21.6666C14.2203 21.6666 16.3374 20.8677 18.0059 19.5318L22.2462 23.7783C22.669 24.2017 23.3549 24.2022 23.7783 23.7794C24.2017 23.3566 24.2022 22.6707 23.7794 22.2473L19.5373 17.999C20.8699 16.3316 21.6666 14.2171 21.6666 11.9166C21.6666 6.53185 17.3014 2.16663 11.9166 2.16663ZM11.9166 4.33329C7.72847 4.33329 4.33329 7.72847 4.33329 11.9166C4.33329 16.1048 7.72847 19.5 11.9166 19.5C16.1048 19.5 19.5 16.1048 19.5 11.9166C19.5 7.72847 16.1048 4.33329 11.9166 4.33329Z"
        fill={'currentColor' ?? '#131313'}
        fillRule="evenodd"
        clipRule="evenodd"
        fillOpacity="0.63"
      />
    </Svg>
  ),
  defaultFill: '#131313',
})
