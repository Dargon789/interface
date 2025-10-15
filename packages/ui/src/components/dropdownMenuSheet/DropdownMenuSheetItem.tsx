import { type BaseSyntheticEvent, useMemo } from 'react'
import { I18nManager, type Role } from 'react-native'
import { Spacer, type YStackProps } from 'tamagui'
import { getMenuItemColor } from 'ui/src/components/dropdownMenuSheet/utils'
import { CheckCircleFilled } from 'ui/src/components/icons'
import { Flex, type FlexProps } from 'ui/src/components/layout'
import { Text, type TextProps } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable'
import { useEvent } from 'utilities/src/react/hooks'

export type DropdownMenuSheetItemProps = {
  label: string
  icon?: React.ReactNode
  isSelected?: boolean
  onPress: () => void
  handleCloseMenu?: () => void
  disabled?: boolean
  destructive?: boolean
  closeDelay?: number
  textColor?: TextProps['color']
  variant: 'small' | 'medium'
  height?: number
  role?: Role
  subheader?: string
  rightIcon?: React.ReactNode
}

export const DropdownMenuSheetItem = ({
  label,
  icon,
  isSelected,
  onPress,
  disabled,
  destructive,
  closeDelay,
  textColor,
  handleCloseMenu,
  variant,
  height,
  role = 'button',
  subheader,
  rightIcon,
}: DropdownMenuSheetItemProps): JSX.Element => {
  const handlePress = useEvent((e: BaseSyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    onPress()

    if (handleCloseMenu) {
      if (typeof closeDelay === 'number') {
        setTimeout(handleCloseMenu, closeDelay)
      } else {
        handleCloseMenu()
      }
    }
  })

  const flexDirection: FlexProps['flexDirection'] = I18nManager.isRTL ? 'row-reverse' : 'row'
  const touchableAreaHoverStyle: YStackProps['hoverStyle'] = useMemo(
    () => (disabled ? undefined : { backgroundColor: '$surface1Hovered' }),
    [disabled],
  )

  const textColorValue = useMemo(
    () => getMenuItemColor({ overrideColor: textColor, destructive, disabled }),
    [destructive, textColor, disabled],
  )

  return (
    <TouchableArea
      group
      hoverable
      flexGrow={1}
      py="$spacing8"
      px={variant === 'small' ? '$spacing12' : '$spacing8'}
      gap="$spacing8"
      flexDirection={flexDirection}
      justifyContent="space-between"
      alignItems="center"
      disabled={disabled}
      borderRadius="$rounded12"
      width="100%"
      userSelect="none"
      role={role}
      cursor={disabled ? 'default' : 'pointer'}
      backgroundColor="$background"
      height={height}
      hoverStyle={touchableAreaHoverStyle}
      onPress={handlePress}
    >
      <Flex shrink flexDirection={flexDirection} alignItems="center">
        {icon && <Flex flexShrink={0}>{icon}</Flex>}
        {icon && <Spacer size="$spacing8" />}
        <Flex>
          <Text
            flexShrink={1}
            numberOfLines={1}
            ellipsizeMode="tail"
            variant={variant === 'small' ? 'buttonLabel3' : 'buttonLabel2'}
            color={textColorValue}
            $group-hover={destructive ? undefined : { color: disabled ? '$neutral2' : '$neutral1Hovered' }}
          >
            {label}
          </Text>
          {subheader && (
            <Text numberOfLines={1} ellipsizeMode="tail" variant="body4" color="$neutral2">
              {subheader}
            </Text>
          )}
        </Flex>
        {rightIcon && (
          <Flex row alignItems="center">
            <Spacer size="$spacing40" />
            {rightIcon}
          </Flex>
        )}
      </Flex>
      {isSelected !== undefined && (
        <Flex flexShrink={0}>{isSelected ? <CheckCircleFilled size="$icon.20" /> : <Spacer size="$spacing20" />}</Flex>
      )}
    </TouchableArea>
  )
}
