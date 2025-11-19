import { Modal, View } from 'react-native';
import StyledText from '../elements/StyledText';

interface DialogProps {
	visible: boolean;
	onClose: () => void;
	title?: string;
	message?: string;
	children?: React.ReactNode;
}

const Dialog = ({
	visible,
	onClose,
	title,
	message,
	children,
}: DialogProps) => {
	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="fade"
			onRequestClose={onClose}
		>
			{/* Backdrop */}
			<View className="flex-1 justify-center items-center bg-black/40 px-4">
				{/* Dialog Container */}
				<View className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-lg border border-accent/20">
					{/* Header */}
					{title && (
						<View className="mb-4">
							<StyledText
								variant="semibold"
								className="text-primary text-2xl text-center"
							>
								{title}
							</StyledText>
						</View>
					)}

					{/* Content */}
					<View className="mb-6">
						{message && (
							<StyledText
								variant="medium"
								className="text-text-secondary text-center leading-6"
							>
								{message}
							</StyledText>
						)}
						{children && <View>{children}</View>}
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default Dialog;
