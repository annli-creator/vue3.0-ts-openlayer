<template>
  <div>
    <div id="map" class="map"></div>
    <div id="popup" class="popup">
      <div class="title">我在这里呢</div>
      <el-image
        style="width: 50px; height: 50px"
        :src="imageUrl"
        :fit="'contain'"></el-image>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ol } from '@/assets/openlayer'
import * as _ from 'lodash/index'

let olmap: any = null
let layer: any = null
let rest: any = null
@Component
export default class HelloWorld extends Vue {
  @Prop() private msg!: string;

  mapUrl = 'http://192.168.22.51:8090/iserver/services/map-china/rest/maps'
  maptype = 'iserver'
  projection = 'EPSG:3857'
  zoom = 3
  imageUrl = require('../assets/logo.png')

  Unit = {
    METER: 'METER',
    KILOMETER: 'KILOMETER',
    MILE: 'MILE',
    YARD: 'YARD',
    DEGREE: 'DEGREE',
    MILLIMETER: 'MILLIMETER',
    CENTIMETER: 'CENTIMETER',
    INCH: 'INCH',
    DECIMETER: 'DECIMETER',
    FOOT: 'FOOT',
    SECOND: 'SECOND',
    MINUTE: 'MINUTE',
    RADIAN: 'RADIAN'
  }

  // //创建一个WGS84球体对象
  // wgs84Sphere = new ol.Sphere(6378137);
  // //创建一个当前要绘制的对象
  // sketch = new ol.Feature();
  // //创建一个帮助提示框对象
  // helpTooltipElement: any = null
  // //创建一个帮助提示信息对象
  // helpTooltip: any = null
  // //创建一个测量提示框对象
  // measureTooltipElement: any = null;
  // //创建一个测量提示信息对象
  // measureTooltip: any = null
  // //继续绘制多边形的提示信息
  // continuePolygonMsg = 'Click to continue drawing the polygon';
  // //继续绘制线段的提示信息
  // continueLineMsg = 'Click to continue drawing the line';

  mounted() {
    rest = require('@supermap/iclient-ol');
    this.initMap()
  }

  initMap() {
    this.getMapConfig().then((info: any) => {
      const {zoom, center, extent, resolutions, projection, mapUrl} = info
      const view = new ol.View({
        center,
        zoom,
        projection,
        extent,
        resolutions,
        multiWorld: true
      })
      const controls = ol.controlDefault({ attribution: true, zoom: true })

      olmap = new ol.Map({
        target: 'map',
        controls,
        view,
        interactions: ol.interactionDefault({doubleClickZoom: true}),
      })
      layer = new ol.TileLayer({
        source: new rest.TileSuperMapRest({
          url: mapUrl,
          wrapX: false
        }),
        projection
      })
      olmap.addLayer(layer)

      const FullScreen = new ol.FullScreen();//这是全屏控件
      olmap.addControl(FullScreen)

      const scaleLineControl = new ol.ScaleLine({
        units: 'metric',
        target: 'scalebar',
        className: 'ol-scale-line'
      });
      olmap.addControl(scaleLineControl)

      const geometryL = new ol.LineString([
        // [10618619.446989473, 4212528.015282417],
        // [11385680.290843213, 3065850.1723266602],
        // [13585110.096681476, 4940453.06333138]
      ])

      const previewLine = new ol.Feature({
        geometry: geometryL
      });
      const previewVector = new ol.VectorLayer({
        source: new ol.VectorSource({
          features: [previewLine]
        }),
        style: new ol.Style({
          stroke: new ol.Stroke({
            color: 'rgba(255, 0, 0, 1)',
            width: 2
          })
        })
      });
      olmap.addLayer(previewVector)

      const popup = new ol.Overlay({
        element: document.getElementById('popup'),
        offset: [0, -5],
        positioning: 'bottom-center'
      });
      popup.setPosition([12126199.351071337, 4075563.4761700775]);
      olmap.addOverlay(popup);

      olmap.on('singleclick', (e: any) => {
        console.log(e)
        popup.setPosition(e.coordinate);
        geometryL.appendCoordinate(e.coordinate);
      })
    })
  }

  //鼠标移动触发的函数
  pointerMoveHandler  (evt: any) {
    //Indicates if the map is currently being dragged. 
    //Only set for POINTERDRAG and POINTERMOVE events. Default is false.
    //如果是平移地图则直接结束
    if (evt.dragging) {
        return;
    }
    //帮助提示信息
    let helpMsg = 'Click to start drawing';

    if (this.sketch) {
        //Get the feature's default geometry. 
        //A feature may have any number of named geometries.
        //获取绘图对象的几何要素
        const geom = this.sketch.getGeometry();
        //如果当前绘制的几何要素是多边形，则将绘制提示信息设置为多边形绘制提示信息
        //如果当前绘制的几何要素是多线段，则将绘制提示信息设置为多线段绘制提示信息
        if (geom instanceof ol.Polygon) {
            helpMsg = this.continuePolygonMsg;
        } else if (geom instanceof ol.LineString) {
            helpMsg = this.continueLineMsg;
        }
    }
    //设置帮助提示要素的内标签为帮助提示信息
    this.helpTooltipElement.innerHTML = helpMsg;
    //设置帮助提示信息的位置
    //The coordinate in view projection corresponding to the original browser event.
    this.helpTooltip.setPosition(evt.coordinate);
    //移除帮助提示要素的隐藏样式
    // $(this.helpTooltipElement).removeClass('hidden');
  }

