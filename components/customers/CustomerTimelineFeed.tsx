import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { CustomerTimelineItem } from '@/types/credits.types';
import { formatPesos } from '@/lib';

interface CustomerTimelineFeedProps {
  items: CustomerTimelineItem[];
}

export const CustomerTimelineFeed: React.FC<CustomerTimelineFeedProps> = ({
  items,
}) => {
  return (
    <View className="px-4 py-2">
      <StyledText variant="extrabold" className="text-ink-800 text-base mb-2">
        Activity Timeline
      </StyledText>

      {items.length === 0 ? (
        <StyledText
          variant="regular"
          className="text-ink-400 text-xs py-4 text-center"
        >
          No recent activity recorded for this customer.
        </StyledText>
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center justify-between py-2.5 border-b border-paper-200"
          >
            <View>
              <StyledText variant="semibold" className="text-ink-700 text-sm">
                {item.description}
              </StyledText>
              {item.details && (
                <StyledText
                  variant="regular"
                  className="text-ink-400 text-xs mt-0.5"
                >
                  {item.details}
                </StyledText>
              )}
            </View>
            <StyledText
              variant="extrabold"
              className={`text-sm ${item.type === 'payment' ? 'text-sage-700' : 'text-cinnamon-700'}`}
            >
              {item.type === 'payment' ? '-' : '+'}
              {formatPesos(item.amount)}
            </StyledText>
          </View>
        ))
      )}
    </View>
  );
};
