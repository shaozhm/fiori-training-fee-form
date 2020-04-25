sap.ui.define( [
	"sap/ui/core/mvc/Controller",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel"
], function (Controller, Device, JSONModel) {
	"use strict";

	return Controller.extend("com.sap.sdrive.ui.masterdata.batch.BatchMaster", {
		onInit : function () {
            this.getOwnerComponent().getRouter().getRoute("batchMaster").attachPatternMatched(this._onRouteMatched, this);
		},
        _onRouteMatched: function(oEvent) {
        },
		onCategoryPress: function(oEvent) {
            var category = oEvent.getSource().getBindingContextPath().replace("/batchCategory/","");
            this.getOwnerComponent().getRouter().navTo("batchDetail", {category: category}, true);
		},
        onNavBack:function(oEvent){
                this.getOwnerComponent().getRouter().navTo("categoryMaster", {}, true);
		},
	});

}, /* bExport= */ true);
