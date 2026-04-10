mapboxgl.accessToken = 'pk.eyJ1IjoidXNheWRhYmJhc2kiLCJhIjoiY21saGI2OXdmMDd0cDNncHNrNHJlaTUzNyJ9.QMCUc67ZJaEqL_gwaX-bvA';

// Create map
const map = new mapboxgl.Map({
    container: 'map',                 
    style: 'mapbox://styles/mapbox/light-v11', 
    center: [20, 15],              
    zoom: 1.6                         
});

// Global variables
let currentYear = '2023';
let countryData = null;
let distanceStart = null;
let analysisMode = 'area'; 

// Change base map colors after style loads
map.on('style.load', () => {
    if (map.getLayer('water')) map.setPaintProperty('water', 'fill-color', '#abdcfb');
    if (map.getLayer('background')) map.setPaintProperty('background', 'background-color', '#f5f5f5');
});

map.on('load', () => {
    addSources();
    addLayers();
    loadCountryDropdown();
    bindSlider();
    bindModeButtons();
    bindProjectionButtons();
    bindMapClick();
    bindResetButton();
    bindCursor();
    bindPlayButton();
});

// Add data sources 
function addSources() {
    map.addSource('poly',  { type: 'geojson', data: 'countries_cleaned.geojson' }); // country polygons
    map.addSource('pts',   { type: 'geojson', data: 'country_points.geojson' });    // country points
    map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }); // distance line
}

// Color countries based on growth value
function buildColorStep(year) {
    return ['step', ['get', year], '#ff5f5f', -0.1, '#d1d1d1', 0.1, '#39dd39'];
}

// Arrow symbols
function buildArrowStep(year) {
    return ['step', ['get', year], '▼', -0.1, '—', 0.1, '▲'];
}

// Arrow colors
function buildTextColorStep(year) {
    return ['step', ['get', year], '#b91c1c', -0.1, '#4b5563', 0.1, '#00812f'];
}

// Arrow size changes based on value
function buildTextSizeStep(year) {
    return [
        'step', 
        ['get', year], 
        48,      
        -1.0, 34, 
        -0.5, 22, 
        0.5, 34, 
        1.0, 48
    ];
}

// Add map layers
function addLayers() {
    map.addLayer({
        id: 'fills',
        type: 'fill',
        source: 'poly',
        paint: {
            'fill-color': buildColorStep(currentYear),
            'fill-opacity': 0.6
        }
    });

    // Arrow symbols layer
    map.addLayer({
        id: 'arrows',
        type: 'symbol',
        source: 'pts',
        layout: {
            'text-field': buildArrowStep(currentYear),
            'text-size': buildTextSizeStep(currentYear),
            'text-allow-overlap': true
        },
        paint: {
            'text-color': buildTextColorStep(currentYear),
            'text-halo-color': '#fff',
            'text-halo-width': 2
        }
    });

    // Line for distance measurement
    map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#000', 'line-width': 2, 'line-dasharray': [3, 2] }
    });
}

// Update map when year changes
function setYear(year) {
    currentYear = String(year);

    // Sync sliders + labels
    document.getElementById('slider').value = year;
    document.getElementById('footer-slider').value = year;
    document.getElementById('active-year').textContent = year;
    document.getElementById('footer-active-year').textContent = year;

    map.setPaintProperty('fills', 'fill-color', buildColorStep(currentYear));
    map.setLayoutProperty('arrows', 'text-field', buildArrowStep(currentYear));
    map.setLayoutProperty('arrows', 'text-size', buildTextSizeStep(currentYear));
    map.setPaintProperty('arrows', 'text-color', buildTextColorStep(currentYear));
}

// Load dropdown with country names
function loadCountryDropdown() {
    const dropdown = document.getElementById('country-search');

    fetch('country_points.geojson')
        .then(r => r.json())
        .then(d => {
            countryData = d.features;

            // Get unique country names
            const names = [...new Set(countryData.map(f => f.properties.Country))].sort();

            // Add to dropdown
            names.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.text = name;
                dropdown.appendChild(option);
            });
        });

    // Fly to selected country
    dropdown.onchange = (e) => {
        const target = countryData.find(f => f.properties.Country === e.target.value);
        if (target) {
            map.flyTo({
                center: target.geometry.coordinates,
                zoom: 4,
                speed: 1
            });
        }
    };
}

