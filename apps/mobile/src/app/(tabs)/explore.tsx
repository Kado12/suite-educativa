import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>🧭 Explorar</Text>
        <Text style={styles.subtitle}>
          Esta pantalla es un placeholder del template.{'\n'}
          La reemplazaremos en la Fase 3 con la lista de alumnos.
        </Text>
        <Text style={styles.subtitle}>
          Mientras tanto, puedes usar la pestaña "Alumnos" abajo para ver la lista completa con fotos, contactos y matrículas.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});