<template>
  <div class="hello">
    <div class="geometry-title">
      <el-button v-for="(option, index) in GeometryOptions" :key="index" @click="clearGeometry(option.value)"> clear {{ option.value }} </el-button>
      <label>Geometry type &nbsp;</label>
      <el-select v-model="GeometryValue" @change="GeometryChange" placeholder="请选择">
        <el-option
          v-for="item in GeometryOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </div>
    <div id="map" class="map"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ol } from '@/assets/openlayer'
import { length, isOnSegment, mod } from '@/assets/draw'
import * as _ from 'lodash/index'
let map: any = null
let drawInteraction: any = null
let snapInteraction: any = null
let baseVector: any = null
let tracingFeature: any = null;
let drawVector: any = null
let drawing = false
let previewLine: any = null
@Component
export default class HelloWorld extends Vue {
  @Prop() private msg!: string;

  typeSelect: any = null
  GeometryValue = 'None'
  GeometryOptions = [
    {
      value: 'None',
      label: 'None'
    },
    {
      value: 'Point',
      label: 'Point'
    },
    {
      value: 'LineString',
      label: 'LineString'
    },
    {
      value: 'Polygon',
      label: 'Polygon'
    },
    {
      value: 'Circle',
      label: 'Circle'
    }
  ]

  // lifecycle hook
  mounted () {
    this.renderMap()
    snapInteraction = new ol.Snap({
      source: baseVector.getSource()
    });
  }

  // 绘制类型下拉框切换
  GeometryChange() {
    map.removeInteraction(drawInteraction);
    map.removeInteraction(snapInteraction);
    this.addInteraction();
  }

  // 根据source查询 features
  // 查询feature的type
  // 在resource上删除已确定的feature
  clearGeometry(type: any) {
    const $feature = drawVector.getSource().getFeatures()
    _.forEach($feature, (item: any) => {
      if (item.getGeometry().getType() === type) {
        drawVector.getSource().removeFeature(item)
      }
    })
    drawing = false
    // console.log(drawVector.getSource().getFeatures()[1].getGeometry().getType())
    // drawVector.getSource().clear()
  }

