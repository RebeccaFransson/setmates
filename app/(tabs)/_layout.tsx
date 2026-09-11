import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0C111D' },
        headerTintColor: '#F8FAFC',
        sceneStyle: { backgroundColor: '#0C111D' },
        tabBarStyle: { backgroundColor: '#101828', borderTopColor: '#182230' },
        tabBarActiveTintColor: '#C7F36B',
        tabBarInactiveTintColor: '#98A2B3',
      }}
    >
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
      <Tabs.Screen name="exercises" options={{ title: 'Exercises' }} />
      <Tabs.Screen name="group" options={{ title: 'Group' }} />
    </Tabs>
  );
}
