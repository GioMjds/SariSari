import { useModalStore } from '@/stores';
import { Modal } from '@/components/ui';

export default function GlobalModal() {
	const { modals } = useModalStore();

	return (
		<>
			{modals.map((modal) => (
				<Modal key={modal.id} id={modal.id} />
			))}
		</>
	);
}
