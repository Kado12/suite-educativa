import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StudentCardProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string | null;
    docType?: string;
    phone: string | null;
    email: string | null;
    photoUrl: string | null;
    enrollments?: {
      section: {
        name: string;
        turno: { name: string };
        classroom: { sede: { name: string } };
      };
    }[];
  };
  onPress?: () => void;
}

export function StudentCard({ student, onPress }: StudentCardProps) {
  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  const enrollment = student.enrollments?.[0];
  const hasEnrollment = !!enrollment;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.card}
    >
      {/* Foto o placeholder */}
      <View style={styles.avatar}>
        {student.photoUrl ? (
          <Image source={{ uri: student.photoUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>

      {/* Datos */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {student.lastName}, {student.firstName}
          </Text>
          <View style={[styles.statusBadge, hasEnrollment ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, hasEnrollment ? styles.textActive : styles.textInactive]}>
              {hasEnrollment ? 'Activo' : 'Sin matricular'}
            </Text>
          </View>
        </View>

        <Text style={styles.dni}>
          {student.docType === 'CARNET' ? 'CE: ' : ''}{student.dni || '—'}
        </Text>

        {/* Contacto */}
        <View style={styles.contactRow}>
          {student.phone && (
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={12} color="#6B7280" />
              <Text style={styles.contactText} numberOfLines={1}>{student.phone}</Text>
            </View>
          )}
          {student.email && (
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={12} color="#6B7280" />
              <Text style={styles.contactText} numberOfLines={1}>{student.email}</Text>
            </View>
          )}
        </View>

        {/* Sección activa */}
        {hasEnrollment && (
          <View style={styles.sectionBox}>
            <View style={styles.sectionRow}>
              <Ionicons name="school-outline" size={12} color="#0E7DC2" />
              <Text style={styles.sectionName} numberOfLines={1}>{enrollment.section.name}</Text>
            </View>
            <View style={styles.sectionMeta}>
              <Ionicons name="location-outline" size={11} color="#9CA3AF" />
              <Text style={styles.metaText}>{enrollment.section.classroom.sede.name}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Ionicons name="time-outline" size={11} color="#9CA3AF" />
              <Text style={styles.metaText}>{enrollment.section.turno.name}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEEF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: { width: 56, height: 56, resizeMode: 'cover' },
  avatarText: { color: '#0E7DC2', fontSize: 18, fontWeight: '700' },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusActive: { backgroundColor: '#EDFAF3', borderWidth: 1, borderColor: '#71D09A' },
  statusInactive: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  statusText: { fontSize: 10, fontWeight: '700' },
  textActive: { color: '#12A150' },
  textInactive: { color: '#6B7280' },
  dni: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  contactRow: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1, maxWidth: '48%' },
  contactText: { fontSize: 11, color: '#6B7280', flexShrink: 1 },
  sectionBox: {
    marginTop: 8,
    backgroundColor: '#F0F8FD',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DBEEF9',
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionName: { fontSize: 12, fontWeight: '600', color: '#0C659E', flex: 1 },
  sectionMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: 11, color: '#6B7280' },
  metaDot: { fontSize: 11, color: '#9CA3AF' },
});