  // method
  renderMap () {
    const self = this
    const attribution = new ol.Attribution();//这是版权控件
    const FullScreen = new ol.FullScreen();//这是全屏控件
    const Zoom = new ol.Zoom();//这是全屏控件
    const extent = [0, 0, 1024, 968]; // [left, bottom, right, top] 
    
    // 投影 坐标类型
    const projection = new ol.Projection({
      code: 'xkcd-image',
      units: 'pixels',
      extent: extent
    });

    // 静态图片地图
    const staticRource = new ol.Static({
      attributions: '© <a href="http://xkcd.com/license.html">xkcd</a>', // 版权控件
      // url: 'https://imgs.xkcd.com/comics/online_communities.png', // 底图
      url: '/static/59d7e702N748d62ce.jpg',
      projection: projection,
      imageExtent: extent
    })

    // 瓦片地图
    const raster = new ol.TileLayer({
      source: new ol.OSM()
    });

    // features in this layer will be snapped to 瓦片要素
    baseVector = new ol.VectorLayer({
      source: new ol.VectorSource({
        format: new ol.GeoJSON(),
        url: 'https://ahocevar.com/geoserver/wfs?service=wfs&request=getfeature&typename=topp:states&cql_filter=STATE_NAME=\'Idaho\'&outputformat=application/json'
      })
    });

    // this is were the drawn features go 绘制图层
    drawVector = new ol.VectorLayer({
      source: new ol.VectorSource(),
      style: new ol.Style({
        stroke: new ol.Stroke({
          color: 'rgba(100, 255, 0, 1)',
          width: 2
        }),
        fill: new ol.Fill({
          color: 'rgba(100, 255, 0, 0.3)'
        }),
        image: new ol.CircleStyle({
          radius: 7,
          fill: new ol.Fill({
            color: '#ffcc33'
          })
        })
      })
    });

    // this line only appears when we're tracing a feature outer ring
    // 显示图层
    previewLine = new ol.Feature({
      geometry: new ol.LineString([])
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

    map = new ol.Map({
      layers: [
        // new ol.ImageLayer({
        //   source: staticRource
        // }),
        raster, baseVector,
        drawVector, previewVector
      ],
      controls: [attribution, FullScreen, Zoom],//如果不设置 controls ，地图会默认设置
      target: 'map',
      view: new ol.View({
        // projection: projection,
        // center: ol.getCenter(extent),
        center: [-12986427, 5678422],
        zoom: 5,
        maxZoom: 8
      })
    });

    const modify = new ol.Modify({ source: drawVector.getSource() });
    map.addInteraction(modify);

    // let drawInteraction: any = null;
    // let tracingFeature: any = null;
    let startPoint: any = null;
    let endPoint: any = null;
    drawing = false;

    const getFeatureOptions = {
      hitTolerance: 10,
      layerFilter: function (layer: any) {
        return layer === baseVector;
      }
    };

    // the click event is used to start/end tracing around a feature
    map.on('click', (event: any) => {
      if (!drawing) {
        return;
      }

      let hit = false;
      // 在图层上绘制时，点位要素重合会触发该回调
      map.forEachFeatureAtPixel(
        event.pixel,
        (feature: any) => {
          if (tracingFeature && feature !== tracingFeature) {
            return;
          }

          hit = true;
          const coord = map.getCoordinateFromPixel(event.pixel);

          // second click on the tracing feature: append the ring coordinates
          if (feature === tracingFeature) {
            // getGeometry() 获取该特性的默认几何形状
            // getClosestPoint() 将几何图形的最近点作为坐标返回给经过的点。
            endPoint = tracingFeature.getGeometry().getClosestPoint(coord);
            const appendCoords = self.getPartialRingCoords(tracingFeature, startPoint, endPoint);
            // 删除当前正在绘制的特性的最后一点。
            drawInteraction.removeLastPoint();
            // 将坐标追加到当前绘制的几何图形的末尾。这可以在绘制线字符串或多边形时使用。坐标将被附加到当前LineString或当前多边形的外层。
            drawInteraction.appendCoordinates(appendCoords);
            tracingFeature = null;
          }

          // start tracing on the feature ring
          tracingFeature = feature;
          // getGeometry() 获取该特性的默认几何形状
          // getClosestPoint() 将几何图形的最近点作为坐标返回给经过的点。
          startPoint = tracingFeature.getGeometry().getClosestPoint(coord);
        },
        getFeatureOptions
      );

      if (!hit) {
        // clear current tracing feature & preview
        // getGeometry() 获取该特性的默认几何形状
        // setCoordinates([]) 设置linestring的坐标
        previewLine.getGeometry().setCoordinates([]);
        tracingFeature = null;
      }
    });

    // the pointermove event is used to show a preview of the result of the tracing
    map.on('pointermove', (event: any) => {
      if (tracingFeature && drawing) {
        let coord = null;
        // 检测与视口像素相交的特征，并对每个相交的特征执行回调
        map.forEachFeatureAtPixel(
          event.pixel,
          (feature: any) => {
            if (tracingFeature === feature) {
              // getCoordinateFromPixel 获取给定像素的坐标。这将返回用户投影中的一个坐标
              coord = map.getCoordinateFromPixel(event.pixel);
            }
          },
          getFeatureOptions
        );

        let previewCoords = [];
        if (coord) {
          // getGeometry() 获取该特性的默认几何形状
          // getClosestPoint() 将几何图形的最近点作为坐标返回给经过的点。
          endPoint = tracingFeature.getGeometry().getClosestPoint(coord);
          // 获取起始点->结束点中所有的点位
          previewCoords = self.getPartialRingCoords(tracingFeature, startPoint, endPoint);
        }
        // getGeometry() 获取该特性的默认几何形状
        // setCoordinates([]) 设置linestring的坐标
        previewLine.getGeometry().setCoordinates(previewCoords);
      }
    });

  }

  getPartialRingCoords(feature: any, startPoint: any, endPoint: any) {
    // getGeometry() 获取该特性的默认几何形状
    let polygon = feature.getGeometry();
    // getType() 得到这个几何图形的类型
    if (polygon.getType() === 'MultiPolygon') {
      // getPolygon(0) 返回指定索引处的多边形
      polygon = polygon.getPolygon(0);
    }
    // getLinearRing() 返回多边形几何图形的第n个线性环。如果给定的索引超出范围，则返回null。
    // getCoordinates() 返回线性环的坐标
    const ringCoords = polygon.getLinearRing().getCoordinates();

    let i, pointA, pointB, startSegmentIndex = -1;
    for (i = 0; i < ringCoords.length; i++) {
      pointA = ringCoords[i];
      pointB = ringCoords[mod(i + 1, ringCoords.length)];

      // check if this is the start segment dot product
      if (isOnSegment(startPoint, pointA, pointB)) {
        startSegmentIndex = i;
        break;
      }
    }

    const cwCoordinates = [];
    let cwLength = 0;
    const ccwCoordinates = [];
    let ccwLength = 0;

    // build clockwise coordinates
    for (i = 0; i < ringCoords.length; i++) {
      pointA = i === 0 ? startPoint : ringCoords[mod(i + startSegmentIndex, ringCoords.length)];
      pointB = ringCoords[mod(i + startSegmentIndex + 1, ringCoords.length)];
      cwCoordinates.push(pointA);

      if (isOnSegment(endPoint, pointA, pointB)) {
        cwCoordinates.push(endPoint);
        cwLength += length(pointA, endPoint);
        break;
      } else {
        cwLength += length(pointA, pointB);
      }
    }

    // build counter-clockwise coordinates
    for (i = 0; i < ringCoords.length; i++) {
      pointA = ringCoords[mod(startSegmentIndex - i, ringCoords.length)];
      pointB = i === 0 ? startPoint : ringCoords[mod(startSegmentIndex - i + 1, ringCoords.length)];
      ccwCoordinates.push(pointB);

      if (isOnSegment(endPoint, pointA, pointB)) {
        ccwCoordinates.push(endPoint);
        ccwLength += length(endPoint, pointB);
        break;
      } else {
        ccwLength += length(pointA, pointB);
      }
    }

    // keep the shortest path
    return ccwLength < cwLength ? ccwCoordinates : cwCoordinates;
  }

  // 添加绘制交互
  addInteraction() {
    if (this.GeometryValue !== 'None') {
      drawInteraction = new ol.Draw({
        // getSource() 获取层源
        source: drawVector.getSource(),
        type: this.GeometryValue
      });
      drawInteraction.on('drawstart', function () {
        drawing = true;
      });
      drawInteraction.on('drawend', () => {
        drawing = false;
        // getGeometry() 获取该特性的默认几何形状
        // setCoordinates([]) 设置linestring的坐标
        previewLine.getGeometry().setCoordinates([]);
        console.log(previewLine.getGeometry().getType())
        tracingFeature = null;
      });
      // addInteraction() 将给定的交互添加到映射中
      map.addInteraction(drawInteraction);
      map.addInteraction(snapInteraction);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
// h3 {
//   margin: 40px 0 0;
// }
// ul {
//   list-style-type: none;
//   padding: 0;
// }
// li {
//   display: inline-block;
//   margin: 0 10px;
// }
// a {
//   color: #42b983;
// }

.map {
  width: 100%;
  height: 600px;
}

.geometry-title {
  text-align: right;
  padding: 10px;
}
</style>
