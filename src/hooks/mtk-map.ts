import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Ref, ShallowRef } from 'vue'

import "maptalks-gl/dist/maptalks-gl.css"
import * as maptalks from 'maptalks-gl'
// @ts-expect-error
import { Snap } from 'maptalks.snap'

const lineWidth = {
    type: "exponential",
    default: 2,
    stops: [
        [13, 2],
        [14, 2],
        [16, 2],
        [17, 2]
    ]
}

const normalStyle = {
    style: [{
        name:"streets-style",
        filter: ["all", ["==", "$type", "LineString"]],
        renderPlugin: {
            dataConfig: {
                type: "line"
            },
            sceneConfig: {},
            type: "line"
        },
        symbol: {
            // linePatternAnimSpeed: -0.4,
            // linePatternFile: "/halo.png",
            lineColor: [0.1882352, 0.1882352, 0.1882352, 1],
            lineWidth: lineWidth
        }
    }]
}

const animationStyle = {
    style: [
        {
        name:"streets-style",
        filter: ["all", ["==", "$type", "LineString"]],
        renderPlugin: {
            dataConfig: {
                type: "line"
            },
            sceneConfig: {},
            type: "line"
        },
        symbol: {
            linePatternAnimSpeed: -0.4,
            linePatternFile: "/halo.png",
            lineColor: [0.1882352, 0.1882352, 0.1882352, 1],
            lineWidth: lineWidth
        }
    }
]
};

