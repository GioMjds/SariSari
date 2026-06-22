import { useModalStore } from '@/stores';
// Import directly from the sibling to avoid a require cycle through the barrel
// (`components/ui/index.ts` re-exports this file alongside `./Modal`).
import { Modal } from './Modal';

export function GlobalModal() {
	const { modals } = useModalStore();

	return (
		<>
			{modals.map((modal) => (
				<Modal key={modal.id} id={modal.id} />
			))}
		</>
	);
}
