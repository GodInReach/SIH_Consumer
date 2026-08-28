import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

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
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: userLat,
          longitude: userLng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {/* Customer Location */}
        <Marker
          coordinate={{ latitude: userLat, longitude: userLng }}
          title="Your Location"
          description="Service Address"
          pinColor="blue"
        />

        {/* Worker Location */}
        {workerLat && workerLng && (
          <Marker
            coordinate={{ latitude: workerLat, longitude: workerLng }}
            title={workerName}
            description="On the way"
            pinColor="green"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
});
