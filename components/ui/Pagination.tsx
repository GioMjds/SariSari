import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <View className="absolute bottom-5 inset-x-0 items-center justify-center z-[999]">
      <View className="flex-row items-center gap-4 bg-primary-500 py-2.5 px-5 rounded-pill shadow-raised">
        {/* Previous Button */}
        <TouchableOpacity
          hitSlop={10}
          onPress={handlePrevious}
          disabled={currentPage === 1}
          className={`p-1.5 ${currentPage === 1 ? 'opacity-40' : 'opacity-100'}`}
        >
          <FontAwesome name="chevron-left" size={16} color="#fff" />
        </TouchableOpacity>

        {/* Page Info */}
        <StyledText
          variant="semibold"
          className="text-white text-md min-w-[50px] text-center"
        >
          {currentPage} / {totalPages}
        </StyledText>

        {/* Next Button */}
        <TouchableOpacity
          hitSlop={10}
          onPress={handleNext}
          disabled={currentPage === totalPages}
          className={`p-1.5 ${currentPage === totalPages ? 'opacity-40' : 'opacity-100'}`}
        >
          <FontAwesome name="chevron-right" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
