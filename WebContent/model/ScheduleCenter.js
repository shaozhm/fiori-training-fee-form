sap.ui.define([], function () {
	"use strict";
	return {
		_schedulers: {},
		addScheduler: function (id, scheduler) {
			var obj = {
				"id": id,
				"startDate": new Date(),
				"scheduler": scheduler
			};
			if (!this._schedulers[id]) {
				this._schedulers[id] = obj;
			} else {
				throw "the scheduler exists";
			}
		},
		removeScheduler: function (id) {
			if (this._schedulers.hasOwnProperty(id)) {
				var obj = this._schedulers[id];
				window.clearInterval(obj.scheduler);
				delete this._schedulers[id];
			}
		},
		removeSchedulers: function(aId){
			var that = this;
			jQuery.each(aId, function(index, id) {
				that.removeScheduler(id);
			});
		},
		getById: function (id) {
			return this._schedulers[id];
		},
		shutdown: function () {
			var key;
			for (key in this._schedulers) {
				this.removeScheduler(key);
			}
			console.log("shutdown schedule center", this._schedulers);
		}
	};
});