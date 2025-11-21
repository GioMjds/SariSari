import { DateRange, DateRangeType } from "@/types/reports.types";
import { endOfDay, startOfDay, startOfMonth, subDays } from "date-fns";

export const getDateRangeFromType = (type: DateRangeType): DateRange => {
	const now = new Date();

	switch (type) {
		case 'today':
			return {
				startDate: startOfDay(now),
				endDate: endOfDay(now),
				label: 'Today',
			};
		case 'yesterday':
			const yesterday = subDays(now, 1);
			return {
				startDate: startOfDay(yesterday),
				endDate: endOfDay(yesterday),
				label: 'Yesterday',
			};
		case 'last7days':
			return {
				startDate: startOfDay(subDays(now, 6)),
				endDate: endOfDay(now),
				label: 'Last 7 Days',
			};
		case 'thisMonth':
			return {
				startDate: startOfMonth(now),
				endDate: endOfDay(now),
				label: 'This Month',
			};
		case 'custom':
			return {
				startDate: startOfDay(now),
				endDate: endOfDay(now),
				label: 'Custom',
			};
	}
}
