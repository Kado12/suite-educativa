import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AppTabs } from '@/components/app-tabs';
import { useAuth } from '@/context/AuthContext';

export default function TabsLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#094C76' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  return <AppTabs />;
}