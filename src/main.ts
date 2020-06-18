import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(Element)

// Openlayers 组件
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import { Draw, Modify, Snap } from 'ol/interaction';
// import Draw from 'ol/interaction/Draw';
// import Snap from 'ol/interaction/Snap';
import { Circle as CircleStyle, Style, Stroke, Fill } from 'ol/style';
// import Style from 'ol/style/Style';
// import Stroke from 'ol/style/Stroke';
// import Fill from 'ol/style/Fill';
import GeoJSON from 'ol/format/GeoJSON';
import {Tile as TileLayer, Vector as VectorLayer, Image as ImageLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import { LineString, Polygon } from 'ol/geom';
import Feature from 'ol/Feature';
import { getCenter } from 'ol/extent'
import * as Sphere from 'ol/sphere';
// import ImageLayer from 'ol/layer/Image'
import Projection from 'ol/proj/Projection'
import Static from 'ol/source/ImageStatic'
import { Attribution, FullScreen, Zoom, defaults as controlDefault, ScaleLine } from 'ol/control'
import { defaults as interactionDefault  } from 'ol/interaction'
import TileGrid from 'ol/tilegrid/TileGrid';
import Overlay from 'ol/Overlay';



// import { TileSuperMapRest } from '@supermap/iclient-ol'

// import Attribution from 'ol/control/Attribution'
// import FullScreen from 'ol/control/FullScreen'
// import Zoom from 'ol/control/Zoom'
import { updateOl } from './assets/openlayer'

// window['$'] = $

updateOl({
  Map,
  View,
  Draw, // 绘制
  Snap, // 处理矢量特征的捕捉，同时修改或绘制它们。
  Modify, // 用于修改特性几何图形的交互。
  Style, // 向量特征渲染样式的容器。
  Stroke, // 为向量特征设置笔划样式。
  Fill, // 设置向量特征的填充样式。
  GeoJSON, // 用于读写GeoJSON格式数据的特性格式
  TileLayer, // 对于提供预渲染、平铺图像的网格层源，这些网格是按特定分辨率的缩放级别组织的。
  VectorLayer, // 客户端呈现的向量数据。
  OSM,
  VectorSource,
  LineString,
  Polygon,
  Feature,
  getCenter, // 中心定位
  ImageLayer, // 图片层
  Projection, // 投影
  Static, // 静态文件
  Attribution, // 版权
  FullScreen, // 全屏
  Zoom, // 放大缩小控件
  CircleStyle, // 设置矢量特征的圆形样式。
  controlDefault,
  interactionDefault,
  TileGrid, // 用于为访问块映像服务器的源设置网格模式的基类。
  Overlay, // 要显示在地图上并附加到单个地图位置的元素。
  ScaleLine, // 显示粗略的y轴距离的控件
  Sphere // 测距/测面积使用
})

import x2js from 'x2js' //xml数据处理插件
Vue.prototype.$x2js = new x2js() //创建x2js对象，挂到vue原型上


Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