// Top slider
function bindSlider() {
    document.getElementById('slider').oninput = (e) => setYear(e.target.value);
}

// Play button animation
function bindPlayButton() {
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const footerSlider = document.getElementById('footer-slider');

    let playing = false;
    let timer = null;

    // Loop through years
    function tick() {
        let y = parseInt(currentYear);
        y = y >= 2023 ? 1950 : y + 1;
        setYear(y);
    }

    playBtn.onclick = () => {
        playing = !playing;

        if (playing) {
            // Change to pause icon
            playIcon.innerHTML = '<rect x="2" y="1" width="4" height="12" rx="1"/><rect x="8" y="1" width="4" height="12" rx="1"/>';
            timer = setInterval(tick, 150);
        } else {
            // Change back to play icon
            playIcon.innerHTML = '<polygon points="3,1 13,7 3,13"/>';
            clearInterval(timer);
        }
    };

    // Bottom slider
    footerSlider.oninput = (e) => setYear(e.target.value);
}

// Switch between area + distance modes
function bindModeButtons() {
    document.getElementById('mode-area').onclick = () => {
        analysisMode = 'area';
        setActiveMode('mode-area');
        distanceStart = null;
    };

    document.getElementById('mode-dist').onclick = () => {
        analysisMode = 'dist';
        setActiveMode('mode-dist');
    };
}

// Highlight active mode button
function setActiveMode(activeId) {
    ['mode-area', 'mode-dist'].forEach(id => {
        document.getElementById(id).className =
            'mode-btn' + (id === activeId ? ' active' : '');
    });
}

// Switch between globe and flat projections
function bindProjectionButtons() {
    document.getElementById('proj-globe').onclick = () => {
        map.setProjection('globe');
        document.getElementById('proj-globe').className = 'mode-btn active';
        document.getElementById('proj-flat').className = 'mode-btn';
    };

    document.getElementById('proj-flat').onclick = () => {
        map.setProjection('mercator');
        document.getElementById('proj-flat').className = 'mode-btn active';
        document.getElementById('proj-globe').className = 'mode-btn';
    };
}

// Handle map clicks
function bindMapClick() {
    map.on('click', 'fills', (e) => {
        const feature = e.features[0];
        const coords = [e.lngLat.lng, e.lngLat.lat];

        if (analysisMode === 'area') {
            // Calculate country area
            const areaSqKm = Math.round(turf.area(feature) / 1_000_000);

            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<b>${feature.properties.Country}</b><br>Area: ${areaSqKm.toLocaleString()} km²`)
                .addTo(map);

        } else {
            // Distance mode
            if (!distanceStart) {
                distanceStart = coords;

                new mapboxgl.Popup({ closeButton: false })
                    .setLngLat(e.lngLat)
                    .setHTML('Origin set.')
                    .addTo(map);

            } else {
                const distKm = turf.distance(distanceStart, coords, { units: 'kilometers' });

                // Draw line
                map.getSource('route').setData(
                    turf.lineString([distanceStart, coords])
                );

                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`Distance: ${Math.round(distKm).toLocaleString()} km`)
                    .addTo(map);

                distanceStart = null;
            }
        }
    });
}

// Reset everything
function bindResetButton() {
    document.getElementById('reset-btn').onclick = () => {
        distanceStart = null;

        // Clear line
        map.getSource('route').setData({
            type: 'FeatureCollection',
            features: []
        });

        // Remove popups
        [...document.getElementsByClassName('mapboxgl-popup')].forEach(p => p.remove());

        // Reset dropdown
        document.getElementById('country-search').value = '';

        // Reset map view
        map.flyTo({ center: [20, 15], zoom: 1.6 });
    };
}

// Change cursor when hovering countries
function bindCursor() {
    map.on('mousemove', 'fills', () => map.getCanvas().style.cursor = 'crosshair');
    map.on('mouseleave', 'fills', () => map.getCanvas().style.cursor = '');
}