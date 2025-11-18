import React from 'react';
import { create } from 'zustand';

interface State {
	visible: boolean;
	title?: string;
	message?: string;
	content?: React.ReactNode;
	showCloseButton?: boolean;

	showDialog: (options: {
		title?: string;
		message?: string;
		content?: React.ReactNode;
		showCloseButton?: boolean;
	}) => void;
	hideDialog: () => void;
}

export const useDialogStore = create<State>((set) => ({
	visible: false,
	title: undefined,
	message: undefined,
	content: undefined,
	showCloseButton: true,

	showDialog: (options) =>
		set({
			visible: true,
			title: options.title,
			message: options.message,
			content: options.content,
			showCloseButton: options.showCloseButton ?? true,
		}),

	hideDialog: () =>
		set({
			visible: false,
			title: undefined,
			message: undefined,
			content: undefined,
		}),
}));