export const useMtkMap = () => {
    let map: maptalks.Map

    const initHighLight = (map: any, layer: any) => {
        const highLightKey = 'streets-color';

        var options: any = {
            'title': 'InfoWindow',
            'content': '',
            'width': 180,
            'minHeight': 120,
            'autoOpenOn': null, //set to null if not to open window when clicking on map
        };
        var infoWindow = new maptalks.ui.InfoWindow(options);
        infoWindow.addTo(map);

        function highLight(feature: any, layer: maptalks.GeoJSONVectorTileLayer) {
            layer.highlight([{
                id: feature.id,
                plugin: 'streets-style',
                name: highLightKey,
                color: 'red'
            }]);
        }

        function cancel(layer: any) {
            layer.cancelHighlight([highLightKey]);
        }

        function showInfoWindow(coordinate: any, feature: any) {
            // infoWindow.setTitle('....');
            // infoWindow.setContent(`<div class="loading"><img src="/resources/images/loading.gif"/></div>`);
            infoWindow.show(coordinate);

            infoWindow.setContent(
                `
                <div class="attr-window">
                <div>ID:${feature.properties.ID}</div>
                <div>NAME:${feature.properties.NAME}</div>
                <div>ONEWAY:${feature.properties.ONEWAY}</div>
                <div>TYPE:${feature.properties.TYPE}</div>
                </div>
                `
            );
            infoWindow.setTitle('要素属性');
        }

        map.on('click', (e: any) => {
            const data = layer.identify(e.coordinate);
            if (!data || !data.length) {
                cancel(layer);
                infoWindow.hide();
                return;
            }
            const feature = data[data.length - 1].data.feature;
            highLight(feature, layer);
            showInfoWindow(e.coordinate, feature);
            console.log(feature);
        })
    }

    /**
     * 初始化地图绘制工具
     * @param snap 地图绘制工具
     */
    const initDraw = (snap: any, vtLayer: any) => {
        const layer1 = new maptalks.VectorLayer('layer1').addTo(map);

        // map.on('mousemove', showDrawTip);

        let tipPoint: any
        let tipUIMarker: any
        let enableAnimation = false

        function showDrawTip(e: any) {
            if (!drawTool.isEnabled()) {
                return;
            }
            if (!tipPoint) {
                tipPoint = new maptalks.Marker(e.coordinate, {
                    symbol: {
                        // ...markerSymbol,
                    }
                });
                tipPoint.addTo(layer1);
                snap.effectGeometry(tipPoint);
                tipUIMarker = new maptalks.ui.UIMarker(e.coordinate, {
                    content: document.querySelector('#tiptemplate')!.innerHTML,
                    verticalAlignment: 'bottom',
                    dy: 10
                }).addTo(map);
            }
            if (tipPoint.snapTo) {
                const containerPoint = tipPoint.snapTo(e.containerPoint);
                const coordinate = map.containerPointToCoord(containerPoint);
                tipPoint.setCoordinates(coordinate);
                tipUIMarker.setCoordinates(coordinate);
            }
        }

        function closeShowTip() {
            if (tipPoint) {
                tipPoint.remove();
                snap.unEffectGeometry(tipPoint);
                tipUIMarker.remove();
                tipPoint = null;
            }
        }

        var drawTool = new maptalks.DrawTool({
            once: true,
            mode: 'LineString',
            // 'symbol': drawSymbol,
        }).addTo(map).disable();

        drawTool.on('disable', () => {
            closeShowTip();
        });

        drawTool.on('drawend', function (param: any) {
            // console.log(param.geometry);
            layer1.addGeometry(param.geometry);
            closeShowTip();
        });
        drawTool.on('drawstart', function (param: any) {
            console.log('reset geometry');

            const geometry = param.tempGeometry;

            // console.log(geometry);
            const mode = drawTool.getMode();
            if (mode === 'linestring') {
                geometry.setSymbol({
                    lineColor: 'red',
                    markerType: 'ellipse',
                    markerWidth: 10,
                    markerHeight: 10,
                    'markerPlacement': 'vertex',
                })
            }
            if (mode === 'polygon') {
                geometry.setSymbol({
                    polygonFill: "white",
                    lineColor: 'blue',
                    markerType: 'ellipse',
                    markerWidth: 10,
                    markerHeight: 10,
                    markerFill: "red",
                    'markerPlacement': 'vertex',
                })
            }
            if (mode === 'point') {
                geometry.setSymbol({
                    markerFile: '/poi.png'
                    // polygonFill: "white",
                    // lineColor: 'blue',
                    // markerType: 'ellipse',
                    // markerWidth: 10,
                    // markerHeight: 10,
                    // markerFill: "red",
                    // 'markerPlacement': 'vertex',
                })
            }
            snap.effectGeometry(param.tempGeometry);

        });

        const switchAnimation = () => {
            if (enableAnimation) {
                vtLayer.setStyle(normalStyle)
                enableAnimation = false
            } else {
                vtLayer.setStyle(animationStyle)
                enableAnimation = true
            }
        }

        var items = ['LineString', 'Polygon', 'Point'].map(function (value) {
            return {
                item: value,
                click: function () {
                    drawTool.setMode(value).enable();
                }
            };
        });

        var toolbar = new maptalks.control.Toolbar({
            items: [
                {
                    item: '绘制',
                    // @ts-ignore
                    children: items
                },
                {
                    item: '禁用',
                    click: function () {
                        drawTool.disable();
                    }
                },
                {
                    item: '清除',
                    click: function () {
                        layer1.clear();
                    }
                },
                {
                    item: "管网动画",
                    click: () => {
                        switchAnimation()
                    }
                },
                {
                    item: "项目源码",
                    click: () => {
                        window.open('https://github.com/me9rez/gas-pipeline-edit-demo')
                    }
                }
            ]
        }).addTo(map);
    }

    /**
     * 初始化地图
     */
    const initMap = () => {

        const tileLayer = new maptalks.TileLayer("base", {
            urlTemplate: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            subdomains: ["a", "b", "c", "d"],
        })
        map = new maptalks.Map("map", {
            center: [-73.973202999999813, 40.582724000003225],
            zoom: 16,
            baseLayer: tileLayer
        });

        const testVtLayer = new maptalks.VectorTileLayer("streets", {
            urlTemplate: "http://127.0.0.1:8030/streets/{z}/{x}/{y}",
            features: true,
            pickingGeometry: true,
        });

        const vtLayer = new maptalks.GeoJSONVectorTileLayer("streets", {
            style: normalStyle,
            // @ts-expect-error
            features: true,
            pickingGeometry: true,
            data: './streets.geojson'
        });

        const groupLayer = new maptalks.GroupGLLayer("group", [vtLayer], {}).addTo(map);

        const snap = new Snap(map);

        function getVTGeos() {
            const items = vtLayer.getRenderedFeatures();

            const fs: any[] = [];
            items.forEach((item: any) => {
                const features = item.features || [];
                features.forEach((f: any) => {
                    if (f.feature) {
                        fs.push(Object.assign({}, f.feature, {
                            type: 'Feature',
                            id: null
                        }));
                    }
                });
            });
            return fs.map(f => {
                return maptalks.GeoJSON.toGeometry(f)
            })
        }

        //custom filterGeometries
        snap.config({
            filterGeometries: () => {
                const result = getVTGeos()
                return result
            }
        })

        initDraw(snap, vtLayer)
        initHighLight(map, vtLayer)

    }

    onMounted(() => {
        initMap()
    })

    onBeforeUnmount(() => {
        map.remove()
    })
    // @ts-expect-error
    return { map }
}
