/* global maplibregl */

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
  center: [-3.05, 53.23],
  zoom: 14
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

const wmsBase =
  "https://environment.data.gov.uk/geoservices/datasets/04532375-a198-476e-985e-0579a0a11b47/wms";

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

  const width = map.getCanvas().width;
  const height = map.getCanvas().height;

  return `${wmsBase}?service=WMS&version=1.3.0&request=GetMap&layers=Flood_Zones_2_3_Rivers_and_Sea&styles=&format=image/png&transparent=true&crs=EPSG:3857&width=${width}&height=${height}&bbox=${minX},${minY},${maxX},${maxY}`;
}

function updateFloodLayer() {
  const url = buildWMSUrl();

  const bounds = map.getBounds();

  const coords = [
    [bounds.getWest(), bounds.getNorth()],
    [bounds.getEast(), bounds.getNorth()],
    [bounds.getEast(), bounds.getSouth()],
    [bounds.getWest(), bounds.getSouth()]
  ];

  if (map.getSource("flood-image")) {
    map.getSource("flood-image").updateImage({
      url,
      coordinates: coords
    });
  } else {
    map.addSource("flood-image", {
      type: "image",
      url,
      coordinates: coords
    });

    map.addLayer({
      id: "flood-image-layer",
      type: "raster",
      source: "flood-image",
      paint: {
        "raster-opacity": 0.8
      }
    });
  }
}

map.on("load", updateFloodLayer);

map.on("moveend", updateFloodLayer);

document
  .getElementById("toggle-flood-zones")
  .addEventListener("change", e => {
    map.setLayoutProperty(
      "flood-image-layer",
      "visibility",
      e.target.checked ? "visible" : "none"
    );
  });

document
  .getElementById("opacity-flood-zones")
  .addEventListener("input", e => {
    map.setPaintProperty(
      "flood-image-layer",
      "raster-opacity",
      Number(e.target.value)
    );
  });