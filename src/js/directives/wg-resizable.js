/// <reference path="../../../typings/angularjs/angular.d.ts"/>

(function () {
  angular.module('widgetGrid').directive('wgResizable', ['gridUtil', function (gridUtil) {
    return {
      restrict: 'A',
      require: 'wgWidget',
      link: {
        pre: function (scope, element, attrs, widgetCtrl) {
          // init & append template
          var templateContent = gridUtil.getTemplate('wg-resizable');
          if (templateContent) {
            var template = angular.element(templateContent);
            element.append(template);
            widgetCtrl.innerCompile(template);
          }
        }
      },
      controller: ['$attrs', '$parse', '$scope', function ($attrs, $parse, $scope) {
        var vm = this;
        
        var DEFAULT_DIRECTIONS = ['NW', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W'];
        
        vm.getResizeDirections = function () {
            var attrValue = $parse($attrs.wgResizable)($scope);
            return attrValue && attrValue.directions ? attrValue.directions : DEFAULT_DIRECTIONS;
        };
      }],
      controllerAs: 'resizableCtrl'
    };
  }]);
  
  angular.module('widgetGrid').directive('wgResizer', ['$document', function ($document) {
    var MIN_HEIGHT = 42,
        MIN_WIDTH = 42,
        ADD_OFFSET = 1;
    
    return {
      restrict: 'A',
      require: ['^wgGrid', '^wgResizable'],
      link: function (scope, element, attrs, ctrls) {
        var gridCtrl = ctrls[0],
            resizableCtrl = ctrls[1];
        
        var eventDown, eventMove, eventUp;
        if (window.navigator.pointerEnabled) {
          eventDown = 'pointerdown';
          eventMove = 'pointermove';
          eventUp = 'pointerup';
        } else {
          eventDown = 'mousedown touchstart';
          eventMove = 'mousemove touchmove';
          eventUp = 'mouseup touchend touchcancel';
        }
        
        var draggers = {
          N: { up: true, right: false, down: false, left: false, element: angular.element('<div class="wg-resize wg-resize-axis wg-resize-n"></div>') },
          E: { up: false, right: true, down: false, left: false, element: angular.element('<div class="wg-resize wg-resize-axis wg-resize-e"></div>') },
          S: { up: false, right: false, down: true, left: false, element: angular.element('<div class="wg-resize wg-resize-axis wg-resize-s"></div>') },
          W: { up: false, right: false, down: false, left: true, element: angular.element('<div class="wg-resize wg-resize-axis wg-resize-w"></div>') },
          NW: { up: true, right: false, down: false, left: true, element: angular.element('<div class="wg-resize wg-resize-diag wg-resize-nw"></div>') },
          NE: { up: true, right: true, down: false, left: false, element: angular.element('<div class="wg-resize wg-resize-diag wg-resize-ne"></div>') },
          SE: { up: false, right: true, down: true, left: false, element: angular.element('<div class="wg-resize wg-resize-diag wg-resize-se"></div>') },
          SW: { up: false, right: false, down: true, left: true, element: angular.element('<div class="wg-resize wg-resize-diag wg-resize-sw"></div>') }
        };
        
        var directions = resizableCtrl.getResizeDirections();
        for (var i = 0; i < directions.length; i++) {
          var dragger = draggers[angular.uppercase(directions[i])];
          if (angular.isDefined(dragger)) {
            registerDragHandler(dragger, element);
            element.append(dragger.element);
          }
        }
        
        function registerDragHandler(dragger, containerElement) {
          dragger.element.on(eventDown, onDown);
          
          function onDown(event) {
            event.preventDefault();
            
            if (angular.isObject(event.originalEvent)) {
              event = event.originalEvent;
            }

            dragger.element.addClass('dragging');
            
            var container = containerElement[0],
                widgetContainer = container.parentElement,
                widgetElement = angular.element(widgetContainer);
            
            widgetElement.addClass('wg-resizing');
            
            var startPos = {}; // grid positions
            startPos.top = scope.widget.top;
            startPos.left = scope.widget.left;
            startPos.bottom = startPos.top + scope.widget.height - 1;
            startPos.right = startPos.left + scope.widget.width - 1;
            
            var startRender = {}; // pixel values
            startRender.top = widgetContainer.offsetTop;
            startRender.left = widgetContainer.offsetLeft;
            startRender.height = container.offsetHeight;
            startRender.width = container.offsetWidth;
            startRender.bottom = startRender.top + startRender.height;
            startRender.right = startRender.left + startRender.width;
            
            event.offsetX = event.offsetX || event.layerX;
            event.offsetY = event.offsetY || event.layerY;
            
            // add an offset to avoid ambiguity when faced w/ odd widths and/or heights
            var delta = { top: ADD_OFFSET, right: ADD_OFFSET, bottom: ADD_OFFSET, left: ADD_OFFSET };
            
            var draggerOffset = {
              top: event.offsetY + ADD_OFFSET,
              left: event.offsetX + ADD_OFFSET,
              bottom: event.offsetY - dragger.element[0].offsetHeight + ADD_OFFSET,
              right: event.offsetX - dragger.element[0].offsetWidth + ADD_OFFSET
            };
            
            var gridPositions = gridCtrl.getPositions();
            
            $document.on(eventMove, onMove);
            $document.on(eventUp, onUp);
            
            function onMove(event) {
              event.preventDefault();
                        
              if (angular.isObject(event.originalEvent)) {
                event = event.originalEvent;
              }
              
              if (event.touches) {
                event.clientX = event.touches[0].clientX;
                event.clientY = event.touches[0].clientY;
              }
              
              // normalize the drag position
              var dragPositionX = Math.round(event.clientX) - gridPositions.left,
                  dragPositionY = Math.round(event.clientY) - gridPositions.top;
              
              if (dragger.up) {
                delta.top = Math.min(Math.max(dragPositionY - draggerOffset.top, 0), gridPositions.height - 1) - startRender.top;
                delta.top = Math.min(delta.top, startRender.height - MIN_HEIGHT);
              } else if (dragger.down) {
                delta.bottom = startRender.bottom - Math.min(Math.max(dragPositionY - draggerOffset.bottom, 0), gridPositions.height - 1);
                delta.bottom = Math.min(delta.bottom, startRender.height - MIN_HEIGHT);
              }
              
              if (dragger.left) {
                delta.left = Math.min(Math.max(dragPositionX - draggerOffset.left, 0), gridPositions.width - 1) - startRender.left; 
                delta.left = Math.min(delta.left, startRender.width - MIN_WIDTH);
              } else if (dragger.right) {
                delta.right = startRender.right - Math.min(Math.max(dragPositionX - draggerOffset.right, 0), gridPositions.width - 1); 
                delta.right = Math.min(delta.right, startRender.width - MIN_WIDTH);
              }
              
              var currentFinalPos = determineFinalPos();
              gridCtrl.highlightArea(currentFinalPos);
              
              containerElement.css({
                top: delta.top + 'px',
                left: delta.left + 'px',
                bottom: delta.bottom + 'px',
                right: delta.right + 'px'
              });
            }
            
            function onUp(event) {
              event.preventDefault();
              $document.off(eventMove, onMove);
              $document.off(eventUp, onUp);
              

              var finalPos = determineFinalPos();
              scope.setWidgetPosition(finalPos);
              gridCtrl.resetHighlights();
              
              // reset style
              widgetElement.removeClass('wg-resizing');
              dragger.element.removeClass('dragging');
              containerElement.removeAttr('style');
            }
            
            function determineFinalPos() {
              var finalPos = {};
              
              var requestedStartPoint = gridCtrl.rasterizeCoords(startRender.left + delta.left, startRender.top + delta.top),
                  requestedEndPoint = gridCtrl.rasterizeCoords(startRender.right - delta.right, startRender.bottom - delta.bottom);

              var requestedPos = {
                top: requestedStartPoint.i,
                right: requestedEndPoint.j,
                bottom: requestedEndPoint.i,
                left: requestedStartPoint.j
              };
              
              // determine a suitable final position (one that is not obstructed)
              var foundCollision, i, j;
              if (dragger.up && requestedPos.top < startPos.top) {
                finalPos.top = startPos.top;
                
                while (finalPos.top > requestedPos.top) {
                  // check whether adding another row would cause any conflict
                  foundCollision = false;
                  for (j = Math.max(startPos.left, requestedPos.left); j <= Math.min(startPos.right, requestedPos.right); j++) {
                    if (gridCtrl.isPositionObstructed(finalPos.top - 1, j)) {
                      foundCollision = true;
                      break;
                    }
                  }
                  if (foundCollision) { break; }
                  
                  finalPos.top--; // add row
                }
              } else if (dragger.down && requestedPos.bottom > startPos.bottom) {
                finalPos.bottom = startPos.bottom;
                
                while (finalPos.bottom < requestedPos.bottom) {
                  foundCollision = false;
                  for (j = Math.max(startPos.left, requestedPos.left); j <= Math.min(startPos.right, requestedPos.right); j++) {
                    if (gridCtrl.isPositionObstructed(finalPos.bottom + 1, j)) {
                      foundCollision = true;
                      break;
                    }
                  }
                  if (foundCollision) { break; }
                  
                  finalPos.bottom++;
                }
              }
              
              finalPos.top = finalPos.top || requestedPos.top;
              finalPos.bottom = finalPos.bottom || requestedPos.bottom;
              
              if (dragger.left && requestedPos.left < startPos.left) {
                finalPos.left = startPos.left;
                
                while (finalPos.left > requestedPos.left) {
                  // check whether adding another column would cause any conflict
                  foundCollision = false;
                  for (i = finalPos.top; i <= finalPos.bottom; i++) {
                    if (gridCtrl.isPositionObstructed(i, finalPos.left - 1)) {
                      foundCollision = true;
                      break;
                    }
                  }
                  if (foundCollision) { break; }
                  
                  finalPos.left--; // add column
                }
              } else if (dragger.right && requestedPos.right > startPos.right) {
                finalPos.right = startPos.right;
                
                while (finalPos.right < requestedPos.right) {
                  foundCollision = false;
                  for (i = finalPos.top; i <= finalPos.bottom; i++) {
                    if (gridCtrl.isPositionObstructed(i, finalPos.right + 1)) {
                      foundCollision = true;
                      break;
                    }
                  }
                  if (foundCollision) { break; }
                  
                  finalPos.right++;
                }
              }

              finalPos.right = finalPos.right || requestedPos.right;
              finalPos.left = finalPos.left || requestedPos.left;
              finalPos.height = finalPos.bottom - finalPos.top + 1;
              finalPos.width = finalPos.right - finalPos.left + 1;
              
              return finalPos;
            }
          }
        }
      }
    };
  }]);
})();
