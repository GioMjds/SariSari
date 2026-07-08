import React from 'react';
import {
  View,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { Supplier } from '@/types/suppliers.types';

interface ProductSupplierTabProps {
  supplier: Supplier | null;
  isLoading: boolean;
  onLinkSupplier: () => void;
}

export const ProductSupplierTab = React.memo(function ProductSupplierTab({
  supplier,
  isLoading,
  onLinkSupplier,
}: ProductSupplierTabProps) {
  const handleCall = () => {
    if (supplier?.contact) {
      Linking.openURL(`tel:${supplier.contact}`).catch((err) => {
        console.error('Failed to open dialer:', err);
      });
    }
  };

  const handleSMS = () => {
    if (supplier?.contact) {
      Linking.openURL(`sms:${supplier.contact}`).catch((err) => {
        console.error('Failed to open messages:', err);
      });
    }
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center py-12 px-8">
        <ActivityIndicator size="large" color="#E85A1F" />
        <StyledText variant="medium" className="text-ink-500 text-sm mt-3">
          Loading supplier details...
        </StyledText>
      </View>
    );
  }

  if (!supplier) {
    return (
      <View className="flex-1 items-center justify-center py-12 px-6">
        <View className="w-16 h-16 rounded-full bg-paper-100 border border-ink-200 items-center justify-center mb-4">
          <Ionicons name="business-outline" size={32} color="#A89F90" />
        </View>
        <StyledText
          variant="extrabold"
          className="text-ink-700 text-base text-center mb-1"
        >
          No Supplier Linked
        </StyledText>
        <StyledText
          variant="medium"
          className="text-ink-400 text-sm text-center max-w-[260px] mb-6"
        >
          Connect this product to a supplier to track who you purchase stock
          from.
        </StyledText>
        <TouchableOpacity
          onPress={onLinkSupplier}
          activeOpacity={0.8}
          className="bg-persimmon-500 rounded-xl px-6 py-3.5 flex-row items-center gap-2 active:scale-[0.97]"
        >
          <FontAwesome name="edit" size={14} color="#FBF7EE" />
          <StyledText variant="semibold" className="text-white text-sm">
            Link a Supplier
          </StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      {/* Supplier Card */}
      <View className="bg-white rounded-xl border border-ink-100 shadow-sm p-5 mb-4">
        {/* Name and Icon */}
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-xl bg-cinnamon-50 border border-cinnamon-100 items-center justify-center mr-4">
            <Ionicons name="business" size={24} color="#623418" />
          </View>
          <View className="flex-1">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-lg leading-6"
            >
              {supplier.name}
            </StyledText>
            <StyledText
              variant="medium"
              className="text-ink-400 text-xs mt-0.5"
            >
              Linked Supplier
            </StyledText>
          </View>
        </View>

        {/* Contact information */}
        {supplier.contact ? (
          <View className="border-t border-ink-100 pt-4 mb-4">
            <StyledText
              variant="semibold"
              className="text-ink-400 text-[10px] tracking-widest uppercase mb-2"
            >
              Contact Details
            </StyledText>
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="call-outline" size={16} color="#7A7165" />
              <StyledText variant="semibold" className="text-ink-800 text-base">
                {supplier.contact}
              </StyledText>
            </View>

            {/* Dial / SMS buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCall}
                activeOpacity={0.8}
                className="flex-1 bg-persimmon-50 border border-persimmon-100 rounded-xl py-3 items-center justify-center flex-row gap-2 active:scale-[0.97]"
              >
                <Ionicons name="call" size={14} color="#E85A1F" />
                <StyledText
                  variant="semibold"
                  className="text-persimmon-700 text-sm"
                >
                  Call Supplier
                </StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSMS}
                activeOpacity={0.8}
                className="flex-1 bg-sage-50 border border-sage-200 rounded-xl py-3 items-center justify-center flex-row gap-2 active:scale-[0.97]"
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={14}
                  color="#4F7A24"
                />
                <StyledText
                  variant="semibold"
                  className="text-sage-700 text-sm"
                >
                  Message
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="border-t border-ink-100 pt-4 mb-4">
            <StyledText
              variant="semibold"
              className="text-ink-400 text-[10px] tracking-widest uppercase mb-1"
            >
              Contact Details
            </StyledText>
            <StyledText
              variant="medium"
              className="text-ink-400 text-sm italic"
            >
              No contact information saved.
            </StyledText>
          </View>
        )}

        {/* Notes */}
        <View className="border-t border-ink-100 pt-4">
          <StyledText
            variant="semibold"
            className="text-ink-400 text-[10px] tracking-widest uppercase mb-2"
          >
            Supplier Notes
          </StyledText>
          {supplier.notes?.trim() ? (
            <StyledText
              variant="medium"
              className="text-ink-700 text-sm leading-5"
            >
              {supplier.notes}
            </StyledText>
          ) : (
            <StyledText
              variant="medium"
              className="text-ink-400 text-sm italic"
            >
              No notes saved for this supplier.
            </StyledText>
          )}
        </View>
      </View>
    </View>
  );
});
