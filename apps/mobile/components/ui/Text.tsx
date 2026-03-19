import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

interface Props extends TextProps {
  variant?: "body" | "label" | "title" | "subtitle" | "caption" | "accent";
}

export function Text({ variant = "body", style, ...props }: Props) {
  return <RNText style={[styles.base, styles[variant], style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
    fontFamily: "System",
  },
  body: {
    fontSize: 14,
    color: Colors.text,
  },
  label: {
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 20,
    fontWeight: "500",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  caption: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  accent: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: "500",
  },
});
