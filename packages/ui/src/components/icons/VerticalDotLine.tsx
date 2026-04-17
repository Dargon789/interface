import PropTypes from 'prop-types'
import React, { memo, forwardRef } from 'react'
import {
  Svg,
  SvgProps,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Symbol,
  Use,
  Defs,
  Stop,
  ClipPath,
  Text,
  Circle,
} from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [VerticalDotLine, AnimatedVerticalDotLine] = createIcon({
  name: 'VerticalDotLine',
  getIcon: (props) => (
    <Svg viewBox="0 0 2 13" fill="none" {...props}>
      <Path
        d="M1 1L1 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 2"
      />
    </Svg>
  ),
})
