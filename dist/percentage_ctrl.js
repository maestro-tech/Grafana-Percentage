'use strict';

System.register(['app/plugins/panel/singlestat/module', 'moment', 'lodash', 'jquery', 'jquery.flot', 'jquery.flot.gauge', 'app/core/utils/kbn', 'app/core/time_series2'], function (_export, _context) {
  "use strict";

  var SingleStatCtrl, moment, _, $, kbn, TimeSeries, _createClass, _get, PercentagePluginCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsPanelSinglestatModule) {
      SingleStatCtrl = _appPluginsPanelSinglestatModule.SingleStatCtrl;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_jqueryFlot) {}, function (_jqueryFlotGauge) {}, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _get = function get(object, property, receiver) {
        if (object === null) object = Function.prototype;
        var desc = Object.getOwnPropertyDescriptor(object, property);

        if (desc === undefined) {
          var parent = Object.getPrototypeOf(object);

          if (parent === null) {
            return undefined;
          } else {
            return get(parent, property, receiver);
          }
        } else if ("value" in desc) {
          return desc.value;
        } else {
          var getter = desc.get;

          if (getter === undefined) {
            return undefined;
          }

          return getter.call(receiver);
        }
      };

      _export('PercentagePluginCtrl', PercentagePluginCtrl = function (_SingleStatCtrl) {
        _inherits(PercentagePluginCtrl, _SingleStatCtrl);

        function PercentagePluginCtrl($scope, $injector, $rootScope) {
          _classCallCheck(this, PercentagePluginCtrl);

          var _this = _possibleConstructorReturn(this, (PercentagePluginCtrl.__proto__ || Object.getPrototypeOf(PercentagePluginCtrl)).call(this, $scope, $injector));

          _this.$rootScope = $rootScope;

          var panelDefaults = {
            links: [],
            datasource: null,
            maxDataPoints: 100,
            interval: null,
            targets: [{}],
            cacheTimeout: null,
            dayInterval: 'NOW',
            hourInterval: 'NOW',
            minuteInterval: 'NOW'
          };

          _.defaults(_this.panel, panelDefaults);
          _this.scope = $scope;

          return _this;
        }

        _createClass(PercentagePluginCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            _get(PercentagePluginCtrl.prototype.__proto__ || Object.getPrototypeOf(PercentagePluginCtrl.prototype), 'onInitEditMode', this).call(this);
            //this.addEditorTab('Delta Config', 'public/plugins/grafana-delta-panel/delta_config.html', 2);
            this.unitFormats = kbn.getUnitFormats();
          }
        }, {
          key: 'setUnitFormat',
          value: function setUnitFormat(subItem) {
            _get(PercentagePluginCtrl.prototype.__proto__ || Object.getPrototypeOf(PercentagePluginCtrl.prototype), 'setUnitFormat', this).call(this);
            this.panel.format = subItem.value;
            this.render();
          }
        }, {
          key: 'issueQueries',
          value: function issueQueries(datasource) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
              _this2.datasource = datasource;

              if (!_this2.panel.targets || _this2.panel.targets.length === 0) {
                return _this2.$q.when([]);
              }

              // make shallow copy of scoped vars,
              // and add built in variables interval and interval_ms
              var scopedVars = Object.assign({}, _this2.panel.scopedVars, {
                "__interval": { text: _this2.interval, value: _this2.interval },
                "__interval_ms": { text: _this2.intervalMs, value: _this2.intervalMs }
              });

              var metricsQuery = {
                panelId: _this2.panel.id,
                range: _this2.range,
                rangeRaw: _this2.rangeRaw,
                interval: _this2.interval,
                intervalMs: _this2.intervalMs,
                targets: _this2.panel.targets,
                format: _this2.panel.renderer === 'png' ? 'png' : 'json',
                maxDataPoints: _this2.resolution,
                scopedVars: scopedVars,
                cacheTimeout: _this2.panel.cacheTimeout
              };
              return resolve(datasource.query(metricsQuery));
            });
          }
        }, {
          key: 'handleQueryResult',
          value: function handleQueryResult(result) {
            this.setTimeQueryEnd();
            this.loading = false;

            if (result.data.length != 2) {
              var error = new Error();
              error.message = 'Not enougth series error';
              error.data = 'Metric query returns ' + result.data.length + ' series.\nPercentage stat panel expects two series.';
              throw error;
            }
            if (result.data[0].datapoints.length != 1 || result.data[1].datapoints.length != 1) {
              var _error = new Error();
              _error.message = 'Some values are not aggregated. Single result from each query is needed';
              _error.data = _error.message;
              throw _error;
            }

            // check for if data source returns subject
            if (result && result.subscribe) {
              this.handleDataStream(result);
              return;
            }

            if (this.dashboard.snapshot) {
              this.panel.snapshotData = result.data;
            }

            if (!result || !result.data) {
              console.log('Data source query result invalid, missing data field:', result);
              result = { data: [] };
            }

            var percentage = result.data[0].datapoints[0][0] / result.data[1].datapoints[0][0] * 100;

            result.data.splice(1, 1);

            result.data[0].datapoints[0][0] = percentage;

            return this.events.emit('data-received', result.data);
          }
        }]);

        return PercentagePluginCtrl;
      }(SingleStatCtrl));

      _export('PercentagePluginCtrl', PercentagePluginCtrl);

      PercentagePluginCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=percentage_ctrl.js.map
