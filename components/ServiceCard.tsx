import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import {
  Zap,
  Droplets,
  Scissors,
  Hammer,
  Sparkles,
  Wrench,
  Snowflake,
  Laptop,
  HelpCircle,
} from 'lucide-react-native';

interface ServiceCardProps {
  id: string;
  name: string;
  iconName: string;
  onPress: () => void;
}

const getIcon = (iconName: string, color: string = '#2563EB') => {
  const props = { size: 28, color };
  switch (iconName.toLowerCase()) {
    case 'zap':
      return <Zap {...props} />;
    case 'droplet':
    case 'droplets':
      return <Droplets {...props} color="#0284C7" />;
    case 'scissors':
      return <Scissors {...props} color="#D97706" />;
    case 'hammer':
      return <Hammer {...props} color="#B45309" />;
    case 'sparkles':
      return <Sparkles {...props} color="#7C3AED" />;
    case 'wrench':
      return <Wrench {...props} color="#EA580C" />;
    case 'snowflake':
      return <Snowflake {...props} color="#06B6D4" />;
    case 'laptop':
      return <Laptop {...props} color="#4F46E5" />;
    default:
      return <HelpCircle {...props} />;
  }
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  name,
  iconName,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>{getIcon(iconName)}</View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '23%',
    aspectRatio: 0.95,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
});
