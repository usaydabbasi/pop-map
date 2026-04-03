# Population Growth Rate Dashboard

An interactive GIS dashboard that visualizes annual population growth rates by country from 1950 to 2023, built with Mapbox GL JS and Turf.js.

**Live Demo:** [usaydabbasi.github.io/pop-map](https://usaydabbasi.github.io/pop-map/)

---

## Features

- **Symbol Map** — Countries are  marked with directional arrows indicating population growth, decline, or neutral status
- **Year Slider** — Scrub through every year from 1950 to 2023 via a control panel slider or the bottom timeline
- **Play Animation** — Hit the play button to automatically animate through the decades
- **Country Search** — Dropdown to jump to and highlight any country
- **Area Info Mode** — Click any country to see its land area and population data
- **Distance Ruler Mode** — Measure the straight-line distance between any two points on Earth 
- **Clear Map** — Reset button to clear any active selections or measurements

---

## Project Structure

```
pop-map/
├── index.html              # App shell, UI controls, map container
├── app.js                  # Map logic, data binding, interactivity
├── style.css               # Layout and component styles
├── countries_cleaned.geojson   # Country polygon boundaries with population data
└── country_points.geojson      # Country centroid points for labels/search
```

---

## Data

- Population growth rate data spans 1950–2023, acquired from the [UN World Population Prospects](https://population.un.org/wpp/) dataset.
- Country geometries are stored in `countries_cleaned.geojson` (polygon boundaries).
- `country_points.geojson` stores centroid coordinates used for the country search and label placement.
