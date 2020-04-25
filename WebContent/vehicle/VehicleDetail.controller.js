sap.ui.define( [
    "sharedlib/controller/BaseController",
    "sap/ui/core/routing/History",
    "sap/ui/Device",
    'sap/m/Toolbar',
    'sap/m/SearchField',
    'sap/m/Button',
    'sap/m/Text',
    'sap/m/Dialog',
    'sap/m/List',
    'sap/m/StandardListItem',
    "com/sap/sdrive/ui/masterdata/model/GenericFormatter",
    "sap/ui/model/json/JSONModel",
    "sap/m/library",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/type/Date"
], function (Controller, History, Device, Toolbar, SearchField, Button, Text, Dialog, List, StandardListItem,GenericFormatter, JSONModel,mobileLibrary, Sorter, Filter, DateType) {

	"use strict";

	// shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

	return Controller.extend("com.sap.sdrive.ui.masterdata.vehicle.VehicleDetail", {


	    genericFormatter: GenericFormatter,

		onInit : function () {

			this._aValidKeys = ["shipping", "processor"];
			var oViewModel = new JSONModel({
				busy : false,
				delay : 0,
				editable : false,
				showHeader : true,
				showNavButton : true
			});

			this.getRouter().getRoute("vehicleDetail").attachPatternMatched(this._onObjectMatchedFromMaster, this);
			this.getRouter().getRoute("refVehicleDetail").attachPatternMatched(this._onObjectMatchedFromRef, this);

			this.setModel(oViewModel, "detailView");

			//this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

		},

		_onObjectMatchedFromMaster: function(oEvent) {

            this._onObjectMatched(oEvent);
            var oViewModel = this.getView().getModel("detailView");
            oViewModel.setProperty("/showHeader", false);
        },

        _onObjectMatchedFromRef: function(oEvent) {

            this._onObjectMatched(oEvent);
            var oViewModel = this.getView().getModel("detailView");
            oViewModel.setProperty("/showHeader", true);
        },

		_onObjectMatched: function(oEvent) {
			var that = this;
            var uid = oEvent.getParameter("arguments").vehicleId;
            var sObjectPath =  this.getOwnerComponent().getModel("DrivingSafety").createKey("Vehicle", {
					UID :  uid
				});
            this.getOwnerComponent().getModel("DrivingSafety").read(sObjectPath,{
                urlParameters: {$expand: 'Owner,Device,OwnVehicle/Driver,OwnVehicle/Company,Fee'},
                success: function (oData, oResponse) {
                    var oViewModel = that.getView().getModel("detailView");
                    oViewModel.setProperty("/vehicle", oData);
                },
                error: function (oError) {
                    console.log("VehicleDetail : " + oError);
                    sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                }
            });

            this.getView().byId("feeTable").bindElement({
                path : '/' + sObjectPath,
                model: "DrivingSafety",
                parameters: {
                    expand: "Fee"
                },
                events: {
                    dataReceived: function(response) {
                        if (response.mParameters.data.Message !== '') {
                            sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                        }
                    }
                }
            });

		},

        navToDevicePage: function(oEvent){
        		    var uid = oEvent.getSource().data("DEVICE_UID")

        			this.getRouter().navTo("refDeviceDetail",
        			    {
        				    deviceId: uid
        				},
        				false);

        		},

        navToOwnerPage: function(oEvent){
                		    var uid = oEvent.getSource().data("OWNER_UID")

                			this.getRouter().navTo("refOwnerDetail",
                			    {
                				    ownerId: uid
                				},
                				false);

                		},

        navToDriverPage: function(oEvent){
        		    var object = oEvent.getSource().getParent().getBindingContext("detailView").getObject();

        			this.getRouter().navTo("refDriverDetail",
        			    {
        				    driverId: object["REF_DRIVER.UID"]
        				},
        				false);

        		},

        navToCompanyPage: function(oEvent){
        		    var object = oEvent.getSource().getParent().getBindingContext("detailView").getObject();

        			this.getRouter().navTo("refCompanyDetail",
        			    {
        				    orgId: object["REF_COMPANY.UID"]
        				},
        				false);

        		},

        handleRefDeviceValueHelp: function(oEvent){

            var oValue = oEvent.getSource().getValue();

			if (!this._oDeviceValueHelpDialog) {
				this._oDeviceValueHelpDialog = sap.ui.xmlfragment("com.sap.sdrive.ui.masterdata.vehicle.DeviceValueHelp",this);
				this.getView().addDependent(this._oDeviceValueHelpDialog);
			}
			this._oDeviceValueHelpDialog.getBinding("items").filter();

			this._oDeviceValueHelpDialog.open();
		},


		handleRefDeviceSearch: function(oEvent) {
			var sQuery = oEvent.getParameter("value");
			var oBinding = oEvent.getSource().getBinding("items");
            var aFilters = [];
            var aField = ["DEVICE_ID", "MAC_ADDRESS", "MODEL"];

            if(!aField || aField.length === 0){
                return;
            }
            var filter;
            if(!sQuery || sQuery.length === 0){
                filter = null;
            } else {
                jQuery.each(aField, function(idx, fieldName){
                    aFilters.push(new sap.ui.model.Filter(fieldName, sap.ui.model.FilterOperator.Contains, sQuery));
                });

                filter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });
            }
            oBinding.filter(filter);
		},

        handleRefDeviceValueHelpClose : function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");

			if (oSelectedItem) {
				var object = oSelectedItem.getBindingContext("DrivingSafety").getObject();
                var oViewModel = this.getView().getModel("detailView");
                oViewModel.setProperty("/vehicle/Device", object);
			}

			if (!oSelectedItem) {

			}
		},

        handleRefOwnerValueHelp: function(oEvent){

            var oValue = oEvent.getSource().getValue();

			if (!this._oOwnerValueHelpDialog) {
				this._oOwnerValueHelpDialog = sap.ui.xmlfragment("com.sap.sdrive.ui.masterdata.vehicle.OwnerValueHelp",this);
				this.getView().addDependent(this._oOwnerValueHelpDialog);
			}

			this._oOwnerValueHelpDialog.open();
		},


		handleRefOwnerSearch: function(oEvent) {
			var sQuery = oEvent.getParameter("value");
			var oBinding = oEvent.getSource().getBinding("items");
            var aFilters = [];
            var aField = ["TEL_NO", "FULL_NAME", "ID"];

            if(!aField || aField.length === 0){
                return;
            }
            var filter;
            if(!sQuery || sQuery.length === 0){
                filter = null;
            } else {
                jQuery.each(aField, function(idx, fieldName){
                    aFilters.push(new sap.ui.model.Filter(fieldName, sap.ui.model.FilterOperator.Contains, sQuery));
                });

                filter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });
            }
            oBinding.filter(filter);
		},

        handleRefOwnerValueHelpClose : function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");

			if (oSelectedItem) {
				var object = oSelectedItem.getBindingContext("DrivingSafety").getObject();
                var oViewModel = this.getView().getModel("detailView");
                oViewModel.setProperty("/vehicle/Owner", object);
			}

			if (!oSelectedItem) {

			}
		},



        delete:function(){
            var that = this;
            var dialog = new Dialog({
                title: that.getI18NText("BUTTON_CONFIRM"),
                type: 'Message',
                content: new Text({ text: that.getI18NText("DELETE_CONFIRM") }),
                beginButton: new Button({
                    text: that.getI18NText("BUTTON_CONFIRM"),
                    press: function () {
                        var uid = that.getView().getModel("detailView").getProperty("/vehicle/UID");
                        that.getOwnerComponent().model.singleEdit({
                            type:"vehicleDelete",
                            data:{UID:uid}
                        },function(){
                            var oViewModel = that.getView().getModel("detailView");
                            oViewModel.setProperty("/vehicle", {});
                            sap.m.MessageToast.show(that.getI18NText("DELETE_SUCCESS"));
                        });
                        dialog.close();
                    }
                }),
                endButton: new Button({
                    text: that.getI18NText("BUTTON_CANCEL"),
                    press: function () {
                        dialog.close();
                    }
                }),
                afterClose: function() {
                    dialog.destroy();
                }
            });

            dialog.open();
        },

        onSavePressed:function(){

            var that = this;
            var oViewModel = this.getView().getModel("detailView");
            oViewModel.setProperty("/editable",false);
            oViewModel.setProperty("/busy",true);

            var data = oViewModel.getProperty("/vehicle");
            if(this.getView().byId("ENTITY_VEHICLE_REFDEVICE_UID").getValue()){
                data["REF_DEVICE.UID"] = oViewModel.getProperty("/vehicle/Device/UID");
            }else{
                data["REF_DEVICE.UID"] = null;
            }

            if(this.getView().byId("ENTITY_VEHICLE_REFOWNER_UID").getValue()){
                data["REF_OWNER.UID"] = oViewModel.getProperty("/vehicle/Owner/UID");
            }else{
                data["REF_OWNER.UID"] = null;
            }
            var sObjectPath =  this.getOwnerComponent().getModel("DrivingSafety").createKey("Vehicle", {UID :  data.UID});


            this.getOwnerComponent().getModel("DrivingSafety").update(sObjectPath,data,{
                success: function (oData, oResponse) {
                    sap.m.MessageToast.show(that.getI18NText("SUCCESSFULLY_MODIFIED"));
                    oViewModel.setProperty("/busy",false);
                },
                error: function (oError) {
                    console.log("VehicleDetail : " + oError);
                    sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                    oViewModel.setProperty("/busy",false);
                }
            });

         },
        onEditPressed:function(){
            var that = this;
            var oViewModel = that.getView().getModel("detailView");
            oViewModel.setProperty("/editable",true);
        },
        onFeeSortButtonPressed: function() {
            var _oFeeSortSettingsDialog = sap.ui.xmlfragment("com.sap.sdrive.ui.masterdata.vehicle.fragment.FeeSortDialog", this);
            this._oFeeSortSettingsDialog = _oFeeSortSettingsDialog;
            this.getView().addDependent(this._oFeeSortSettingsDialog);
            this._oFeeSortSettingsDialog.open();
        },
        handleFeeSortDialogConfirm: function(oEvent) {
            var oTable = this.byId("feeTable"),
                mParams = oEvent.getParameters(),
                oBinding = oTable.getBinding("items"),
                sPath,
                bDescending,
                aSorters = [];
            
            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));
            oBinding.sort(aSorters);
        },
        onFeeFilterButtonPressed: function() {
            var _oFeeFilterSettingsDialog = sap.ui.xmlfragment("com.sap.sdrive.ui.masterdata.vehicle.fragment.FeeFilterDialog", this);
            this._oFeeFilterSettingsDialog = _oFeeFilterSettingsDialog;
            this.getView().addDependent(this._oFeeFilterSettingsDialog);
            this._oFeeFilterSettingsDialog.open();
        },
        handleFeeFilterDialogConfirm: function(oEvent) {
            var oTable = this.byId("feeTable"),
                mParams = oEvent.getParameters(),
                oBinding = oTable.getBinding("items"),
                aFilters = [];
            
            mParams.filterItems.forEach(function(oItem) {

            });
        },
        onFeeDialogPressed: function() {
            var oNewFee = {
                FEE_START_DATE: null,
                feeStartDateValueState: 'None',
                feeStartDateValueStateText: '',
                FEE_END_DATE: null,
                feeEndDateValueState: 'None',
                feeEndDateValueStateText: '',
                FEE: null,
                CURRENCY_CODE: "CNY",
                feeValueState: 'None',
                feeValueStateText: '',
                dialogBusy: false
            };

            if (!this._oNewFeeModel) {
                console.log("Build Fee Model ... ");
                var oNewFeeModel = new JSONModel();
                oNewFeeModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                this.setModel(oNewFeeModel, "newFeeModel");
                this._oNewFeeModel = oNewFeeModel;
            } 
            this._oNewFeeModel.setData(oNewFee);



            console.log("Fee Dialog Open");
            if (this._oFeeDialog) {
                this._oFeeDialog.destroy();
            }
            var _oFeeDialog = sap.ui.xmlfragment("com.sap.sdrive.ui.masterdata.vehicle.fragment.CreateFee", this);
            this._oFeeDialog = _oFeeDialog;
            this.getView().addDependent(this._oFeeDialog);
            
            var oInputStartDate = sap.ui.getCore().byId("inputStartDate"),
                dMinDate = new Date('2008-01-01');
            oInputStartDate.setMinDate(dMinDate);
            oInputStartDate.getBinding("value").setType(new DateType({
                UTC: true,
                pattern: "yyyy-MM-dd",
                strictParsing: true
            }, {
                minimum: dMinDate
            }), "string");

            this._oFeeDialog.open();
        },
        onFeeEditPressed: function(oEvent) {
            console.log("Detail Pressed");
            var sUUID = oEvent.getSource().data("uuid");

            if (!this._oFeeModel) {
                console.log("Build Fee Model ... ");
                var oFeeModel = new JSONModel();
                oFeeModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                this.setModel(oFeeModel, "feeModel");
                this._oFeeModel = oFeeModel;
            } 

            var oFee = {
                UID: '',
                FEE_START_DATE: null,
                feeStartDateValueState: 'None',
                feeStartDateValueStateText: '',
                FEE_END_DATE: null,
                feeEndDateValueState: 'None',
                feeEndDateValueStateText: '',
                FEE: null,
                feeValueState: 'None',
                feeValueStateText: '',
                CURRENCY_CODE: 'CNY',
                CREATED_ON: null,
                CREATED_BY: '',
                CHANGED_ON: null,
                CHANGED_BY: '',
                dialogBusy: false
            };

            this._oFeeModel.setData(oFee);

            var oDrivingSafetyModel = this.getOwnerComponent().getModel("DrivingSafety");
            var sFeeOdataPath =  oDrivingSafetyModel.createKey("Fee", {
                UID :  sUUID
            });
            
            var that = this;
            oDrivingSafetyModel.read(sFeeOdataPath,{
                success: function (oData, oResponse) {
                    var oFee = {
                        UID: oData.UID,
                        FEE_START_DATE: oData.FEE_START_DATE,
                        feeStartDateValueState: 'None',
                        feeStartDateValueStateText: '',
                        FEE_END_DATE: oData.FEE_END_DATE,
                        feeEndDateValueState: 'None',
                        feeEndDateValueStateText: '',
                        FEE: oData.FEE,
                        feeValueState: 'None',
                        feeValueStateText: '',
                        CURRENCY_CODE: oData.CURRENCY_CODE,
                        "REF_VEHICLE.UID": oData["REF_VEHICLE.UID"],
                        CREATED_ON: oData.CREATED_ON,
                        CREATED_BY: oData.CREATED_BY,
                        CHANGED_ON: oData.CHANGED_ON,
                        CHANGED_BY: oData.CHANGED_BY,
                        dialogBusy: false
                    };
                    that._oFeeModel.setData(oFee);

                },
                error: function (oError) {
                    console.log("VehicleDetail : " + oError);
                    sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                }
            });

            if (this._oEditFeeDialog) {
                this._oEditFeeDialog.destroy();
            }
            var _oEditFeeDialog = sap.ui.xmlfragment("com.sap.sdrive.ui.masterdata.vehicle.fragment.EditFee", this);
            this._oEditFeeDialog = _oEditFeeDialog;
            this.getView().addDependent(this._oEditFeeDialog);


            var oInputStartDate = sap.ui.getCore().byId("inputStartDate"),
                dMinDate = new Date('2008-01-01');
            oInputStartDate.setMinDate(dMinDate);
            oInputStartDate.getBinding("value").setType(new DateType({
                UTC: true,
                pattern: "yyyy-MM-dd",
                strictParsing: true
            }, {
                minimum: dMinDate
            }), "string");


            this._oEditFeeDialog.open();
        },
        onFeeEditDialogSave: function(oEvent) {
            console.log("Fee Dialog Save");
            var oFeeModel = this.getModel("feeModel");
            oFeeModel.setProperty("/dialogBusy", true);
            var oFee = oFeeModel.getProperty("/");

            if (!oFee.FEE_START_DATE) {
                oFeeModel.setProperty("/feeStartDateValueStateText", this.getI18NText("ENTITY_VEHICLE_FEE_DIALOG_LABEL_START_DATE_STATE_MSG_1"));
                oFeeModel.setProperty("/feeStartDateValueState", 'Error');
                return
            }
            if (!oFee.FEE_END_DATE) {
                oFeeModel.setProperty("/feeEndDateValueStateText", this.getI18NText("ENTITY_VEHICLE_FEE_DIALOG_LABEL_END_DATE_STATE_MSG_1"));
                oFeeModel.setProperty("/feeEndDateValueState", 'Error');
                return
            }
            if (!oFee.FEE) {
                oFeeModel.setProperty("/feeValueStateText", this.getI18NText("ENTITY_VEHICLE_FEE_DIALOG_LABEL_FEE_STATE_MSG_1"));
                oFeeModel.setProperty("/feeValueState", 'Error');
                return
            }
            
            var that = this;
            var oDrivingSafetyModel = this.getOwnerComponent().getModel("DrivingSafety"),
                sFeeOdataPath =  oDrivingSafetyModel.createKey("Fee", {
                    UID :  oFee.UID
                }),
                oViewModel = this.getView().getModel("detailView"),
                iVehicleUID = oViewModel.getProperty("/vehicle/UID"),
                sVehicleOdataPath =  oDrivingSafetyModel.createKey("Vehicle", {
                    UID :  iVehicleUID
                });
            oDrivingSafetyModel.update(sFeeOdataPath, oFee, {
                success: function (oData, oResponse) {
                    sap.m.MessageToast.show(that.getI18NText("SUCCESSFULLY_MODIFIED"));
                    oFeeModel.setProperty("/dialogBusy", false);
                    that._oEditFeeDialog.close();
                    that._oEditFeeDialog.destroy();

                    oViewModel.setProperty("/vehicle/feeTableBusy", true);

                    oDrivingSafetyModel.read(sVehicleOdataPath + "/Fee",{
                        success: function (oData, oResponse) {
                            oViewModel.setProperty("/vehicle/feeTableBusy", false);
                        },
                        error: function (oError) {
                            console.log("VehicleDetail : " + oError);
                            sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                        }
                    });  
                },
                error: function (oError) {
                    console.log("Fee Creation: " + oError);
                    sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                }
            });
        },
        onFeeEditDialogCancel: function(oEvent) {
            console.log("Fee Dialog Cancel");
            this._oEditFeeDialog.close();
            this._oEditFeeDialog.destroy();
        },
        onFeeDelete: function(oEvent) {
            console.log("Fee Deletion");
            var sUUID = oEvent.getParameters().listItem.data("uuid");

            if (!this._oFeeModel) {
                console.log("Build Fee Model ... ");
                var oFeeModel = new JSONModel();
                oFeeModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                this.setModel(oFeeModel, "feeModel");
                this._oFeeModel = oFeeModel;
            } 
           

            var oDrivingSafetyModel = this.getOwnerComponent().getModel("DrivingSafety");
            var sFeeOdataPath =  oDrivingSafetyModel.createKey("Fee", {
                UID :  sUUID
            });
            
            var that = this;
            oDrivingSafetyModel.read(sFeeOdataPath,{
                success: function (oData, oResponse) {
                    console.log("editFeeObj", oData);
                    var oFee = {
                        UID: oData.UID,
                        FEE_START_DATE: oData.FEE_START_DATE, 
                        FEE_END_DATE: oData.FEE_END_DATE,
                        FEE: oData.FEE,
                        CURRENCY_CODE: oData.CURRENCY_CODE,
                        "REF_VEHICLE.UID": oData["REF_VEHICLE.UID"],
                        CREATED_ON: oData.CREATED_ON,
                        CREATED_BY: oData.CREATED_BY,
                        CHANGED_ON: oData.CHANGED_ON,
                        CHANGED_BY: oData.CHANGED_BY,
                        dialogBusy: false
                    };
                    that._oFeeModel.setData(oFee);

                },
                error: function (oError) {
                    console.log("VehicleDetail : " + oError);
                    sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                }
            });

            if (this._oFeeDeleteDialog) {
                this._oFeeDeleteDialog.destroy();
            }
            var _oFeeDeleteDialog = sap.ui.xmlfragment("com.sap.sdrive.ui.masterdata.vehicle.fragment.DeleteFee", this);
            this._oFeeDeleteDialog = _oFeeDeleteDialog;
            this.getView().addDependent(this._oFeeDeleteDialog);

            this._oFeeDeleteDialog.open();
        },
        handleFeeDelete: function(oEvent) {
            console.log("Fee Dialog Delete");
            var oFeeModel = this.getModel("feeModel");
            oFeeModel.setProperty("/dialogBusy", true);
            var oFee = oFeeModel.getProperty("/");
            

            var that = this;
            var oDrivingSafetyModel = this.getOwnerComponent().getModel("DrivingSafety"),
                sFeeOdataPath =  oDrivingSafetyModel.createKey("Fee", {
                    UID :  oFee.UID
                }),
                oViewModel = this.getView().getModel("detailView"),
                iVehicleUID = oViewModel.getProperty("/vehicle/UID"),
                sVehicleOdataPath =  oDrivingSafetyModel.createKey("Vehicle", {
                    UID :  iVehicleUID
                });

            oDrivingSafetyModel.remove(sFeeOdataPath, {
                success: function (oData, oResponse) {
                    sap.m.MessageToast.show(that.getI18NText("SUCCESSFULLY_MODIFIED"));
                    oFeeModel.setProperty("/dialogBusy", false);
                    that._oFeeDeleteDialog.close();
                    that._oFeeDeleteDialog.destroy();


                    oViewModel.setProperty("/vehicle/feeTableBusy", true);

                    oDrivingSafetyModel.read(sVehicleOdataPath + "/Fee",{
                        success: function (oData, oResponse) {
                            oViewModel.setProperty("/vehicle/feeTableBusy", false);
                        },
                        error: function (oError) {
                            console.log("VehicleDetail : " + oError);
                            sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                        }
                    });  
                },
                error: function (oError) {
                    console.log("Fee Creation: " + oError);
                    sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                }
            });
        },
        onFeeDeleteDialogCancel: function() {
            console.log("Fee Dialog Cancel");
            this._oFeeDeleteDialog.close();
            this._oFeeDeleteDialog.destroy();
        },
        onFeeDialogCreate: function(oEvent) {
            console.log("Fee Dialog Create");
            var oFeeModel = this.getModel("newFeeModel");
            
            var oFee = oFeeModel.getProperty("/");

            if (!oFee.FEE_START_DATE) {
                oFeeModel.setProperty("/feeStartDateValueStateText", this.getI18NText("ENTITY_VEHICLE_FEE_DIALOG_LABEL_START_DATE_STATE_MSG_1"));
                oFeeModel.setProperty("/feeStartDateValueState", 'Error');
                return
            }
            if (!oFee.FEE_END_DATE) {
                oFeeModel.setProperty("/feeEndDateValueStateText", this.getI18NText("ENTITY_VEHICLE_FEE_DIALOG_LABEL_END_DATE_STATE_MSG_1"));
                oFeeModel.setProperty("/feeEndDateValueState", 'Error');
                return
            }
            if (!oFee.FEE) {
                oFeeModel.setProperty("/feeValueStateText", this.getI18NText("ENTITY_VEHICLE_FEE_DIALOG_LABEL_FEE_STATE_MSG_1"));
                oFeeModel.setProperty("/feeValueState", 'Error');
                return
            }

            oFeeModel.setProperty("/dialogBusy", true);
            var oViewModel = this.getView().getModel("detailView"),
                iVehicleUID = oViewModel.getProperty("/vehicle/UID");

            oFee["REF_VEHICLE.UID"] = iVehicleUID;

            var that = this;

            var oDrivingSafetyModel = this.getOwnerComponent().getModel("DrivingSafety"),
                sVehicleOdataPath =  oDrivingSafetyModel.createKey("Vehicle", {
                    UID :  iVehicleUID
                });
            
            
            oDrivingSafetyModel.create("/Fee", oFee, {
                success: function (oData, oResponse) {
                    sap.m.MessageToast.show(that.getI18NText("SUCCESSFULLY_MODIFIED"));
                    oFeeModel.setProperty("/dialogBusy", false);
                    that._oFeeDialog.close();
                    that._oFeeDialog.destroy();



                    oViewModel.setProperty("/vehicle/feeTableBusy", true);

                    oDrivingSafetyModel.read(sVehicleOdataPath + "/Fee",{
                        success: function (oData, oResponse) {
                            oViewModel.setProperty("/vehicle/feeTableBusy", false);
                        },
                        error: function (oError) {
                            console.log("VehicleDetail : " + oError);
                            sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                        }
                    });  
                },
                error: function (oError) {
                    console.log("Fee Creation: " + oError);
                    sap.m.MessageToast.show(that.getI18NText("OPERATION_FAILED"));
                }
            });
        },
        handleFeeStartDateChange: function(oEvent) {
            //var sLocale = sap.ui.getCore().getConfiguration().getLanguage(),
            //    oTextBudle = this.getView().getModel("i18n").getResourceBundle();

            var oStartDatePicker = oEvent.getSource(),
                bValid = oEvent.getParameter("valid"),
                dStartDate = oStartDatePicker.getDateValue();

            var dPreEndDate = this._getDateAfterOneYear(dStartDate);
            //this._oNewFeeModel.setProperty("/FEE_START_DATE", dStartDate);
            this._oNewFeeModel.setProperty("/FEE_END_DATE", dPreEndDate);
            
            var oInputEndDate = sap.ui.getCore().byId("inputEndDate");
            oInputEndDate.setMinDate(dStartDate);
            oInputEndDate.getBinding("value").setType(new DateType({
                pattern: "yyyy-MM-dd",
                strictParsing: true
            }, {
                minimum: dStartDate
            }), "string");
            oInputEndDate.setValueState(sap.ui.core.ValueState.Success);
        },
        handleFeeChange: function(oEvent) {
            var value = oEvent.getSource().getValue();
            value = value.replace(/\,/g, '');
            
            if (!value) {
                oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                return
            } else {
                oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
            }
            if (Number.isNaN(Number(value))) {
                oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
            } else {
                oEvent.getSource().setValueState(sap.ui.core.ValueState.Success);
            }
        },
        onFeeDialogCancel: function(oEvent) {
            console.log("Fee Dialog Cancel");
            this._oFeeDialog.close();
            this._oFeeDialog.destroy();
        },
        _getDateAfterOneYear: function( startDate ) {
            var year = startDate.getFullYear(),
            month = startDate.getMonth(),
            day = startDate.getDate();
            
            return  new Date( year, month + 12, day );

        },
        handleDateParseError: function(oEvent) {
            oEvent.getSource().setValueStateText(this.getI18NText("ENTITY_VEHICLE_FEE_DIALOG_PARSE_DATE_ERROR_MSG"));
            oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
        },
        handleCurrencyParseError: function(oEvent) {
            oEvent.getSource().setValueState(this.getI18NText("ENTITY_VEHICLE_FEE_DIALOG_PARSE_CURRENCY_ERROR_MSG"));
            oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
        },
        handleValidationError: function(oEvent) {
            oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
        },
        handleValidationSuccess: function(oEvent) {
            oEvent.getSource().setValueState(sap.ui.core.ValueState.Success);
        }
	});

}, /* bExport= */ true);
