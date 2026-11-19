import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { peopleService, academicService, Student, Sede, Turno } from '../../lib/people.service';
import { useAuth } from '../../context/AuthContext';
import { StudentCard } from '../../components/student-card';

type FilterValue = '' | string;

export default function StudentsScreen() {
  const { can } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [search, setSearch] = useState('');
  const [fSede, setFSede] = useState<FilterValue>('');
  const [fTurno, setFTurno] = useState<FilterValue>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState<'sede' | 'turno' | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canView = can('enrollment.view');

  // Carga de datos (recibe el término de búsqueda como parámetro)
  const fetchData = useCallback(async (searchTerm: string) => {
    if (!canView) return;
    setError(null);
    try {
      const [s, se, t] = await Promise.all([
        peopleService.listStudents(searchTerm.trim() || undefined),
        academicService.listSedes(),
        academicService.listTurnos(),
      ]);
      setStudents(s);
      setSedes(se);
      setTurnos(t);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar alumnos');
    }
  }, [canView]);

  // Carga inicial (sin búsqueda)
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchData('');
      setLoading(false);
    })();
  }, [fetchData]);

  // Debounce de búsqueda (300ms)
  useEffect(() => {
    if (!canView) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      await fetchData(search);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, canView, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(search);
    setRefreshing(false);
  }, [fetchData, search]);

  // Filtrado local por sede y turno
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const enr = s.enrollments?.[0];
      if (fSede && enr?.section?.classroom?.sede?.id !== fSede) return false;
      if (fTurno && enr?.section?.turno?.id !== fTurno) return false;
      return true;
    });
  }, [students, fSede, fTurno]);

  const clearFilters = () => {
    setFSede('');
    setFTurno('');
    setSearch('');
  };

  const hasFilters = !!fSede || !!fTurno || !!search;

  // Pantalla sin permiso
  if (!canView) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={48} color="#9CA3AF" />
        <Text style={styles.noAccessTitle}>Sin acceso</Text>
        <Text style={styles.noAccessText}>No tienes permisos para ver los alumnos.</Text>
      </View>
    );
  }

  // Pantalla de carga inicial
  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0E7DC2" />
        <Text style={styles.loadingText}>Cargando alumnos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Header con búsqueda */}
      <View style={styles.header}>
        <Text style={styles.title}>Alumnos</Text>
        <Text style={styles.subtitle}>
          {filtered.length} {filtered.length === 1 ? 'alumno' : 'alumnos'}
          {hasFilters ? ' (filtrado)' : ''}
        </Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o DNI..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        <FilterChip
          label={fSede ? sedes.find((s) => s.id === fSede)?.name || 'Sede' : 'Todas las sedes'}
          active={!!fSede}
          onClear={() => setFSede('')}
          onOpen={() => openPicker('sede')}
        />
        <FilterChip
          label={fTurno ? turnos.find((t) => t.id === fTurno)?.name || 'Turno' : 'Todos los turnos'}
          active={!!fTurno}
          onClear={() => setFTurno('')}
          onOpen={() => openPicker('turno')}
        />
        {hasFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color="#D7263D" />
            <Text style={styles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Lista de alumnos */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StudentCard student={item} onPress={() => handleStudentPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0E7DC2"
          />
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={48} color="#D7263D" />
              <Text style={styles.emptyTitle}>Error al cargar</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>
                {hasFilters ? 'No se encontraron alumnos' : 'Sin alumnos registrados'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {hasFilters ? 'Intenta ajustar los filtros' : 'Importa alumnos desde la web'}
              </Text>
            </View>
          )
        }
      />

      {/* Pickers simples (modal inline por simplicidad) */}
      <PickerModal
        visible={pickerVisible === 'sede'}
        title="Filtrar por sede"
        options={[{ id: '', name: 'Todas las sedes' }, ...sedes]}
        selected={fSede}
        onSelect={(id) => { setFSede(id); setPickerVisible(null); }}
        onClose={() => setPickerVisible(null)}
      />
      <PickerModal
        visible={pickerVisible === 'turno'}
        title="Filtrar por turno"
        options={[{ id: '', name: 'Todos los turnos' }, ...turnos]}
        selected={fTurno}
        onSelect={(id) => { setFTurno(id); setPickerVisible(null); }}
        onClose={() => setPickerVisible(null)}
      />
    </View>
  );

  function openPicker(type: 'sede' | 'turno') {
    setPickerVisible(type);
  }

  function handleStudentPress(s: Student) {
    // Fase futura: navegación a detalle. Por ahora: alert simple
    const enr = s.enrollments?.[0];
    const info = [
      `${s.lastName}, ${s.firstName}`,
      `Doc: ${s.dni || '—'}`,
      s.phone ? `Tel: ${s.phone}` : null,
      s.email ? `Email: ${s.email}` : null,
      enr ? `\nMatrícula activa:\n• ${enr.section.name}\n• ${enr.section.classroom.sede.name}\n• ${enr.section.turno.name}` : '\nSin matrícula activa',
    ].filter(Boolean).join('\n');
    // En un proyecto real esto sería un modal bonito; alert es suficiente para el MVP
    alert(info);
  }
}

// ===== Componentes auxiliares =====

function FilterChip({
  label, active, onClear, onOpen,
}: { label: string; active: boolean; onClear: () => void; onOpen: () => void }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      <TouchableOpacity onPress={onOpen} style={styles.chipPress}>
        <Ionicons
          name={active ? 'funnel' : 'funnel-outline'}
          size={14}
          color={active ? '#0C659E' : '#6B7280'}
        />
        <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
      {active && (
        <TouchableOpacity onPress={onClear} style={styles.chipClear}>
          <Ionicons name="close" size={14} color="#0C659E" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function PickerModal({
  visible, title, options, selected, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  options: { id: string; name: string }[];
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.pickerCard}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 320 }}>
          {options.map((opt) => {
            const isSelected = opt.id === selected;
            return (
              <TouchableOpacity
                key={opt.id || '__all__'}
                style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                onPress={() => onSelect(opt.id)}
              >
                <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                  {opt.name}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color="#0E7DC2" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// ===== Estilos =====

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 8,
    borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 0 },
  filtersRow: { marginTop: 16, maxHeight: 58 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 999,
    borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: '#DBEEF9', borderColor: '#8CCAEA' },
  chipPress: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#0C659E', fontWeight: '600' },
  chipClear: { paddingHorizontal: 10, paddingVertical: 8, borderLeftWidth: 1, borderLeftColor: '#8CCAEA' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FCEDEF', borderRadius: 999 },
  clearText: { fontSize: 12, color: '#D7263D', fontWeight: '600' },
  listContent: { padding: 20, paddingTop: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#0E7DC2', borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  noAccessTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 12 },
  noAccessText: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17,24,39,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  pickerOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  pickerOptionSelected: { backgroundColor: '#F0F8FD' },
  pickerOptionText: { fontSize: 15, color: '#111827' },
  pickerOptionTextSelected: { color: '#0E7DC2', fontWeight: '600' },
});