  getMapConfig() {
    return new Promise((resolve, reject) => {
      this.$ajax('get', `${this.mapUrl}.xml`).then((result: any) => {
        const info = this.getIserverMapData(result)
        resolve(info)
      })
    })
  }

  $ajax(type: string, url: string) {
    return new Promise((resolve, reject) => {
      const xmlhttp = new window.XMLHttpRequest()
      xmlhttp.open(type, url, true)
      xmlhttp.send(null)
      xmlhttp.onreadystatechange = (res: any) => {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
          resolve(res.currentTarget.responseText)
        }
      }
    })
  }

  getIserverMapData(res: any) {
    const param = this.xmlToJson(res)
    const promiseArr = []
    for (const i in param) {
      promiseArr.push(this.$ajax('GET', param[i] + '.json'))
    }
    return Promise.all(promiseArr).then(resp => {
      let mapInfo
      resp.forEach((element: any) => {
        const res = JSON.parse(element)
        const { left, bottom, right, top } = res.bounds
        const extent = [parseFloat(left), parseFloat(bottom), parseFloat(right), parseFloat(top)]
        const center = [parseFloat(res.center.x), parseFloat(res.center.y)]
        const resolutions = this.getMapResolutions(param[res.name], res).slice(2, 8)
        mapInfo = {
          extent: extent,
          center: center,
          mapName: res.name,
          layerName: res.name,
          matrixSet: res.name,
          origin: [parseFloat(left), parseFloat(top)],
          mapUrl: param[res.name],
          mapType: this.maptype,
          resolutions,
          zoom: this.zoom,
          projection: this.projection
        }
      })
      // 将地图列表入库
      // console.log('计算出的地图数据：', mapInfo)
      return mapInfo
    }).catch(err => {
      console.log(err)
      console.log('地图服务解析失败，请联系管理员')
    })
  }

  xmlToJson(xmlString: any) {
    // const x2js = new ol.xml2js.X2JS()
    const result = this.$x2js.xml2js( xmlString )
    const newparam: any = {}
    const param = result.list.ChildResource
    // param.map(element => {
    newparam[param.name] = param.path
    // })
    return newparam
  }

  getMapResolutions(url: string, originResult: any) {
    const tileGrid = this.optionsFromMapJSON(url, originResult).tileGrid
    return tileGrid.getResolutions()
  }

  optionsFromMapJSON (url: string, mapJSONObj: any) {
      const options: any = {}
      options.url = url
      options.crossOrigin = 'anonymous'
      const extent = [mapJSONObj.bounds.left, mapJSONObj.bounds.bottom, mapJSONObj.bounds.right, mapJSONObj.bounds.top]
      
      const getResolutions = () => {
        const level = 17
        const dpi = 96
        const width = (extent[2] - extent[0])
        const height = (extent[3] - extent[1])
        const tileSize = width >= height ? width : height
        let maxReolution: any = null
        if (tileSize === width) {
          maxReolution = tileSize / mapJSONObj.viewer.width
        } else {
          maxReolution = tileSize / mapJSONObj.viewer.height
        }
        const resolutions = []
        let unit = this.Unit.METER
        if (mapJSONObj.coordUnit === this.Unit.DEGREE) {
          unit = this.Unit.DEGREE
        }
        if (mapJSONObj.visibleScalesEnabled && mapJSONObj.visibleScales && mapJSONObj.visibleScales.length > 0) {
          for (let i = 0; i < mapJSONObj.visibleScales.length; i++) {
            resolutions.push(this.scaleToResolution(mapJSONObj.visibleScales[i], dpi, unit))
          }
        } else {
          for (let i = 0; i < level; i++) {
            resolutions.push(maxReolution / Math.pow(2, i))
          }
        }
  
        function sortNumber (a: number, b: number) {
          return b - a
        }
  
        return resolutions.sort(sortNumber)
      }
      const resolutions = getResolutions()
      options.tileGrid = new ol.TileGrid({
        extent: extent,
        resolutions: resolutions
      })
      return options
    }

    scaleToResolution (scale: any, dpi: any, mapUnit: any) {
      const inchPerMeter = 1 / 0.0254
      const meterPerMapUnitValue = this.getMeterPerMapUnit(mapUnit)
      let resolution = scale * dpi * inchPerMeter * meterPerMapUnitValue
      resolution = 1 / resolution
      return resolution
    }

    getMeterPerMapUnit (mapUnit: any) {
      const earchRadiusInMeters = 6378137
      let meterPerMapUnit: any
      if (mapUnit === this.Unit.METER) {
        meterPerMapUnit = 1
      } else if (mapUnit === this.Unit.DEGREE) {
        // 每度表示多少米。
        meterPerMapUnit = Math.PI * 2 * earchRadiusInMeters / 360
      } else if (mapUnit === this.Unit.KILOMETER) {
        meterPerMapUnit = 1.0E-3
      } else if (mapUnit === this.Unit.INCH) {
        meterPerMapUnit = 1 / 2.5399999918E-2
      } else if (mapUnit === this.Unit.FOOT) {
        meterPerMapUnit = 0.3048
      } else {
        return meterPerMapUnit
      }
      return meterPerMapUnit
    }
}

</script>

<style scoped lang="scss">
  .map {
    width: 100%;
    height: 600px;
  }
  
  .popup {
    width: 100px;
    height: 80px;
    background: #ededed;
    border: 1px solid #999;
    border-radius: 3px;
  }
</style>