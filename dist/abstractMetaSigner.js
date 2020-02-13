"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var properties_1 = require("./utils");

var MetaSigner =
/** @class */
function () {
  function MetaSigner() {
    properties_1.setMetaType(this, 'MetaSigner');
  }

  MetaSigner.isMetaSigner = function (value) {
    return properties_1.isMetaType(value, 'MetaSigner');
  };

  return MetaSigner;
}();

exports.MetaSigner = MetaSigner;