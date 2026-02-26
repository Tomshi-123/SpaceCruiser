import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

type SpaceNewsArticle = {
  id: number;
  title: string;
  image_url: string | null;
};

type SpaceNewsResponse = {
  results: SpaceNewsArticle[];
};

const MAX_ARTICLES = 30;
const ROW_COUNT = 3;

function splitIntoRows(items: SpaceNewsArticle[], rowCount: number) {
  return Array.from({ length: rowCount }, (_, rowIndex) =>
    items.filter((_, itemIndex) => itemIndex % rowCount === rowIndex),
  );
}

export default function NewsScreen() {
  const [articles, setArticles] = useState<SpaceNewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const cardBorder = useThemeColor({}, "icon");
  const mutedText = useThemeColor({}, "icon");

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

  const articleRows = useMemo(
    () => splitIntoRows(articles, ROW_COUNT),
    [articles],
  );

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
        <ScrollView
          contentContainerStyle={styles.rowsContainer}
          showsVerticalScrollIndicator={false}
        >
          {articleRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.rowBlock}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}
              >
                {row.map((article) => (
                  <View
                    key={article.id}
                    style={[styles.card, { borderColor: cardBorder }]}
                  >
                    {article.image_url ? (
                      <Image
                        source={{ uri: article.image_url }}
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
                      {article.title}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </ThemedView>
  );
}

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
  rowsContainer: {
    gap: 20,
    paddingBottom: 32,
  },
  rowBlock: {
    gap: 8,
  },
  cardsRow: {
    gap: 12,
    paddingRight: 16,
  },
  card: {
    width: 220,
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
