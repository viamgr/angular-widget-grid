/// <reference path="../../../typings/angularjs/angular.d.ts"/>

(function () {
  angular.module('widgetGrid').factory('Widget', ['gridUtil', function (gridUtil) {
    var Widget = function Widget(options) {
      this.id = gridUtil.getUID();
      
      options = options || {};

      this.width = parseInt(options.width) || null;
      this.height = parseInt(options.height) || null;
      
      this.top = parseInt(options.top) || null;
      this.left = parseInt(options.left) || null;
      
      this.style = {};
    };
    
    Widget.prototype.setPosition = function (position) {
      this.top =  angular.isNumber(position.top) ? position.top : this.top;
      this.left = angular.isNumber(position.left) ? position.left : this.left;
      this.height = angular.isNumber(position.height) ? position.height : this.height;
      this.width = angular.isNumber(position.width) ? position.width : this.width;
    };
    
    Widget.prototype.getPosition = function () {
      return {
        top: this.top,
        left: this.left,
        height: this.height,
        width: this.width
      };
    };
    
    return Widget;
  }]);
})();
