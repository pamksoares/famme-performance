import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, Radius } from "@/constants/theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🌿",
    title: "Seu ciclo, seu superpoder",
    body: "O app acompanha sua fase do ciclo e calcula um score diário de performance. Treine com o seu corpo, não contra ele.",
  },
  {
    emoji: "📊",
    title: "Score diário personalizado",
    body: "Cada dia recebe uma nota de 0 a 100 baseada no seu HRV, sono e fase hormonal. Saiba quando dar tudo e quando recuperar.",
  },
  {
    emoji: "⌚",
    title: "Conecte seus dados",
    body: "Integre com Apple Health, Garmin ou Whoop para preencher automaticamente os dados de HRV, sono e frequência cardíaca.",
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  }

  function goNext() {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      router.replace("/(auth)/login");
    }
  }

  function skip() {
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={skip} accessibilityLabel="Pular onboarding" accessibilityRole="button">
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.btnWrap}>
        <TouchableOpacity
          style={styles.btn}
          onPress={goNext}
          accessibilityLabel={activeIndex === SLIDES.length - 1 ? "Começar" : "Próximo"}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>
            {activeIndex === SLIDES.length - 1 ? "Começar" : "Próximo →"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  skipRow: {
    alignItems: "flex-end",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  skipText: { fontSize: 14, color: Colors.textMuted },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl * 2,
    gap: Spacing.xl,
  },
  emojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  emoji: { fontSize: 44 },
  slideTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  slideBody: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 20,
  },
  btnWrap: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0a0a08",
  },
});
