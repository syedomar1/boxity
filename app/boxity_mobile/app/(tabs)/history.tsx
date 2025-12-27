import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Clock, CheckCircle, Package } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { theme } from '@/constants/theme';

export default function HistoryScreen() {
  const { uploads } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload History</Text>
        <Text style={styles.headerSubtitle}>
          {uploads.length} total uploads
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {uploads.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Uploads Yet</Text>
            <Text style={styles.emptyText}>
              Your upload history will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {uploads.map((upload) => (
              <TouchableOpacity key={upload.id} style={styles.uploadCard}>
                <View style={styles.uploadHeader}>
                  <View style={styles.uploadIcon}>
                    <Package size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.uploadInfo}>
                    <Text style={styles.uploadBatchId}>{upload.batchId}</Text>
                    <Text style={styles.uploadProduct}>{upload.productName}</Text>
                  </View>
                  <View style={[styles.statusBadge, styles[`status_${upload.status}`]]}>
                    {upload.status === 'synced' && (
                      <CheckCircle size={12} color={theme.colors.background} />
                    )}
                    <Text style={styles.statusText}>
                      {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.uploadDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>View Type</Text>
                    <Text style={styles.detailValue}>
                      {upload.viewType === 'first_view' ? 'First View' : 'Second View'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role</Text>
                    <Text style={styles.detailValue}>{upload.actorRole}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Timestamp</Text>
                    <Text style={styles.detailValue}>
                      {new Date(upload.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {upload.ipfsUrl && (
                  <View style={styles.ipfsPreview}>
                    <Image
                      source={{ uri: upload.ipfsUrl }}
                      style={styles.previewImage}
                      contentFit="cover"
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    gap: theme.spacing.md,
  },
  uploadCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  uploadBatchId: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  uploadProduct: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  status_uploaded: {
    backgroundColor: theme.colors.primary,
  },
  status_pending: {
    backgroundColor: theme.colors.warning,
  },
  status_synced: {
    backgroundColor: theme.colors.success,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600' as const,
    color: theme.colors.background,
  },
  uploadDetails: {
    gap: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.text,
  },
  ipfsPreview: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.background,
  },
});
