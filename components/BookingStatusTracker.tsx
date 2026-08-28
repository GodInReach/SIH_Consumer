import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Circle, Clock, Car, Navigation, Wrench, ThumbsUp } from 'lucide-react-native';
import { BookingStatus } from '../types';

interface BookingStatusTrackerProps {
  currentStatus: BookingStatus;
  workerName?: string;
  eta?: string;
}

const getSteps = (workerName: string, eta: string) => [
  { key: 'pending' as BookingStatus, title: 'Booking Confirmed', subtitle: 'Request broadcasted to nearby workers' },
  { key: 'accepted' as BookingStatus, title: 'Worker Accepted', subtitle: `${workerName} confirmed your booking` },
  { key: 'on_the_way' as BookingStatus, title: 'On the Way', subtitle: `Worker is driving to your address${eta ? ' (ETA ' + eta + ')' : ''}` },
  { key: 'arrived' as BookingStatus, title: 'Arrived at Location', subtitle: 'Worker reached your doorstep' },
  { key: 'in_progress' as BookingStatus, title: 'Work Started', subtitle: 'Repair work in progress' },
  { key: 'completed' as BookingStatus, title: 'Job Completed', subtitle: 'Service finished & ready for rating' },
];

export const BookingStatusTracker: React.FC<BookingStatusTrackerProps> = ({ currentStatus, workerName, eta }) => {
  const STEPS = getSteps(workerName || 'Your worker', eta || '');

  const getStepIndex = (status: BookingStatus) => {
    const idx = STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentIndex = getStepIndex(currentStatus);

  const dynamicSteps = STEPS.map(step => {
    if (step.key === 'accepted') {
      return { ...step, subtitle: `${workerName || 'Your worker'} confirmed your booking` };
    }
    if (step.key === 'on_the_way') {
      return { ...step, subtitle: `Worker is driving to your address${eta ? ` (${eta})` : ''}` };
    }
    return step;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tracking Status</Text>

      <View style={styles.timeline}>
        {dynamicSteps.map((step, index) => {
          const isDone = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <View key={step.key} style={styles.stepRow}>
              {/* Left Column: Icon & Vertical Line */}
              <View style={styles.leftCol}>
                <View
                  style={[
                    styles.iconCircle,
                    isDone && styles.doneCircle,
                    isCurrent && styles.currentCircle,
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} color="#FFFFFF" />
                  ) : (
                    <Circle size={16} color="#CBD5E1" />
                  )}
                </View>

                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      index < currentIndex && styles.doneConnectorLine,
                    ]}
                  />
                )}
              </View>

              {/* Right Column: Step Info */}
              <View style={styles.rightCol}>
                <Text
                  style={[
                    styles.stepTitle,
                    isDone && styles.doneStepTitle,
                    isCurrent && styles.currentStepTitle,
                  ]}
                >
                  {step.title}
                  {isCurrent && <Text style={styles.activeTag}> (ACTIVE)</Text>}
                </Text>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  timeline: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftCol: {
    alignItems: 'center',
    width: 28,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  doneCircle: {
    backgroundColor: '#16A34A',
  },
  currentCircle: {
    backgroundColor: '#2563EB',
  },
  connectorLine: {
    width: 2,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginTop: -2,
    marginBottom: -6,
  },
  doneConnectorLine: {
    backgroundColor: '#16A34A',
  },
  rightCol: {
    flex: 1,
    marginLeft: 12,
    marginTop: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  doneStepTitle: {
    color: '#1E293B',
  },
  currentStepTitle: {
    color: '#2563EB',
    fontWeight: '700',
  },
  activeTag: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '800',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
