/* global maplibregl */

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [-3.05, 53.23],
  zoom: 14
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

const floodConfig = {
  sourceId: "flood-image",
  layerId: "flood-image-layer",
  baseUrl: "https://environment.data.gov.uk/geoservices/datasets/04532375-a198-476e-985e-0579a0a11b47/wms",
  layerName: "Flood_Zones_2_3_Rivers_and_Sea"
};

const toggle = document.getElementById("toggle-flood-zones");
const opacitySlider = document.getElementById("opacity-flood-zones");
const statusEl = document.getElementById("status");

function setStatus(text) {
  statusEl.textContent = text;
}

function buildWMSUrl() {
  const bounds = map.getBounds();

  const sw = maplibregl.MercatorCoordinate.fromLngLat({
    lng: bounds.getWest(),
    lat: bounds.getSouth()
  });

  const ne = maplibregl.MercatorCoordinate.fromLngLat({
    lng: bounds.getEast(),
    lat: bounds.getNorth()
  });

  const worldSize = 40075016.68557849;

  const minX = (sw.x - 0.5) * worldSize;
  const minY = (0.5 - ne.y) * worldSize;
  const maxX = (ne.x - 0.5) * worldSize;
  const maxY = (0.5 - sw.y) * worldSize;

  const width = Math.max(256, map.getCanvas().width);
  const height = Math.max(256, map.getCanvas().height);

  const params = new URLSearchParams({
    service: "WMS",
    version: "1.3.0",
    request: "GetMap",
    layers: floodConfig.layerName,
    styles: "",
    format: "image/png",
    transparent: "true",
    crs: "EPSG:3857",
    width: String(width),
    height: String(height),
    bbox: `${minX},${minY},${maxX},${maxY}`
  });

  return `${floodConfig.baseUrl}?${params.toString()}`;
}

function getImageCoordinates() {
  const b = map.getBounds();
  return [
    [b.getWest(), b.getNorth()],
    [b.getEast(), b.getNorth()],
    [b.getEast(), b.getSouth()],
    [b.getWest(), b.getSouth()]
  ];
}

function ensureFloodLayer(url, coords) {
  if (map.getSource(floodConfig.sourceId)) {
    map.getSource(floodConfig.sourceId).updateImage({
      url,
      coordinates: coords
    });
    return;
  }

  map.addSource(floodConfig.sourceId, {
    type: "image",
    url,
    coordinates: coords
  });

  map.addLayer({
    id: floodConfig.layerId,
    type: "raster",
    source: floodConfig.sourceId,
    paint: {
      "raster-opacity": Number(opacitySlider.value)
    }
  });
}

function updateFloodLayer() {
  if (!toggle.checked) {
    if (map.getLayer(floodConfig.layerId)) {
      map.setLayoutProperty(floodConfig.layerId, "visibility", "none");
    }
    setStatus(`Zoom ${map.getZoom().toFixed(2)} • Flood layer hidden`);
    return;
  }

  const url = buildWMSUrl();
  const coords = getImageCoordinates();

  try {
    ensureFloodLayer(url, coords);
    if (map.getLayer(floodConfig.layerId)) {
      map.setLayoutProperty(floodConfig.layerId, "visibility", "visible");
      map.setPaintProperty(
        floodConfig.layerId,
        "raster-opacity",
        Number(opacitySlider.value)
      );
    }

    setStatus(
      `Zoom ${map.getZoom().toFixed(2)} • Centre ${map.getCenter().lng.toFixed(4)}, ${map.getCenter().lat.toFixed(4)}`
    );
    console.log("Flood WMS URL:", url);
  } catch (error) {
    console.error("Flood WMS update failed:", error);
    setStatus(`Error loading flood layer`);
  }
}

map.on("load", () => {
  updateFloodLayer();
});

map.on("moveend", () => {
  updateFloodLayer();
});

toggle.addEventListener("change", () => {
  updateFloodLayer();
});

opacitySlider.addEventListener("input", () => {
  if (map.getLayer(floodConfig.layerId)) {
    map.setPaintProperty(
      floodConfig.layerId,
      "raster-opacity",
      Number(opacitySlider.value)
    );
  }
});