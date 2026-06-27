import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type BarcodeScannerMode = 'single' | 'continuous';

/** Per-scan banner info fed in by the parent in continuous mode. */
export interface BarcodeScanResult {
  name: string;
  sku: string;
  /** Unix epoch ms when the scan was accepted. */
  at: number;
  /** Whether the SKU matched an inventory row. */
  found: boolean;
}

export interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  mode: BarcodeScannerMode;
  /** Continuous-mode banner — ignored in 'single' mode. */
  lastScanned?: BarcodeScanResult | null;
  /** Continuous-mode cart item count for the banner. */
  itemCount?: number;
  /** Continuous-mode cart total for the banner. */
  total?: number;
}

// Consumer UPC/EAN formats only. No QR / DataMatrix — sari-sari products
// overwhelmingly use EAN-13, EAN-8, UPC-A, UPC-E, and the two 1D codes
// printed on warehouse labels. Names follow the expo-camera
// `BarcodeType` literal type — note `ean8`/`ean13` (no underscore)
// but `upc_a`/`upc_e` (with underscore).
const ACCEPTED_BARCODE_TYPES = [
  'upc_a',
  'upc_e',
  'ean8',
  'ean13',
  'code39',
  'code128',
] as const;

const SCAN_THROTTLE_MS = 1500;

/**
 * BarcodeScannerModal — full-screen camera scanner with permission
 * flow, viewfinder overlay, and single/continuous modes.
 *
 * Two modes:
 *   • `single` — closes after the first accepted scan. Used by Add
 *     Product registration.
 *   • `continuous` — stays open across multiple scans, shows an
 *     in-viewfinder banner with the last scanned product. Used by
 *     the POS counter checkout flow.
 *
 * Permission handling:
 *   • `granted === undefined` — initial load; show centered spinner.
 *   • `granted === false && canAskAgain === true` — show "Allow Camera"
 *     button calling `requestPermission()`.
 *   • `granted === false && canAskAgain === false` — permanent deny;
 *     show "Open Settings" button calling `Linking.openSettings()`.
 *
 * Throttle: the modal drops duplicate CameraView events for the same
 * barcode within 1500ms before they reach the parent. This is
 * belt-and-suspenders defense against CameraView occasionally firing
 * the same scan 2-3 times — the parent's `applyBarcodeToPosCart`
 * applies a matching throttle against inventory state.
 */
