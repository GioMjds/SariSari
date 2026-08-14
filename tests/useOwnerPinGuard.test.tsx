import React from 'react';
import { Button } from 'react-native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import { OwnerPinGuardProvider } from '@/components/auth/OwnerPinGuardProvider';
import * as authDb from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { Alert } from '@/utils';
import { initI18n } from '@/lib/i18n';

describe('useOwnerPinGuard & OwnerPinGuardProvider', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    await initI18n();
  });

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

  describe('runWithPinGuard guard flow', () => {
    const TestConsumer = ({ onApproved }: { onApproved: () => void }) => {
      const { runWithPinGuard } = useOwnerPinGuard();
      return (
        <Button
          title="Trigger Action"
          onPress={() =>
            runWithPinGuard({
              title: 'Sensitive Operation',
              actionDescription: 'Needs owner permission',
              onApproved,
            })
          }
        />
      );
    };

    it('fails closed when isOwnerPinConfigured throws: clears pending action, shows alert, does not show setup', async () => {
      useAuthStore.setState({ isPinConfigured: true });
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const isOwnerPinConfiguredSpy = jest
        .spyOn(authDb, 'isOwnerPinConfigured')
        .mockRejectedValue(new Error('Database disk image is malformed'));

      const onApproved = jest.fn();

      const { getByText, queryByText } = await render(
        <OwnerPinGuardProvider isReady={false}>
          <TestConsumer onApproved={onApproved} />
        </OwnerPinGuardProvider>,
      );

      fireEvent.press(getByText('Trigger Action'));

      await waitFor(() => {
        expect(isOwnerPinConfiguredSpy).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith(
          'Owner PIN Unavailable',
          'Owner PIN verification is currently unavailable. Please try again.',
        );
      });

      expect(onApproved).not.toHaveBeenCalled();
      // Should not set isPinConfigured to false
      expect(useAuthStore.getState().isPinConfigured).toBe(true);
      // Should not show setup modal or challenge modal
      expect(queryByText(/Set Up Owner PIN|Mag-set up ng Owner PIN/i)).toBeNull();
      expect(queryByText('Sensitive Operation')).toBeNull();
    });

    it('shows setup modal only when isOwnerPinConfigured resolves false', async () => {
      jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(false);
      const onApproved = jest.fn();

      const { getByText, queryByText } = await render(
        <OwnerPinGuardProvider isReady={false}>
          <TestConsumer onApproved={onApproved} />
        </OwnerPinGuardProvider>,
      );

      fireEvent.press(getByText('Trigger Action'));

      await waitFor(() => {
        expect(useAuthStore.getState().isPinConfigured).toBe(false);
        expect(
          queryByText(/Set Up Owner PIN|Mag-set up ng Owner PIN/i),
        ).toBeTruthy();
      });

      expect(queryByText('Sensitive Operation')).toBeNull();
      expect(onApproved).not.toHaveBeenCalled();
    });

    it('shows challenge modal when isOwnerPinConfigured resolves true', async () => {
      jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(true);
      const onApproved = jest.fn();

      const { getByText, queryByText } = await render(
        <OwnerPinGuardProvider isReady={false}>
          <TestConsumer onApproved={onApproved} />
        </OwnerPinGuardProvider>,
      );

      fireEvent.press(getByText('Trigger Action'));

      await waitFor(() => {
        expect(useAuthStore.getState().isPinConfigured).toBe(true);
        expect(queryByText('Sensitive Operation')).toBeTruthy();
      });

      expect(
        queryByText(/Set Up Owner PIN|Mag-set up ng Owner PIN/i),
      ).toBeNull();
      expect(onApproved).not.toHaveBeenCalled();
    });
  });
});
