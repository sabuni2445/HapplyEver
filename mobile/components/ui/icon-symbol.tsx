// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Partial<Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'calendar': 'event',
  'creditcard.fill': 'credit-card',
  'person.2.fill': 'people',
  'person.circle.fill': 'account-circle',
  'pencil': 'edit',
  'envelope': 'mail',
  'photo': 'image',
  'magnifyingglass': 'search',
  'calendar.badge.clock': 'schedule',
  'explore': 'explore',
  'star.fill': 'star',
  'star': 'star-border',
  'trash': 'delete',
  'video': 'videocam',
  'text.alignleft': 'format-align-left',
  'text.aligncenter': 'format-align-center',
  'text.alignright': 'format-align-right',
  'briefcase.fill': 'work',
  'checkmark.shield.fill': 'verified-user',
  'qrcode': 'qr-code',
  'safari.fill': 'explore',
  'sparkles': 'auto-awesome',
  'arrow.right': 'arrow-forward',
  'plus': 'add',
  'arrow.left.arrow.right': 'swap-horiz',
  'arrow.right.square': 'open-in-new',
  'bubble.left.and.bubble.right.fill': 'chat',
  'camera.fill': 'photo-camera',
  'checkmark.circle.fill': 'check-circle',
  'doc.on.doc': 'content-copy',
  'mappin.and.ellipse': 'place',
  'message.fill': 'message',
  'person.2': 'people-outline',
  'person.fill': 'person',
  'video.fill': 'videocam',
  'xmark': 'close',
  'trash.fill': 'delete',
  'heart.fill': 'favorite',
  'photo.fill.on.rectangle.fill': 'collections',
  'ticket.fill': 'local-activity',
  'photo.on.rectangle.angled': 'filter-none',
  'info.circle.fill': 'info',
  'mappin.circle.fill': 'add-location',
  'list.bullet.clipboard.fill': 'assignment',
  'star.bubble.fill': 'rate-review',
  'shield.fill': 'security',
  'checkmark.seal.fill': 'verified',
  'checkmark': 'check',
  'calendar.badge.plus': 'add-task',
  'clock': 'access-time',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
