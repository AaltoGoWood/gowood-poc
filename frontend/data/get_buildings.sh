ogr2ogr \
       -t_srs epsg:4326 \
       -f GeoJSON \
       Rakennukset_alue_rekisteritiedot.geojson \
       WFS:https://kartta.hel.fi/ws/geoserver/avoindata/wfs \
       avoindata:Rakennukset_alue_rekisteritiedot
