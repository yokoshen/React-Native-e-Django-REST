import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button, ErrorBanner, Input } from "../components/ui";
import { confirmPasswordReset, requestPasswordReset } from "../api/auth";
import { getErrorMessage } from "../api/client";
import { colors, spacing } from "../theme";
import { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const paramUid = route.params?.uid ?? "";
  const paramToken = route.params?.token ?? "";
  // If we arrived via a reset link (uid+token), jump straight to the confirm step.
  const [step, setStep] = useState<"request" | "confirm">(
    paramUid && paramToken ? "confirm" : "request"
  );

  const [email, setEmail] = useState("");
  const [uid, setUid] = useState(paramUid);
  const [token, setToken] = useState(paramToken);
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRequest = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const detail = await requestPasswordReset(email.trim());
      setMessage(
        detail +
          " Em ambiente de desenvolvimento, o token aparece no log do backend."
      );
      setStep("confirm");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    setError(null);
    setMessage(null);
    if (!uid.trim() || !token.trim() || !newPassword) {
      setError("Preencha uid, token e a nova senha.");
      return;
    }
    setLoading(true);
    try {
      const detail = await confirmPasswordReset(uid.trim(), token.trim(), newPassword);
      setMessage(detail);
      setTimeout(() => navigation.navigate("Login"), 800);
    } catch (e) {
      setError(getErrorMessage(e, "Não foi possível redefinir a senha."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Redefinir senha</Text>

        <ErrorBanner message={error} />
        {message ? <Text style={styles.success}>{message}</Text> : null}

        {step === "request" ? (
          <>
            <Text style={styles.help}>
              Informe o e-mail da conta. Você receberá um token para redefinir a senha.
            </Text>
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            <Button title="Enviar token" onPress={onRequest} loading={loading} />
            <TouchableOpacity style={styles.link} onPress={() => setStep("confirm")}>
              <Text style={styles.linkText}>Já tenho um token</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.help}>
              Cole o uid e o token recebidos e defina a nova senha.
            </Text>
            <Input label="uid" value={uid} onChangeText={setUid} autoCapitalize="none" />
            <Input label="token" value={token} onChangeText={setToken} autoCapitalize="none" />
            <Input
              label="Nova senha"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <Button title="Redefinir senha" onPress={onConfirm} loading={loading} />
          </>
        )}

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Voltar para o login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  help: { color: colors.muted, fontSize: 14, marginBottom: spacing.md },
  success: { color: colors.success, fontSize: 14, marginBottom: spacing.md },
  link: { marginTop: spacing.md, alignItems: "center" },
  linkText: { color: colors.primary, fontWeight: "600", fontSize: 15 },
});
