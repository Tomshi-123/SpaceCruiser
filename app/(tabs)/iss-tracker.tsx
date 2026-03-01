import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

// Typ för positionsdata från ISS-API:et.
type IssLocation = {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
};

const ISS_API_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const REFRESH_MS = 5000;

const WORLD_MAP_URI =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1920px-World_map_-_low_resolution.svg.png";

// Håller markören inom kartans synliga yta.
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function IssTrackerScreen() {
  const [issLocation, setIssLocation] = useState<IssLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });

  const mutedText = useThemeColor({}, "icon");
  const mapBorder = useThemeColor({}, "icon");
  const markerColor = useThemeColor({}, "issMarker");
  const tintColor = useThemeColor({}, "tint");

  // Hämtar ISS-position direkt och sedan löpande var femte sekund.
  useEffect(() => {
    let isMounted = true;

    async function loadIssLocation() {
      try {
        const response = await fetch(ISS_API_URL);
        const data: IssLocation = await response.json();

        if (!isMounted) {
          return;
        }

        setIssLocation(data);
        setHasError(false);
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

    loadIssLocation();
    const intervalId = setInterval(loadIssLocation, REFRESH_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const hasMap = mapSize.width > 0 && mapSize.height > 0;

  // Räknar ut position för markören på webbkartan.
  const markerPosition =
    hasMap && issLocation
      ? {
          left: clamp(
            ((issLocation.longitude + 180) / 360) * mapSize.width,
            0,
            mapSize.width,
          ),
          top: clamp(
            ((90 - issLocation.latitude) / 180) * mapSize.height,
            0,
            mapSize.height,
          ),
        }
      : null;

  const lastUpdatedText = issLocation
    ? new Date(issLocation.timestamp * 1000).toLocaleTimeString("sv-SE")
    : null;

  function handleMapLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setMapSize({ width, height });
  }

  // Visar karta, status för ISS.
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">ISS Tracker</ThemedText>

      {issLocation ? (
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: mapBorder }]}>
            <ThemedText style={{ color: mutedText }}>Latitud</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>
              {issLocation.latitude.toFixed(4)}°
            </ThemedText>
          </View>

          <View style={[styles.statCard, { borderColor: mapBorder }]}>
            <ThemedText style={{ color: mutedText }}>Longitud</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>
              {issLocation.longitude.toFixed(4)}°
            </ThemedText>
          </View>

          <View style={[styles.statCard, { borderColor: mapBorder }]}>
            <ThemedText style={{ color: mutedText }}>Hastighet</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>
              {Math.round(issLocation.velocity)} km/h
            </ThemedText>
          </View>

          <View style={[styles.statCard, { borderColor: mapBorder }]}>
            <ThemedText style={{ color: mutedText }}>Höjd</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>
              {issLocation.altitude.toFixed(1)} km
            </ThemedText>
          </View>
        </View>
      ) : null}

      <View
        style={[styles.mapContainer, { borderColor: mapBorder }]}
        onLayout={handleMapLayout}
      >
        {Platform.OS === "web" ? (
          <>
            <Image
              source={{ uri: WORLD_MAP_URI }}
              style={styles.mapImage}
              contentFit="cover"
            />

            {markerPosition ? (
              <View
                style={[
                  styles.markerWrapper,
                  {
                    left: markerPosition.left,
                    top: markerPosition.top,
                  },
                ]}
                pointerEvents="none"
              >
                <View
                  style={[styles.markerGlow, { backgroundColor: markerColor }]}
                />
                <View
                  style={[styles.markerDot, { backgroundColor: markerColor }]}
                />
              </View>
            ) : null}
          </>
        ) : (
          <MapView
            style={styles.mapImage}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: 20,
              longitude: 0,
              latitudeDelta: 120,
              longitudeDelta: 120,
            }}
            zoomEnabled
            zoomTapEnabled
            scrollEnabled
            rotateEnabled
            pitchEnabled={false}
            showsCompass={false}
            showsScale={false}
            toolbarEnabled={false}
          >
            {issLocation ? (
              <Marker
                coordinate={{
                  latitude: issLocation.latitude,
                  longitude: issLocation.longitude,
                }}
                title="ISS"
                description="Internationella rymdstationen"
                pinColor={markerColor}
              />
            ) : null}
          </MapView>
        )}
      </View>

      {isLoading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator />
          <ThemedText style={{ color: mutedText }}>
            Hämtar ISS-position...
          </ThemedText>
        </View>
      ) : null}

      {hasError ? (
        <ThemedText style={{ color: mutedText }}>
          Kunde inte hämta ISS-position just nu.
        </ThemedText>
      ) : null}

      {issLocation ? (
        <View style={styles.metaBlock}>
          <ThemedText style={[styles.footerText, { color: mutedText }]}>
            ISS uppdateras var 5:e sekund • Realtidsdata från Where The ISS At
            API
          </ThemedText>
          {lastUpdatedText ? (
            <ThemedText style={[styles.footerText, { color: mutedText }]}>
              Senast uppdaterad: {lastUpdatedText}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </ThemedView>
  );
}

// Stilar för layout, kort, karta och statusrader.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 12,
    gap: 14,
  },
  statsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "48.6%",
    gap: 2,
  },
  mapContainer: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    flex: 1,
    minHeight: 260,
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  markerWrapper: {
    position: "absolute",
    transform: [{ translateX: -8 }, { translateY: -8 }],
    alignItems: "center",
    justifyContent: "center",
  },
  markerGlow: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    opacity: 0.35,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaBlock: {
    alignItems: "center",
    gap: 4,
    paddingBottom: 6,
  },
  footerText: {
    fontSize: 13,
    textAlign: "center",
  },
});
