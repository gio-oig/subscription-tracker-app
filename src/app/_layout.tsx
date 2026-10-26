import "@/global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loadedFonts, fontError] = useFonts({
    "PlusJakartaSans-Light": require("../../assets/fonts/PlusJakartaSans-Light.ttf"),
    "PlusJakartaSans-Regular": require("../../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("../../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("../../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("../../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "PlusJakartaSans-ExtraBold": require("../../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (loadedFonts || fontError) {
      SplashScreen.hideAsync();
    }
  }, [loadedFonts, fontError]);

  if (!loadedFonts && !fontError) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
