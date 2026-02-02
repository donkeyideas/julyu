import { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { GlassCard, GlassButton, ScreenContainer } from '@/components'
import { colors, spacing, fontSize, gradients } from '@/constants/colors'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const cameraRef = useRef<CameraView>(null)

  const handleCapture = async () => {
    if (!cameraRef.current) return

    try {
      setIsProcessing(true)
      setScanProgress(0)

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      })

      if (photo) {
        // Simulate processing progress
        const interval = setInterval(() => {
          setScanProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              return 100
            }
            return prev + 10
          })
        }, 200)

        // TODO: Send to API for processing
        await new Promise((resolve) => setTimeout(resolve, 2500))

        clearInterval(interval)
        setScanProgress(100)

        Alert.alert(
          'Receipt Scanned!',
          'We found 12 items totaling $52.47. You saved $8.23!',
          [{ text: 'View Details' }, { text: 'OK' }]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo')
    } finally {
      setIsProcessing(false)
      setScanProgress(0)
    }
  }

  const handleGalleryPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true)
        setScanProgress(0)

        // Simulate processing
        const interval = setInterval(() => {
          setScanProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              return 100
            }
            return prev + 10
          })
        }, 200)

        await new Promise((resolve) => setTimeout(resolve, 2500))

        clearInterval(interval)
        setScanProgress(100)

        Alert.alert(
          'Receipt Scanned!',
          'We found 8 items totaling $38.92. You saved $4.15!',
          [{ text: 'View Details' }, { text: 'OK' }]
        )

        setIsProcessing(false)
        setScanProgress(0)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
      setIsProcessing(false)
    }
  }

  if (!permission) {
    return (
      <ScreenContainer variant="scan">
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    )
  }

  if (!permission.granted) {
    return (
      <ScreenContainer variant="scan">
        <View style={styles.centeredContainer}>
          <GlassCard variant="elevated" style={styles.permissionCard}>
            <Ionicons name="camera-outline" size={64} color={colors.primary} />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              We need camera access to scan your receipts and help you track savings.
            </Text>
            <GlassButton
              title="Grant Permission"
              onPress={requestPermission}
              style={styles.permissionButton}
            />
            <GlassButton
              title="Upload from Gallery"
              variant="secondary"
              onPress={handleGalleryPick}
              icon={<Ionicons name="images-outline" size={20} color={colors.text} />}
            />
          </GlassCard>
        </View>
      </ScreenContainer>
    )
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* Glass Overlay Frame - Positioned absolutely over camera */}
      <View style={styles.overlayContainer}>
        <View style={styles.overlay}>
          <BlurView intensity={50} tint="dark" style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <BlurView intensity={50} tint="dark" style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              {/* Corner decorations */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <BlurView intensity={50} tint="dark" style={styles.overlaySide} />
          </View>
          <BlurView intensity={50} tint="dark" style={styles.overlayBottom} />
        </View>

        {/* Controls Panel */}
        <View style={styles.controlsContainer}>
          <GlassCard variant="elevated" innerStyle={styles.controlsCardInner}>
            <Text style={styles.instruction}>
              Position receipt within the frame
            </Text>

            {/* Capture Button */}
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[...gradients.primary]}
                style={styles.captureButtonGradient}
              >
                <Ionicons name="camera" size={32} color="#000" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Gallery Button */}
            <GlassButton
              title="Upload from gallery"
              variant="ghost"
              onPress={handleGalleryPick}
              icon={<Ionicons name="images-outline" size={20} color={colors.primary} />}
            />
          </GlassCard>
        </View>
      </View>

      {/* Processing Modal */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.processingBlur}>
            <GlassCard variant="elevated" style={styles.processingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.processingTitle}>Scanning Receipt...</Text>
              <Text style={styles.processingSubtext}>
                Our AI is extracting prices and items
              </Text>

              {/* Progress Bar */}
              <View style={styles.processingProgressContainer}>
                <View style={styles.processingProgressBackground}>
                  <LinearGradient
                    colors={[...gradients.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.processingProgressBar,
                      { width: `${scanProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.processingProgressText}>{scanProgress}%</Text>
              </View>
            </GlassCard>
          </BlurView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  permissionCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: fontSize['xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  permissionButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 300,
  },
  overlaySide: {
    flex: 1,
  },
  overlayBottom: {
    flex: 1.5,
  },
  scanFrame: {
    width: 280,
    height: 300,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  controlsCardInner: {
    alignItems: 'center',
  },
  instruction: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  captureButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingBlur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  processingCard: {
    alignItems: 'center',
    padding: spacing.xl,
    width: '100%',
  },
  processingTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  processingSubtext: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  processingProgressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  processingProgressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  processingProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  processingProgressText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    width: 40,
  },
})
