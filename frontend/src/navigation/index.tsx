import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme";
import { AppStackParamList, AuthStackParamList } from "./types";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import TaskListScreen from "../screens/TaskListScreen";
import TaskFormScreen from "../screens/TaskFormScreen";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

// Deep link config so a password-reset URL (todo://reset-password?uid=..&token=..)
// or the web equivalent opens the ForgotPassword screen with params.
const linking = {
  prefixes: ["todo://", "http://localhost:8081", "http://localhost:19006"],
  config: {
    screens: {
      ForgotPassword: "reset-password",
      Login: "login",
      Register: "register",
      TaskList: "tasks",
    },
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <AppStack.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{ title: "Minhas tarefas" }}
      />
      <AppStack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{ title: "Tarefa", presentation: "modal" }}
      />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
