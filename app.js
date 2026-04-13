/* global maplibregl */
console.log("app.js loaded");

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors"
      }
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm"
      }
    ]
  },
  center: [-2.95, 53.35],
  zoom: 10
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

/**
 * Build a tiled WMS URL for MapLibre raster source usage.
 */
function buildWmsTileUrl(baseUrl, layerName, extraParams = {}) {
  const params = new URLSearchParams({
    service: "WMS",
    request: "GetMap",
    version: "1.1.1",
    layers: layerName,
    styles: "",
    format: "image/png",
    transparent: "true",
    srs: "EPSG:3857",
    width: "256",
    height: "256",
    bbox: "{bbox-epsg-3857}",
    ...extraParams
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Build a WFS GetFeature URL returning GeoJSON.
 * Ancient Woodland is being added this way because you asked for the WFS.
 */
function buildWfsGeoJsonUrl(baseUrl, typeName, extraParams = {}) {
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: typeName,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    ...extraParams
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * IMPORTANT:
 * The service URLs below are the ones you requested.
 * The exact internal layer/type names may still need adjusting if the provider's
 * GetCapabilities advertises a different name than the human-readable dataset title.
 */
const wmsConfigs = [
  {
    id: "flood-zones",
    sourceId: "src-flood-zones",
    baseUrl: "https://environment.data.gov.uk/spatialdata/flood-map-for-planning-flood-zones/wms",
    layerName: "Flood Map for Planning Flood Zones",
    opacity: 0.65
  },
  {
    id: "rofsw",
    sourceId: "src-rofsw",
    baseUrl: "https://environment.data.gov.uk/spatialdata/nafra2-risk-of-flooding-from-surface-water/wms",
    layerName: "NaFRA2 Risk of Flooding from Surface Water",
    opacity: 0.65
  },
  {
    id: "historic-flood-map",
    sourceId: "src-historic-flood-map",
    baseUrl: "https://environment.data.gov.uk/spatialdata/historic-flood-map/wms",
    layerName: "Historic Flood Map",
    opacity: 0.65
  },
  {
    id: "priority-habitat",
    sourceId: "src-priority-habitat",
    baseUrl: "https://environment.data.gov.uk/spatialdata/priority-habitat-inventory-england/wms",
    layerName: "Priority Habitat Inventory England",
    opacity: 0.60
  },
  {
    id: "sssi-irz",
    sourceId: "src-sssi-irz",
    baseUrl: "https://environment.data.gov.uk/spatialdata/sssi-impact-risk-zones-england/wms",
    layerName: "SSSI Impact Risk Zones England",
    opacity: 0.50
  }
];

const wfsConfig = {
  id: "ancient-woodland",
  sourceId: "src-ancient-woodland",
  baseUrl: "https://environment.data.gov.uk/spatialdata/ancient-woodland-england/wfs",
  typeName: "Ancient Woodland England"
};

function addWmsLayer(config) {
  const tileUrl = buildWmsTileUrl(config.baseUrl, config.layerName);

  console.log(`Adding WMS layer: ${config.id}`, tileUrl);

  map.addSource(config.sourceId, {
    type: "raster",
    tiles: [tileUrl],
    tileSize: 256
  });

  map.addLayer({
    id: config.id,
    type: "raster",
    source: config.sourceId,
    layout: {
      visibility: "none"
    },
    paint: {
      "raster-opacity": config.opacity,
      "raster-fade-duration": 0
    }
  });
}

async function addAncientWoodlandWfs(config) {
  const geoJsonUrl = buildWfsGeoJsonUrl(config.baseUrl, config.typeName);

  console.log(`Loading WFS layer: ${config.id}`, geoJsonUrl);

  const response = await fetch(geoJsonUrl);
  if (!response.ok) {
    throw new Error(`Failed to load WFS ${config.id}: ${response.status}`);
  }

  const data = await response.json();

  map.addSource(config.sourceId, {
    type: "geojson",
    data
  });

  map.addLayer({
    id: config.id,
    type: "fill",
    source: config.sourceId,
    layout: {
      visibility: "none"
    },
    paint: {
      "fill-color": "#2e7d32",
      "fill-opacity": 0.35,
      "fill-outline-color": "#1b5e20"
    }
  });
}

function setLayerVisibility(layerId, visible) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

function setLayerOpacity(layerId, opacity) {
  if (!map.getLayer(layerId)) return;

  const layer = map.getLayer(layerId);
  if (!layer) return;

  if (layer.type === "raster") {
    map.setPaintProperty(layerId, "raster-opacity", opacity);
  } else if (layer.type === "fill") {
    map.setPaintProperty(layerId, "fill-opacity", opacity);
  }
}

map.on("load", async () => {
  try {
    for (const config of wmsConfigs) {
      addWmsLayer(config);
    }

    await addAncientWoodlandWfs(wfsConfig);

    const toggleInputs = document.querySelectorAll("input[data-layer]");
    toggleInputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        const layerId = event.target.getAttribute("data-layer");
        setLayerVisibility(layerId, event.target.checked);
      });
    });

    const opacityInputs = document.querySelectorAll("input[data-opacity]");
    opacityInputs.forEach((input) => {
      input.addEventListener("input", (event) => {
        const layerId = event.target.getAttribute("data-opacity");
        const opacity = Number(event.target.value);
        setLayerOpacity(layerId, opacity);
      });
    });

    console.log("All requested WMS/WFS layers added.");
  } catch (error) {
    console.error("Error initialising layers:", error);
  }
});