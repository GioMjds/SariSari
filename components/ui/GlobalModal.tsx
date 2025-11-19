import React from 'react';
import { useModalStore } from '@/stores/ModalStore';
import Modal from './Modal';

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
