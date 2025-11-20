import { useQuery, useMutation } from '@tanstack/react-query';
import {
	insertInventoryTransaction,
	getInventoryTransactions,
	getInventoryTransactionsByDateRange,
} from '@/db/inventory';
import { getAllProducts } from '@/db/products';

export function useInventoryMutation() {
    
}