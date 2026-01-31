import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function GuestLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="[code]" />
        </Stack>
    );
}
