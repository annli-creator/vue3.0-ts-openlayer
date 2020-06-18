import Vue from "vue";

declare module "vue/types/vue" {
  interface Vue {
    $x2js: any,
    $x2json: any
  }
}