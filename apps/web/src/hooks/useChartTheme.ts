import { useTheme } from '../context/ThemeContext';

/**
 * Hook que devuelve colores adaptados al tema actual (light/dark)
 * para todos los componentes de Recharts.
 */
export const useChartTheme = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    isDark,

    // Líneas de la grilla de fondo
    grid: isDark ? '#374151' : '#e5e7eb',

    // Color del texto de los ejes (números/etiquetas)
    axisTick: isDark ? '#9ca3af' : '#6b7280',

    // Línea de los ejes
    axisLine: isDark ? '#4b5563' : '#d1d5db',

    // Texto general (leyendas, labels)
    text: isDark ? '#d1d5db' : '#374151',

    // Estilo del tooltip (caja flotante)
    tooltipStyle: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      borderRadius: 8,
      fontSize: 12,
      color: isDark ? '#f3f4f6' : '#111827',
      boxShadow: isDark
        ? '0 4px 6px -1px rgba(0,0,0,0.4)'
        : '0 4px 6px -1px rgba(9,76,118,0.09)',
    } as React.CSSProperties,

    // Color del título dentro del tooltip
    tooltipLabelStyle: {
      color: isDark ? '#f3f4f6' : '#111827',
      fontWeight: 600,
      marginBottom: 4,
    } as React.CSSProperties,

    // Color del texto de la leyenda
    legendStyle: {
      color: isDark ? '#d1d5db' : '#374151',
      fontSize: 12,
    } as React.CSSProperties,

    // Colores de series (barras, líneas) con mejor contraste por tema
    colors: {
      primary: isDark ? '#5ba3d1' : '#0E7DC2',
      success: isDark ? '#4acf8a' : '#12A150',
      warning: isDark ? '#f0994a' : '#EF8B2C',
      danger: isDark ? '#e04a5e' : '#D7263D',
      accent: isDark ? '#FFC621' : '#FFC621',
      extra: isDark ? '#dd5ce8' : '#9D06D9',
    },

    // Paleta para gráficos de torta (donut)
    pieColors: isDark
      ? ['#5ba3d1', '#FFC621', '#e04a5e', '#4acf8a', '#f0994a', '#dd5ce8', '#7db8dd', '#FFD34D', '#9fcde8', '#e96e7f']
      : ['#0E7DC2', '#FFC621', '#D7263D', '#12A150', '#EF8B2C', '#9D06D9', '#2492CD', '#DBA500', '#0C659E', '#B78900'],
  };
};