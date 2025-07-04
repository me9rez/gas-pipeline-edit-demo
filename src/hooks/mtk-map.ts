import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Ref, ShallowRef } from 'vue'

import "maptalks-gl/dist/maptalks-gl.css"
import * as maptalks from 'maptalks-gl'
// @ts-expect-error
import { Snap } from 'maptalks.snap'

const normalStyle = {
    style: [{
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
            lineWidth: {
                type: "exponential",
                default: 2,
                stops: [
                    [13, 2],
                    [14, 2],
                    [16, 2],
                    [17, 2]
                ]
            }
        }
    }]
}

const animationStyle = {
    style: [{
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
            lineWidth: {
                type: "exponential",
                default: 2,
                stops: [
                    [13, 2],
                    [14, 2],
                    [16, 2],
                    [17, 2]
                ]
            }
        }
    }]
};

export const useMtkMap = () => {
    let map: maptalks.Map

    /**
     * 初始化地图绘制工具
     * @param snap 地图绘制工具
     */
    const initDraw = (snap: any,vtLayer:any) => {
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
                    markerFile: './poi.png'
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
                enableAnimation=false
            } else {
                vtLayer.setStyle(animationStyle)
                enableAnimation=true
            }
        }

        var items = ['LineString','Polygon', 'Point'].map(function (value) {
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



        const vtLayer = new maptalks.VectorTileLayer("streets", {
            urlTemplate: "http://127.0.0.1:8030/streets/{z}/{x}/{y}",
            features: true,
            pickingGeometry: true,
        });

        vtLayer.setStyle(normalStyle)

        const groupLayer = new maptalks.GroupGLLayer("group", [vtLayer], {
            sceneConfig: {
            }
        }).addTo(map);

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

        initDraw(snap,vtLayer)

    }

    onMounted(() => {
        initMap()
    })

    onBeforeUnmount(()=>{
        map.remove()
    })
    // @ts-expect-error
    return { map }
}
