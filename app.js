/* global maplibregl */

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
        tileSize: 256
      },

      flood_wms: {
        type: "raster",

        tiles: [
          "https://environment.data.gov.uk/geoservices/datasets/04532375-a198-476e-985e-0579a0a11b47/wms" +
          "?service=WMS" +
          "&version=1.1.1" +
          "&request=GetMap" +
          "&layers=Flood_Zones_2_3_Rivers_and_Sea" +
          "&styles=" +
          "&format=image/png" +
          "&transparent=true" +
          "&srs=EPSG:3857" +
          "&bbox={bbox-epsg-3857}" +
          "&width=256" +
          "&height=256"
        ],

        tileSize: 256
      }

    },

    layers: [

      {
        id: "osm",
        type: "raster",
        source: "osm"
      },

      {
        id: "flood",
        type: "raster",
        source: "flood_wms",
        paint: {
          "raster-opacity": 0.7
        }
      }

    ]

  },

  center: [-2.9659, 53.1884],
  zoom: 13
});

map.addControl(new maplibregl.NavigationControl());

const toggle = document.getElementById("toggle-flood-zones");
const slider = document.getElementById("opacity-flood-zones");
const status = document.getElementById("status");

function updateStatus() {

  status.textContent =
    "Zoom " +
    map.getZoom().toFixed(2) +
    " • Centre " +
    map.getCenter().lng.toFixed(4) +
    ", " +
    map.getCenter().lat.toFixed(4);
}

map.on("load", updateStatus);
map.on("move", updateStatus);

toggle.addEventListener("change", () => {

  map.setLayoutProperty(
    "flood",
    "visibility",
    toggle.checked ? "visible" : "none"
  );

});

slider.addEventListener("input", () => {

  map.setPaintProperty(
    "flood",
    "raster-opacity",
    Number(slider.value)
  );

});