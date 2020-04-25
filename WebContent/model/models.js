sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/Device"
], function (JSONModel, ODataModel, Device) {
	"use strict";

	return {
		oModelUrlCache: {
            // "DrivingSafety": "/xsodata/DrivingSafety.xsodata"

            "DrivingSafety": "/xsodata/MasterDataManagement.xsodata"
		},
		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createODataModel: function (modelAlias) {
			var oModel = new ODataModel(this.oModelUrlCache[modelAlias], {
				json: true
			});
			return oModel;
		}
	};
});