import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  INFORMATICO: 'Informático',
  COORDINADOR: 'Coordinador',
  SECRETARIA: 'Secretaría',
};

export default function HomeScreen() {
  const { user, logout, can } = useAuth();
  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const canViewStudents = can('enrollment.view');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />

      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hola, {user.firstName} 👋</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.roleBadge}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#0C659E" />
        <Text style={styles.roleText}>{ROLE_LABELS[user.role] || user.role}</Text>
      </View>

      {/* Próximas funciones */}
      {canViewStudents && (
        <TouchableOpacity
          style={styles.card}
          onPress={() => Alert.alert('Tip', 'Usa la pestaña "Alumnos" abajo para ver la lista completa.')}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#EDFAF3' }]}>
            <Ionicons name="people-outline" size={22} color="#12A150" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Alumnos</Text>
            <Text style={styles.cardText}>Consulta la lista completa con fotos, contactos y matrículas.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <View style={[styles.cardIcon, { backgroundColor: '#DBEEF9' }]}>
          <Ionicons name="camera-outline" size={22} color="#0E7DC2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Subida de fotos</Text>
          <Text style={styles.cardText}>Próximamente en la Fase 4: galería + cámara con reporte detallado.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>

      {/* Permisos */}
      <View style={styles.permCard}>
        <Text style={styles.permTitle}>Permisos activos</Text>
        <PermRow label="Gestionar académico" allowed={can('academic.manage')} />
        <PermRow label="Ver matrículas" allowed={can('enrollment.view')} />
        <PermRow label="Gestionar pagos" allowed={can('payments.manage')} />
        <PermRow label="Ver reportes" allowed={can('reports.view')} />
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: logout },
        ])}
      >
        <Ionicons name="log-out-outline" size={18} color="#D7263D" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PermRow({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <View style={styles.permRow}>
      <Text style={styles.permLabel}>{label}</Text>
      <Text style={allowed ? styles.permYes : styles.permNo}>
        {allowed ? '✓ Sí' : '✗ No'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#094C76',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  hello: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#DBEEF9', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#0C659E' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardText: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 17 },
  permCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  permTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  permRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  permLabel: { fontSize: 13, color: '#6B7280' },
  permYes: { fontSize: 13, fontWeight: '700', color: '#12A150' },
  permNo: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: '#F8D8DC', marginTop: 4, marginBottom: 12,
  },
  logoutText: { color: '#D7263D', fontSize: 15, fontWeight: '600' },
});