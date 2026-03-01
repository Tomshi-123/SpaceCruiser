import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

// Typer för nyhetsobjekt från API:et.
type SpaceNewsArticle = {
  id: number;
  title: string;
  image_url: string | null;
};

// Typ för det övergripande API-svaret.
type SpaceNewsResponse = {
  results: SpaceNewsArticle[];
};

const MAX_ARTICLES = 30;

export default function NewsScreen() {
  const [articles, setArticles] = useState<SpaceNewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const cardBorder = useThemeColor({}, "icon");
  const mutedText = useThemeColor({}, "icon");

  // Hämtar senaste rymdnyheterna när skärmen laddas.
  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        setHasError(false);

        const response = await fetch(
          `https://api.spaceflightnewsapi.net/v4/articles/?limit=${MAX_ARTICLES}`,
        );
        const data: SpaceNewsResponse = await response.json();

        if (isMounted) {
          setArticles(data.results ?? []);
        }
      } catch {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNews();

    return () => {
      isMounted = false;
    };
  }, []);

  // Visar laddning/fel och annars en enkel lista med nyhetskort.
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">SpaceNews</ThemedText>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator />
          <ThemedText style={{ color: mutedText }}>
            Laddar nyheter...
          </ThemedText>
        </View>
      ) : null}

      {hasError ? (
        <View style={styles.centerContent}>
          <ThemedText style={{ color: mutedText }}>
            Kunde inte hämta nyheter just nu.
          </ThemedText>
        </View>
      ) : null}

      {!isLoading && !hasError ? (
        <FlatList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: cardBorder }]}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.cardImage, styles.imagePlaceholder]}>
                  <ThemedText style={{ color: mutedText }}>
                    Ingen bild
                  </ThemedText>
                </View>
              )}
              <ThemedText
                numberOfLines={3}
                type="defaultSemiBold"
                style={styles.cardTitle}
              >
                {item.title}
              </ThemedText>
            </View>
          )}
        />
      ) : null}
    </ThemedView>
  );
}

// Stilar för layout och kort.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    gap: 16,
  },
  centerContent: {
    alignItems: "center",
    gap: 10,
  },
  listContent: {
    gap: 14,
    paddingBottom: 32,
  },
  card: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardImage: {
    width: "100%",
    height: 130,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    padding: 10,
    lineHeight: 20,
  },
});
