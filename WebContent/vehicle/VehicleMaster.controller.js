sap.ui.define([
    "sharedlib/controller/BaseController",
    "sap/ui/core/routing/History",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet"
], function (Controller, History, Device, JSONModel, Spreadsheet) {
    "use strict";

    return Controller.extend("com.sap.sdrive.ui.masterdata.vehicle.VehicleMaster", {
        onInit: function () {
            var oModel = new JSONModel({
                totalVehicleCount: null
            });
            this.getView().setModel(oModel);

            this._oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            this.getOwnerComponent().getRouter().getRoute("vehicleMaster").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function (oEvent) {
            this.onSelectionChange();
        },
        onNavBack: function (oEvent) {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("categoryMaster", {}, true);
            }
        },
        onSelectionChange: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/totalVehicleCount", "[" + this.getView().byId("masterlist").getGrowingInfo().total + "]");

            var selectedItem = this.getView().byId("masterlist").getSelectedItem();
            if (selectedItem) {
                var selectedData = selectedItem.getBindingContext("DrivingSafety").getObject();
                this.getOwnerComponent().getRouter().navTo("vehicleDetail", { vehicleId: selectedData["REF_VEHICLE.UID"] }, true);
            }
        },
        onUpdateFinished: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/totalVehicleCount", "[" + this.getView().byId("masterlist").getGrowingInfo().total + "]");
        },
        onSearch: function (oEvent) {
            var oTable = this.getView().byId("masterlist"),
                aFilters = [],
                sQuery = oEvent.getSource().getValue().trim();

            var binding = oTable.getBinding("items");

            var aField = ["VIN", "PLATE_NUMBER"];
            if (!aField || aField.length === 0) {
                return;
            }
            var filter;
            if (!sQuery || sQuery.length === 0) {
                filter = null;
            } else {
                jQuery.each(aField, function (idx, fieldName) {
                    aFilters.push(new sap.ui.model.Filter(fieldName, sap.ui.model.FilterOperator.Contains, sQuery));
                });

                filter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });
            }
            binding.filter(filter);
        },
        createColumnConfig: function () {
            var aCols = [];

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_VIN"),
                type: 'string',
                property: 'Vehicle/VIN'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_ENGINE"),
                type: 'string',
                property: 'Vehicle/ENGINE_NO'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_PLATE_NUMBER"),
                type: 'string',
                property: 'Vehicle/PLATE_NUMBER'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_MAKER"),
                type: 'string',
                property: 'Vehicle/MAKER'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_MODEL"),
                type: 'string',
                property: 'Vehicle/MODEL'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_DOC_NUMBER"),
                type: 'string',
                property: 'Vehicle/DOC_NUMBER'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_CARD_ID"),
                type: 'string',
                property: 'Vehicle/CARD_ID'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_LIC_VALID_FROM"),
                type: 'date',
                property: 'Vehicle/LICENSE_VALID_FROM'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_LIC_VALID_TO"),
                type: 'date',
                property: 'Vehicle/LICENSE_VALID_TO'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_BIZ_ID"),
                type: 'string',
                property: 'Vehicle/OP_CERT_NUMBER'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_BIZ_VALID_FROM"),
                type: 'date',
                property: 'Vehicle/OP_CERT_VALID_FROM'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_VEHICLE_BIZ_VALID_TO"),
                type: 'date',
                property: 'Vehicle/OP_CERT_VALID_TO'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_OWNER_CITIZEN_ID"),
                type: 'string',
                property: 'Vehicle/Owner/ID'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_OWNER_FIRST_NAME"),
                type: 'string',
                property: 'Vehicle/Owner/FIRST_NAME'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_OWNER_LAST_NAME"),
                type: 'string',
                property: 'Vehicle/Owner/LAST_NAME'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_OWNER_GENDER"),
                type: 'string',
                property: 'Vehicle/Owner/GENDER'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_OWNER_TELEPHONE"),
                type: 'string',
                property: 'Vehicle/Owner/TEL_NO'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_OWNER_BIRTH_DATE"),
                type: 'date',
                property: 'Vehicle/Owner/BIRTH_DATE'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_OWNER_PLATFORM_USER"),
                type: 'string',
                property: 'Vehicle/Owner/ACCOUNT'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_DEVICE_ID"),
                type: 'string',
                property: 'Vehicle/Device/DEVICE_ID'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_SIM_ID"),
                type: 'string',
                property: 'Vehicle/Device/SIM_ID'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_MAKER"),
                type: 'string',
                property: 'Vehicle/Device/MAKER'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_MODEL"),
                type: 'string',
                property: 'Vehicle/Device/MODEL'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_MAC_ADDRESS"),
                type: 'string',
                property: 'Vehicle/Device/MAC_ADDRESS'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_PRICE"),
                type: 'string',
                property: 'Vehicle/Device/PRICE'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_DESCRIPTION"),
                type: 'string',
                property: 'Vehicle/Device/DESCRIPTION'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_DEVICE_TYPE"),
                type: 'string',
                property: 'Vehicle/Device/DEVICE_TYPE'
            });

            aCols.push({
                label: this._oResourceBundle.getText("ENTITY_DEVICE_PURCHASE_DATE"),
                type: 'date',
                property: 'Vehicle/Device/PURCHASE_DATE'
            });

            return aCols;
        },
        onVehicleExport: function (oEvent) {
            var aCols, oRowBinding, oSettings, oSheet, oTable;

            if (!this._oTable) {
                this._oTable = this.byId("masterlist");
            }

            oTable = this._oTable;
            oRowBinding = oTable.getBinding("items");

            aCols = this.createColumnConfig();

            var oModel = oRowBinding.getModel();

            oSettings = {
                workbook: {
                    columns: aCols,
                    hierarchyLevel: 'Level'
                },
                dataSource: {
                    type: "odata",
                    dataUrl: "/xsodata/MasterDataManagement.xsodata/AuthOwnVehicle?$expand=Vehicle/Owner,Vehicle/Device,Driver,Company",
                    serviceUrl: oModel.sServiceUrl,
                    headers: oModel.getHeaders ? oModel.getHeaders() : null,
                    count: this.getView().byId("masterlist").getGrowingInfo().total,
                    useBatch: oModel.bUseBatch
                },
                worker: false // We need to disable worker because we are using a MockServer as OData Service
            };

            oSheet = new Spreadsheet(oSettings);
            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        }
    });

}, /* bExport= */ true);
