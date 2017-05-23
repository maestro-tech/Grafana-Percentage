import {SingleStatCtrl} from 'app/plugins/panel/singlestat/module';

import moment from 'moment';
import _ from 'lodash';
import $ from 'jquery';
import 'jquery.flot';
import 'jquery.flot.gauge';
import kbn from 'app/core/utils/kbn';
import TimeSeries from 'app/core/time_series2';

export class PercentagePluginCtrl extends SingleStatCtrl {

  constructor($scope, $injector, $rootScope) {
    super($scope, $injector);
    this.$rootScope = $rootScope;

    var panelDefaults = {
      links: [],
      datasource: null,
      maxDataPoints: 100,
      interval: null,
      targets: [{}],
      cacheTimeout: null,
      dayInterval: 'NOW',
      hourInterval: 'NOW',
      minuteInterval: 'NOW',
    };

    _.defaults(this.panel, panelDefaults);
    this.scope = $scope;

  }

  onInitEditMode() {
    super.onInitEditMode();
    //this.addEditorTab('Delta Config', 'public/plugins/grafana-delta-panel/delta_config.html', 2);
    this.unitFormats = kbn.getUnitFormats();
  }

  setUnitFormat(subItem) {
    super.setUnitFormat();
    this.panel.format = subItem.value;
    this.render();
  }

  issueQueries(datasource) {
    return new Promise((resolve, reject) => {
      this.datasource = datasource;

      if (!this.panel.targets || this.panel.targets.length === 0) {
        return this.$q.when([]);
      }

      // make shallow copy of scoped vars,
      // and add built in variables interval and interval_ms
      var scopedVars = Object.assign({}, this.panel.scopedVars, {
        "__interval":     {text: this.interval,   value: this.interval},
        "__interval_ms":  {text: this.intervalMs, value: this.intervalMs},
      });

      var metricsQuery = {
        panelId: this.panel.id,
        range: this.range,
        rangeRaw: this.rangeRaw,
        interval: this.interval,
        intervalMs: this.intervalMs,
        targets: this.panel.targets,
        format: this.panel.renderer === 'png' ? 'png' : 'json',
        maxDataPoints: this.resolution,
        scopedVars: scopedVars,
        cacheTimeout: this.panel.cacheTimeout
      };
      return resolve(datasource.query(metricsQuery));
    });
  }

  handleQueryResult(result) {
    this.setTimeQueryEnd();
    this.loading = false;

    if (result.data.length != 2) {
      let error = new Error();
      error.message = 'Not enougth series error';
      error.data = 'Metric query returns ' + result.data.length + ' series.\nPercentage stat panel expects two series.';
      throw error;
    }
    if (result.data[0].datapoints.length != 1 || result.data[1].datapoints.length != 1) {
      let error = new Error();
      error.message = 'Some values are not aggregated. Single result from each query is needed';
      error.data = error.message;
      throw error;
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
      result = {data: []};
    }

    let percentage = (result.data[0].datapoints[0][0] / result.data[1].datapoints[0][0]) * 100

    result.data.splice(1, 1);

    result.data[0].datapoints[0][0] = percentage;

    return this.events.emit('data-received', result.data);
  }
}

PercentagePluginCtrl.templateUrl = 'module.html';
