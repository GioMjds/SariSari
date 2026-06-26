import { getTabs, Tab } from '@/constants';
import { FontAwesome } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';

export const StyledTab = memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  // Tab labels are translated on each render so a language switch
  // updates the bar in place without remounting.
  const visibleRoutes = useMemo<Tab[]>(() => getTabs(t).slice(0, 5), [t]);

  const handlePress = useCallback(
    (href: Href) => {
      const hrefString = typeof href === 'object' ? href.pathname : href;
      const shouldNavigate =
        hrefString === '/'
          ? pathname !== '/' && pathname !== ''
          : pathname !== hrefString && !pathname.startsWith(`${hrefString}/`);

      if (shouldNavigate) router.replace(href);
    },
    [pathname, router],
  );

  return (
    <View
      className="bg-white px-6 py-4 shadow-xl shadow-black"
      style={{ elevation: 6 }}
    >
      <View className="flex-row justify-between items-center">
        {visibleRoutes.map((tab: Tab) => {
          const hrefString =
            typeof tab.href === 'object' ? tab.href.pathname : tab.href;
          const isFocused =
            hrefString === '/'
              ? pathname === '/' || pathname === ''
              : pathname === hrefString ||
                pathname.startsWith(`${hrefString}/`);

          return (
            <TouchableOpacity
              key={hrefString}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused, disabled: isFocused }}
              onPress={() => handlePress(tab.href)}
              className={`flex-1 items-center py-2 ${isFocused ? 'rounded-xl bg-secondary-50' : ''}`}
              activeOpacity={0.2}
              disabled={isFocused}
            >
              <FontAwesome
                name={tab.icon}
                size={20}
                color={isFocused ? '#B45309' : '#A8A29E'}
              />
              <StyledText
                variant={isFocused ? 'extrabold' : 'light'}
                className={`text-md leading-4 mt-1 text-center ${isFocused ? 'text-primary-500' : 'text-warm-500'}`}
              >
                {tab.name}
              </StyledText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

StyledTab.displayName = 'StyledTab';
