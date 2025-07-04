import Map from 'ol/Map'
import View from 'ol/View'
import { useGeographic, fromLonLat } from 'ol/proj'
import MVT from 'ol/format/MVT';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import TileLayer from 'ol/layer/Tile';
import { ImageTile } from 'ol/source';
import 'ol/ol.css'


import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Ref, ShallowRef } from 'vue'

export const useOlMap = (mapRef?: Readonly<ShallowRef<HTMLDivElement | null>>) => {

    let map: Map | undefined

    const initMap = () => {

        // useGeographic()

        map = new Map({
            target: 'map',
            view: new View({
                center: fromLonLat([-73.973202999999813, 40.582724000003225]),
                zoom: 14,
            }),
            layers: [
                new TileLayer({
                    source: new ImageTile({
                        url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
                    }),
                }),
                new VectorTileLayer({
                    source: new VectorTileSource({
                        format: new MVT(),
                        url: 'http://127.0.0.1:8030/streets/{z}/{x}/{y}',
                    }),
                }),

            ],
        });
    }

    onMounted(() => {
        initMap()
    })

    return { map }
}