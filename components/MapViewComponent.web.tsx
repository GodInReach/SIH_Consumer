import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';

interface MapViewProps {
  userLat: number;
  userLng: number;
  workerLat?: number;
  workerLng?: number;
  workerName?: string;
}

export const MapViewComponent: React.FC<MapViewProps> = ({
  userLat,
  userLng,
  workerLat,
  workerLng,
  workerName = 'Worker',
}) => {
  return (
    <View style={styles.webMapContainer}>
      <View style={styles.gridOverlay}>
        <View style={styles.pulseContainer}>
          {/* Customer Pin */}
          <View style={styles.userPin}>
            <MapPin size={22} color="#2563EB" fill="#DBEAFE" />
            <Text style={styles.pinLabel}>You (Anna Nagar)</Text>
          </View>

          {/* Route path */}
          {workerLat && (
            <View style={styles.routeLine}>
              <Text style={styles.etaBadge}>ETA 7 MIN</Text>
            </View>
          )}

          {/* Worker Pin */}
          {workerLat && (
            <View style={styles.workerPin}>
              <Navigation size={22} color="#16A34A" fill="#DCFCE7" />
              <Text style={styles.workerPinLabel}>👷 {workerName}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.coordinatesTag}>
        📍 GPS: {userLat.toFixed(4)}, {userLng.toFixed(4)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  webMapContainer: {
    height: 200,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  gridOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pulseContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userPin: {
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#2563EB',
    marginHorizontal: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  etaBadge: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  workerPin: {
    alignItems: 'center',
  },
  workerPinLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coordinatesTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
