/* global maplibregl */
console.log("app.js loaded");

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#ffffff"
        }
      }
    ]
  },
  center: [-3.06, 53.21],
  zoom: 14
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

const floodZonesConfig = {
  id: "flood-zones",
  sourceId: "src-flood-zones",
  baseUrl: "https://environment.data.gov.uk/geoservices/datasets/04532375-a198-476e-985e-0579a0a11b47/wms",
  layerName: "Flood_Zones_2_3_Rivers_and_Sea",
  opacity: 0.9
};

function buildWmsTileUrl(baseUrl, layerName) {
  return `${baseUrl}?service=WMS&request=GetMap&version=1.3.0&layers=${encodeURIComponent(layerName)}&styles=&format=image/png&transparent=true&crs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`;
}

function addFloodZonesLayer() {
  if (map.getSource(floodZonesConfig.sourceId)) return;

  const tileUrl = buildWmsTileUrl(
    floodZonesConfig.baseUrl,
    floodZonesConfig.layerName
  );

  console.log("Flood Zones WMS URL:", tileUrl);

  map.addSource(floodZonesConfig.sourceId, {
    type: "raster",
    tiles: [tileUrl],
    tileSize: 256
  });

  map.addLayer({
    id: floodZonesConfig.id,
    type: "raster",
    source: floodZonesConfig.sourceId,
    layout: {
      visibility: "none"
    },
    paint: {
      "raster-opacity": floodZonesConfig.opacity,
      "raster-fade-duration": 0
    }
  });
}

function setFloodZonesVisibility(visible) {
  if (!map.getLayer(floodZonesConfig.id)) return;

  map.setLayoutProperty(
    floodZonesConfig.id,
    "visibility",
    visible ? "visible" : "none"
  );
}

function setFloodZonesOpacity(opacity) {
  if (!map.getLayer(floodZonesConfig.id)) return;

  map.setPaintProperty(
    floodZonesConfig.id,
    "raster-opacity",
    opacity
  );
}

map.on("load", () => {
  const toggle = document.getElementById("toggle-flood-zones");
  const opacity = document.getElementById("opacity-flood-zones");

  toggle.addEventListener("change", () => {
    try {
      addFloodZonesLayer();
      setFloodZonesVisibility(toggle.checked);
    } catch (error) {
      console.error("Flood Zones layer failed:", error);
      toggle.checked = false;
    }
  });

  opacity.addEventListener("input", () => {
    setFloodZonesOpacity(Number(opacity.value));
  });

  console.log("Map ready for Flood Zones WMS test.");
});