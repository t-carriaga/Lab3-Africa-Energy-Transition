mapboxgl.accessToken = 'pk.eyJ1IjoidGNhcnJpYWdhIiwiYSI6ImNta3lqMmN0YTA3eTMzZm9qaWwzcDN4dG8ifQ.FhKRFFY4h0NDKwgglg1J6w';

// 1. INITIALIZE MAP
    const map = new mapboxgl.Map({
        container: 'my-map', // map container ID
        style: 'mapbox://styles/tcarriaga/cml8ikct8000f01sagb0iebdc', // simple style that distinguishes land and sea and removes labels so users focus on learning country names
        center: [14, 5], // starting position [lng, lat]
        zoom: 2, // starting zoom
        projection: 'mercator' // 2D map
    });

    // Country Name + Metric Info Pop Up Set Up
    const Country_popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: [0, -20]
    });


    // currently selected metric (Allows users to visualize different metrics)
    let currentMetric = "System_Performance";
    

    // currently selected legend range (Allows users to filter values based on their metric's value)
    let selectedRange = null;

    map.on('load', () => {

        // loads GeoJson File
        map.addSource('africa', {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/t-carriaga/Lab-3/main/data/Africa_Boundaries.geojson',
            promoteId: 'OBJECTID'
        });

        // visualizes Country fills
        map.addLayer({
            id:'countries',
            type:'fill',
            source:'africa',
            paint:{
                // color based on bins
                'fill-color':[
                    'step',
                    ['get', currentMetric],
                    '#d73027',
                    21,'#fc8d59',
                    41,'#fee08b',
                    61,'#91cf60',
                    81,'#1a9850'
                    ],
                // opacity changes if legend filter is active
                'fill-opacity':[
                    'case',
                    ['boolean',['feature-state','highlight'],false],
                    0.9,
                    0.35
                    ]
            }
        });

        // visualizes Country Borders
        map.addLayer({
            id:'country-outline',
            type:'line',
            source:'africa',
            // line thickness changes if legend filter is active
            paint:{
                'line-color':'black',
                'line-width':[
                'case',
                ['boolean',['feature-state','highlight'],false],
                2,
                0.5
                ]
            }
        });

        // Shows the pop-up when country is clicked
        map.addInteraction('countries-click', {
            type: 'click',
            target: {
                layerId: 'countries'
            },
            handler: (e) => {
                // collects metric info from GeoJSON file (joined dummy data from Excel)
                const props = e.feature.properties;

                // The webmap allows users to toggle between four visualizations (four metrics). This highlights the selected metric in black.
                function metricLine(label, key){
                    const color = currentMetric === key ? "black" : "grey";
                    return `<div style="color:${color}">${label}: ${props[key]}</div>`;
                }

                // pop-up content
                Country_popup
                    .setLngLat(e.lngLat)
                    .setHTML(
                        `<h1>${props.NAME_0}</h1><br>

                        ${metricLine("System Performance","System_Performance")}
                        ${metricLine("Transition Readiness","Transition_Readiness")}
                        ${metricLine("Hydrogen Technology Preparedness","Technology_Specific_Preparedness___Hydrogen")}
                        ${metricLine("Hydrogen Composite Index","Composite_Index__Hydrogen_")}
                        `
                    )
                    .addTo(map);
            }
        });

    });



// 2. Apply filter based on metric value, through clicking on the Legend

    document.querySelectorAll(".legend-item").forEach(item=>{

        item.addEventListener("click",()=>{

        // Users select the legend bin they want to activate
        document.querySelectorAll(".legend-item")
        .forEach(i=>i.classList.remove("active"));

        item.classList.add("active");

        selectedRange = item.dataset.range;

        applyLegendFilter();

        });

    });

    // Identifies which countries match the legend filter to highlight
    function applyLegendFilter(){

        const [min,max] = selectedRange.split("-").map(Number);

        const features = map.querySourceFeatures('africa');

        features.forEach(f=>{

        const value = f.properties[currentMetric];

        const highlight = value >= min && value <= max;

        map.setFeatureState(
            {
                source:'africa',
                id:f.id
            },
            {
                highlight:highlight
            }
        );

        });

    }

// 3. Visualize changes made after new metric is selected

 document.querySelectorAll(".metric-controls button").forEach(button=>{

        button.addEventListener("click",()=>{

        // close popup when metric changes
        Country_popup.remove();

        // remove active class from all buttons
        document.querySelectorAll(".metric-controls button")
        .forEach(b=>b.classList.remove("active"));

        // activate clicked button
        button.classList.add("active");

        currentMetric = button.dataset.metric;

        // recolours country fills to match new selected metric value
        map.setPaintProperty(
        'countries',
        'fill-color',
            [
            'step',
            ['get', currentMetric],
            '#d73027',
            21,'#fc8d59',
            41,'#fee08b',
            61,'#91cf60',
            81,'#1a9850'
            ]
        );

        // refreshes legenf filter to match new selected metric
        if(selectedRange){
        applyLegendFilter();
        }

        });

    });
