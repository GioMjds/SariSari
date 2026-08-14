import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import { OwnerPinGuardProvider } from '@/components/auth/OwnerPinGuardProvider';
import * as authDb from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';

describe('useOwnerPinGuard & OwnerPinGuardProvider', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    useAuthStore.setState({ isPinConfigured: false });
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Fallback behavior (missing OwnerPinGuardProvider)', () => {
    it('denies the action and logs a configuration error instead of invoking onApproved', async () => {
      jest.spyOn(React, 'useContext').mockReturnValue(null);
      const guard = useOwnerPinGuard();

      const onApproved = jest.fn();

      await guard.runWithPinGuard({
        title: 'Protected Action',
        actionDescription: 'Testing fallback',
        onApproved,
      });

      expect(onApproved).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'OwnerPinGuardProvider is missing from component tree. Action denied.',
      );
    });
  });

  describe('OwnerPinGuardProvider initialization & readiness', () => {
    it('defers querying auth database when isReady is false', async () => {
      const isOwnerPinConfiguredSpy = jest
        .spyOn(authDb, 'isOwnerPinConfigured')
        .mockResolvedValue(true);

      render(
        <OwnerPinGuardProvider isReady={false}>
          {null}
        </OwnerPinGuardProvider>,
      );

      expect(isOwnerPinConfiguredSpy).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isPinConfigured).toBe(false);
    });

    it('queries auth database when isReady is true and updates store', async () => {
      const isOwnerPinConfiguredSpy = jest
        .spyOn(authDb, 'isOwnerPinConfigured')
        .mockResolvedValue(true);

      render(
        <OwnerPinGuardProvider isReady={true}>
          {null}
        </OwnerPinGuardProvider>,
      );

      await waitFor(() => {
        expect(isOwnerPinConfiguredSpy).toHaveBeenCalled();
        expect(useAuthStore.getState().isPinConfigured).toBe(true);
      });
    });

    it('handles rejection gracefully and sets isPinConfigured to false', async () => {
      const isOwnerPinConfiguredSpy = jest
        .spyOn(authDb, 'isOwnerPinConfigured')
        .mockRejectedValue(new Error('no such table: auth_settings'));

      render(
        <OwnerPinGuardProvider isReady={true}>
          {null}
        </OwnerPinGuardProvider>,
      );

      await waitFor(() => {
        expect(isOwnerPinConfiguredSpy).toHaveBeenCalled();
        expect(useAuthStore.getState().isPinConfigured).toBe(false);
      });
    });
  });
});
