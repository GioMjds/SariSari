import { QueryClient } from '@tanstack/react-query';
import { invalidateProductDependencies } from '../hooks/useProducts';

describe('invalidateProductDependencies', () => {
  it('invalidates all expected product-related queries when no productId is supplied', () => {
    const queryClient = new QueryClient();
    const spy = jest.spyOn(queryClient, 'invalidateQueries');

    invalidateProductDependencies(queryClient);

    expect(spy).toHaveBeenCalledWith({ queryKey: ['products'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['catalog'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['categories'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['categories-with-count'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['category'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['inventory'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['inventory_transactions'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['report-kpis'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['reports'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['sales-stats'] });
  });

  it('invalidates product detail query when productId is supplied', () => {
    const queryClient = new QueryClient();
    const spy = jest.spyOn(queryClient, 'invalidateQueries');

    invalidateProductDependencies(queryClient, 42);

    expect(spy).toHaveBeenCalledWith({ queryKey: ['products', 'detail', 42] });
  });
});