export function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
  mode,
  lastScanned,
  itemCount,
  total,
}: BarcodeScannerModalProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [permission, requestPermission] = useCameraPermissions();
  const lastReadRef = useRef<{ barcode: string; at: number } | null>(null);

  // Reset the local throttle whenever the modal hides so the next
  // opening starts with a clean slate.
  useEffect(() => {
    if (!visible) {
      lastReadRef.current = null;
    }
  }, [visible]);

  const handleBarcodeScanned = useCallback(
    (event: { data: string }) => {
      const barcode = event.data;

      // Defense-in-depth throttle — drops events the CameraView fires
      // multiple times for the same physical scan.
      const now = Date.now();
      const last = lastReadRef.current;
      if (
        last &&
        last.barcode === barcode &&
        now - last.at < SCAN_THROTTLE_MS
      ) {
        return;
      }
      lastReadRef.current = { barcode, at: now };

      // Medium haptic for every accepted scan. Pattern mirrors
      // stores/ToastStore.ts: namespace import + .catch(() => {}) to
      // silently swallow platform errors.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
        () => {},
      );

      onScan(barcode);
    },
    [onScan],
  );

  // Camera is conditionally rendered — never active unless we have
  // permission AND the modal is visible. This avoids the
  // "only one Camera preview active at a time" pitfall documented at
  // https://docs.expo.dev/versions/v54.0.0/sdk/camera/.
  const showCamera = !!permission?.granted && visible;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar style="light" backgroundColor="transparent" />

      <View style={StyleSheet.absoluteFill} className="bg-black">
        {/* Camera surface — null until permission is granted */}
        {showCamera ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [...ACCEPTED_BARCODE_TYPES],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        ) : null}

        {/* Viewfinder overlay — drawn on top of (or instead of) the camera */}
        {showCamera ? <ViewfinderOverlay reducedMotion={reducedMotion} /> : null}

        {/* Top bar — Cancel + Done */}
        {showCamera ? (
          <View
            className="absolute left-0 right-0 flex-row items-center justify-between px-5"
            style={{ top: insets.top + 12 }}
          >
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel scan"
              hitSlop={12}
              className="w-10 h-10 rounded-full bg-black/60 items-center justify-center active:opacity-70"
            >
              <FontAwesome name="times" size={18} color="#FBF7EE" />
            </Pressable>
            {mode === 'continuous' ? (
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Done scanning"
                hitSlop={12}
                className="px-5 py-2.5 rounded-full bg-persimmon-500 shadow-persimmon-glow active:opacity-80"
              >
                <StyledText
                  variant="extrabold"
                  className="text-paper-50 text-sm"
                >
                  Done
                </StyledText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Continuous-mode bottom banner */}
        {showCamera && mode === 'continuous' ? (
          <ScanResultBanner
            lastScanned={lastScanned ?? null}
            itemCount={itemCount ?? 0}
            total={total ?? 0}
            bottomInset={insets.bottom}
          />
        ) : null}

        {/* Permission states — replaces camera surface until granted */}
        {!showCamera && visible ? (
          <PermissionGate
            permission={permission}
            onRequest={async () => {
              await requestPermission();
            }}
            onOpenSettings={() => {
              Linking.openSettings().catch(() => {});
            }}
          />
        ) : null}
      </View>
    </RNModal>
  );
}

interface ViewfinderOverlayProps {
  reducedMotion: boolean;
}

/**
 * Translucent overlay with a center cutout and a pulsing red scan
 * line. The pulsing animation copies the pattern from
 * `app/index.tsx:114-122`: `MotiView` with `from`/`animate` and
 * `transition: { type: 'timing', duration, loop: !reducedMotion }`.
 */
function ViewfinderOverlay({ reducedMotion }: ViewfinderOverlayProps) {
  const cutoutW = '70%';
  const cutoutH = 220;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top dim */}
      <View className="absolute inset-x-0 top-0 bottom-1/2 bg-black/50" />
      {/* Bottom dim */}
      <View className="absolute inset-x-0 top-1/2 bottom-0 bg-black/50" />

      {/* Cutout border + scan line */}
      <View
        className="absolute self-center items-center justify-center"
        style={{ width: cutoutW, height: cutoutH, top: '35%' }}
      >
        {/* Four corner brackets */}
        <CornerBracket
          position="top-left"
          size={24}
          borderWidth={3}
          color="#FBF7EE"
        />
        <CornerBracket
          position="top-right"
          size={24}
          borderWidth={3}
          color="#FBF7EE"
        />
        <CornerBracket
          position="bottom-left"
          size={24}
          borderWidth={3}
          color="#FBF7EE"
        />
        <CornerBracket
          position="bottom-right"
          size={24}
          borderWidth={3}
          color="#FBF7EE"
        />

        {/* Pulsing red scan line — gated on reduce-motion */}
        <MotiView
          from={{ translateY: reducedMotion ? 0 : -cutoutH / 2 + 16 }}
          animate={{ translateY: reducedMotion ? 0 : cutoutH / 2 - 16 }}
          transition={{
            type: 'timing',
            duration: 1800,
            loop: !reducedMotion,
          }}
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            height: 2,
            backgroundColor: '#E85A1F',
            borderRadius: 1,
          }}
        />
      </View>

      {/* Hint above the cutout */}
      <View
        className="absolute self-center items-center"
        style={{ top: '32%' }}
      >
        <StyledText
          variant="medium"
          className="text-paper-50 text-xs uppercase tracking-widest opacity-80"
        >
          Align barcode in frame
        </StyledText>
      </View>
    </View>
  );
}

interface CornerBracketProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: number;
  borderWidth: number;
  color: string;
}

