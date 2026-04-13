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

export const [DotLine, AnimatedDotLine] = createIcon({
  name: 'DotLine',
  getIcon: (props) => (
    <Svg width="100%" viewBox="850 0 300 200" {...props}>
      <Line
        x1="0"
        x2="3000"
        y1="100"
        y2="100"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
        strokeDasharray="1, 45"
      />
    </Svg>
  ),
})
