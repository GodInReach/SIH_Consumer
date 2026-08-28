import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, Zap, ArrowRight } from 'lucide-react-native';

interface EmergencyHeaderProps {
  onPress: () => void;
}

export const EmergencyHeader: React.FC<EmergencyHeaderProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={24} color="#DC2626" />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>INSTANT DISPATCH ⚡</Text>
          </View>
          <Text style={styles.title}>🚨 EMERGENCY HELP</Text>
          <Text style={styles.subtitle}>
            Water leak, short circuit, locked out? Get help in 5-10 mins.
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Text style={styles.btnText}>Find Emergency Workers</Text>
        <ArrowRight size={18} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  badgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