/** Small L-shaped bracket drawn as absolute-positioned borders. */
function CornerBracket({
  position,
  size,
  borderWidth,
  color,
}: CornerBracketProps) {
  const style: any = {
    position: 'absolute',
    width: size,
    height: size,
  };
  switch (position) {
    case 'top-left':
      style.top = 0;
      style.left = 0;
      style.borderTopWidth = borderWidth;
      style.borderLeftWidth = borderWidth;
      break;
    case 'top-right':
      style.top = 0;
      style.right = 0;
      style.borderTopWidth = borderWidth;
      style.borderRightWidth = borderWidth;
      break;
    case 'bottom-left':
      style.bottom = 0;
      style.left = 0;
      style.borderBottomWidth = borderWidth;
      style.borderLeftWidth = borderWidth;
      break;
    case 'bottom-right':
      style.bottom = 0;
      style.right = 0;
      style.borderBottomWidth = borderWidth;
      style.borderRightWidth = borderWidth;
      break;
  }
  style.borderColor = color;
  return <View style={style} />;
}

interface ScanResultBannerProps {
  lastScanned: BarcodeScanResult | null;
  itemCount: number;
  total: number;
  bottomInset: number;
}

/** Bottom banner — shows last scanned product + cart count + total.
 *  Fades in/out via MotiView keyed on `lastScanned?.at`. */
function ScanResultBanner({
  lastScanned,
  itemCount,
  total,
  bottomInset,
}: ScanResultBannerProps) {
  const bannerKey = lastScanned?.at ?? 0;

  let label: string;
  let tone: 'success' | 'danger' | 'idle';

  if (!lastScanned) {
    label = 'Point camera at a barcode';
    tone = 'idle';
  } else if (lastScanned.found) {
    const pesoFmt = (total / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const pieceLabel = itemCount === 1 ? 'piece' : 'pieces';
    label = `Scanned: ${lastScanned.name} — ${itemCount} ${pieceLabel} · ₱${pesoFmt}`;
    tone = 'success';
  } else {
    label = 'Not in inventory';
    tone = 'danger';
  }

  const toneClass =
    tone === 'danger'
      ? 'bg-semantic-danger-50 border-semantic-danger/30'
      : 'bg-paper-50 border-paper-300';
  const textClass =
    tone === 'danger' ? 'text-semantic-danger' : 'text-ink-900';

  return (
    <View
      className="absolute left-4 right-4"
      style={{ bottom: bottomInset + 16 }}
      pointerEvents="none"
    >
      <MotiView
        key={bannerKey}
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: 4 }}
        transition={{ type: 'timing', duration: 220 }}
        className={`rounded-2xl px-4 py-3 border ${toneClass} shadow-paper-lift`}
      >
        <StyledText
          variant={tone === 'idle' ? 'medium' : 'extrabold'}
          className={`text-sm text-center ${textClass}`}
          numberOfLines={2}
        >
          {label}
        </StyledText>
      </MotiView>
    </View>
  );
}

interface PermissionGateProps {
  permission: ReturnType<typeof useCameraPermissions>[0];
  onRequest: () => void | Promise<void>;
  onOpenSettings: () => void;
}

/** Renders one of three states: loading, requestable, blocked. */
function PermissionGate({
  permission,
  onRequest,
  onOpenSettings,
}: PermissionGateProps) {
  // permission is null until the initial async read completes.
  if (!permission || permission.granted === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#FBF7EE" />
      </View>
    );
  }

  if (permission.granted) {
    // Caller should have rendered the camera instead of the gate;
    // nothing to render here. Return null for safety.
    return null;
  }

  const blocked = permission.canAskAgain === false;

  return (
    <View className="flex-1 items-center justify-center bg-black px-8">
      <View className="bg-paper-50 rounded-2xl border border-paper-300 px-6 py-7 items-center shadow-paper-lift">
        <View className="w-14 h-14 rounded-full bg-persimmon-500/15 items-center justify-center mb-4">
          <FontAwesome name="camera" size={26} color="#E85A1F" />
        </View>
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-base text-center"
        >
          {blocked ? 'Camera access blocked' : 'Allow camera access'}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-sm text-center mt-2"
        >
          {blocked
            ? 'SariSari needs your camera to scan product barcodes. Open Settings to enable it.'
            : 'SariSari uses the camera only while the scanner is open. No images are saved.'}
        </StyledText>
        <Pressable
          onPress={blocked ? onOpenSettings : onRequest}
          accessibilityRole="button"
          accessibilityLabel={
            blocked ? 'Open system settings' : 'Grant camera permission'
          }
          className="press-scale mt-5 px-5 py-3 rounded-xl bg-persimmon-500 shadow-persimmon-glow active:opacity-80"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            {blocked ? 'Open Settings' : 'Allow Camera'}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}