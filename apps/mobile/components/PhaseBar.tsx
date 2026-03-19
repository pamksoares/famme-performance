import { View, Text, StyleSheet } from "react-native";
import { Colors, PHASE_COLORS, PHASE_LABELS } from "@/constants/theme";

type Phase = "MENSTRUAL" | "FOLLICULAR" | "OVULATORY" | "LUTEAL";

const PHASE_FLEX: Record<Phase, number> = {
  MENSTRUAL: 0.17,
  FOLLICULAR: 0.29,
  OVULATORY: 0.11,
  LUTEAL: 0.43,
};

interface Props {
  currentPhase: Phase;
}

const PHASES: Phase[] = ["MENSTRUAL", "FOLLICULAR", "OVULATORY", "LUTEAL"];

export function PhaseBar({ currentPhase }: Props) {
  return (
    <View>
      <View style={styles.bar}>
        {PHASES.map((phase) => (
          <View
            key={phase}
            style={[
              styles.segment,
              {
                flex: PHASE_FLEX[phase],
                backgroundColor: PHASE_COLORS[phase],
                opacity: phase === currentPhase ? 1 : 0.4,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        {PHASES.map((phase) => (
          <Text
            key={phase}
            style={[
              styles.label,
              phase === currentPhase && styles.labelActive,
            ]}
          >
            {PHASE_LABELS[phase]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    height: 4,
    borderRadius: 99,
    overflow: "hidden",
    gap: 2,
    marginVertical: 12,
  },
  segment: {
    borderRadius: 99,
    height: 4,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 10,
    color: Colors.textDisabled,
  },
  labelActive: {
    color: Colors.accent,
    fontWeight: "500",
  },
});
