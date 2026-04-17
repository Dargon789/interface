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

export const [EmptySpinner, AnimatedEmptySpinner] = createIcon({
  name: 'EmptySpinner',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <Circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity="0.24" strokeWidth="3" />
    </Svg>
  ),
})
