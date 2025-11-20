import { FontAwesome } from '@expo/vector-icons';
import { FC } from 'react';
import { TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	totalItems?: number;
	itemsPerPage?: number;
}

const Pagination: FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
}) => {
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
		<View
			style={{
				position: 'absolute',
				bottom: 20,
				left: 0,
				right: 0,
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 999,
			}}
		>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: 16,
					backgroundColor: '#2E073F',
					paddingVertical: 10,
					paddingHorizontal: 20,
					borderRadius: 30,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				{/* Previous Button */}
				<TouchableOpacity
					hitSlop={10}
					onPress={handlePrevious}
					disabled={currentPage === 1}
					style={{
						padding: 6,
						opacity: currentPage === 1 ? 0.4 : 1,
					}}
				>
					<FontAwesome
						name="chevron-left"
						size={16}
						color="#fff"
					/>
				</TouchableOpacity>

				{/* Page Info */}
				<StyledText
					variant="semibold"
					className="text-white text-md"
					style={{ minWidth: 50, textAlign: 'center' }}
				>
					{currentPage} / {totalPages}
				</StyledText>

				{/* Next Button */}
				<TouchableOpacity
					hitSlop={10}
					onPress={handleNext}
					disabled={currentPage === totalPages}
					style={{
						padding: 6,
						opacity: currentPage === totalPages ? 0.4 : 1,
					}}
				>
					<FontAwesome
						name="chevron-right"
						size={16}
						color="#fff"
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default Pagination;
