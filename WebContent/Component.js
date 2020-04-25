jQuery.sap.registerModulePath("sharedlib", "/sharedlib/");

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "com/sap/sdrive/ui/masterdata/model/models",
    "com/sap/sdrive/ui/masterdata/lib/includeScript",
    "sharedlib/thirdparty/xlsx.full.min"
], function (UIComponent, JSONModel, Device, models, includeScript, xlsx) {
    "use strict";
    return UIComponent.extend("com.sap.sdrive.ui.masterdata.Component", {

        // metadata: {
        // 	rootView: {
        // 		"viewName": "com.sap.sdrive.ui.masterdata.App",
        // 		"type": "XML",
        // 		"async": true
        // 	},
        // 	routing: {
        // 	}
        // },
        metadata: {
            manifest: "json"
        },
        getI18NText: function (key) {
            var oResourceBundle = this.getModel("i18n").getResourceBundle();
            return oResourceBundle.getText(key);
        },
        init: function () {
            var that = this;
            if (window.location.pathname.lastIndexOf("sites") !== -1) {
                jQuery.sap.registerModulePath("com.sap.sdrive.ui.masterdata", "/masterdata");
            }

            this.extendUI5Library();
            var that = this;

            $.each(models.oModelUrlCache, function (key, val) {
                this.setModel(models.createODataModel(key), key);
            }.bind(this));

            var oDrivingSafetyModel = that.getModel("DrivingSafety");
            this.model = {
                singleEdit: function (postData, callback, errorCallback, refresh) {
                    sap.ui.core.BusyIndicator.show(0);
                    $.ajax({
                        type: "GET",
                        async: false,
                        url: "/xsjs/csrf.xsjs",
                        contentType: "application/json",
                        headers: {
                            'x-csrf-token': 'Fetch',
                            'Accept': "application/json"
                        },
                        success: function (data, textStatus, request) {
                            var xsrf_token = request.getResponseHeader('x-csrf-token');
                            $.ajax({
                                url: "/xsjs/masterdata/singleEdit.xsjs",
                                method: 'POST',
                                data: JSON.stringify(postData),
                                contentType: "application/json",
                                headers: {
                                    'x-csrf-token': xsrf_token,
                                    'Accept': "application/json"
                                },
                                success: function (data) {
                                    if (refresh) {
                                        oDrivingSafetyModel.refresh();
                                    }
                                    sap.ui.core.BusyIndicator.hide();
                                    callback(data);
                                },
                                error: function (error) {
                                    sap.ui.core.BusyIndicator.hide();
                                    // sap.m.MessageToast.show(that.getI18NText("MESSAGE_SAVE_FAILED"));
                                    errorCallback(error);
                                }
                            });

                        },
                        error: function (error) {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show(that.getI18NText("MESSAGE_SAVE_FAILED"));
                        }
                    });
                },

                readData: function (postData, callback) {
                    var that = this;
                    sap.ui.core.BusyIndicator.show(0);
                    $.ajax({
                        type: "GET",
                        async: false,
                        url: "/xsjs/masterdata/readData.xsjs",
                        contentType: "application/json",
                        headers: {
                            'x-csrf-token': 'Fetch',
                            'Accept': "application/json"
                        },
                        success: function (data, textStatus, request) {
                            var xsrf_token = request.getResponseHeader('x-csrf-token');
                            $.ajax({
                                url: "/xsjs/masterdata/readData.xsjs",
                                method: 'POST',
                                data: JSON.stringify(postData),
                                contentType: "application/json",
                                headers: {
                                    'x-csrf-token': xsrf_token,
                                    'Accept': "application/json"
                                },
                                success: function (data) {
                                    sap.ui.core.BusyIndicator.hide();
                                    callback(JSON.parse(data));
                                },
                                error: function (error) {
                                    sap.ui.core.BusyIndicator.hide();
                                    var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                                    sap.m.MessageToast.show(i18n.getText("MESSAGE_READ_FAILED"));
                                }
                            });

                        },
                        error: function (error) {
                            sap.ui.core.BusyIndicator.hide();
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            sap.m.MessageToast.show(i18n.getText("MESSAGE_SAVE_FAILED"));
                        }
                    });
                },
                getOrgDetail: function (id, callback) {
                    oDrivingSafetyModel.read("/Company(" + id + ")", {
                        success: function (oData, oResponse) {
                            callback(oData);
                        },
                        error: function (oError) {
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            console.log("Component : " + oError);
                            sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                        }
                    });
                },
                getSubOrg: function (id, callback) {
                    oDrivingSafetyModel.read("/Company?$filter=DELETE_FLAG eq '0' and PARENT eq " + id, {
                        success: function (oData, oResponse) {
                            callback(oData.results);
                        },
                        error: function (oError) {
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            console.log("Component : " + oError);
                            sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                        }
                    });
                },
                getOwnerDetail: function (id, callback) {
                    oDrivingSafetyModel.read("/Owner(" + id + ")?$expand=Vehicle/Device", {
                        success: function (oData, oResponse) {
                            callback(oData);
                        },
                        error: function (oError) {
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            console.log("Component : " + oError);
                            sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                        }
                    });
                },
                getUserDetail: function (id, callback) {
                    oDrivingSafetyModel.read("/User('" + id + "')", {
                        success: function (userDetail, oResponse) {
                            oDrivingSafetyModel.read("/UserCompany?$filter=REF_USER.UID eq '" + id + "'&$expand=Company", {
                                success: function (userCompanyData, oResponse) {
                                    var userCompany = userCompanyData.results;
                                    for (var i in userCompany) {
                                        userCompany[i].CompanyNAME = userCompany[i].Company.NAME;
                                    }
                                    callback({
                                        userDetail: userDetail,
                                        userCompany: userCompany
                                    });
                                },
                                error: function (oError) {
                                    var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                                    console.log("Component : " + oError);
                                    sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                                }
                            });
                        },
                        error: function (oError) {
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            console.log("Component : " + oError);
                            sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                        }
                    });
                },
                getDriverDetail: function (id, callback) {
                    oDrivingSafetyModel.read("/Driver(" + id + ")", {
                        success: function (oData, oResponse) {
                            callback(oData);
                        },
                        error: function (oError) {
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            console.log("Component : " + oError);
                            sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                        }
                    });
                },
                getDeviceDetail: function (id, callback) {
                    oDrivingSafetyModel.read("/Device(" + id + ")", {
                        success: function (oData, oResponse) {
                            callback(oData);
                        },
                        error: function (oError) {
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            console.log("Component : " + oError);
                            sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                        }
                    });
                },
                getVehicleDetail: function (id, callback) {
                    oDrivingSafetyModel.read("/Vehicle(" + id + ")", {
                        success: function (oData, oResponse) {
                            callback(oData);
                        },
                        error: function (oError) {
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            console.log("Component : " + oError);
                            sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                        }
                    });
                },
                getEFenceDetail: function (id, callback) {
                    oDrivingSafetyModel.read("/EFence(" + id + ")", {
                        success: function (oData, oResponse) {
                            callback(oData);
                        },
                        error: function (oError) {
                            var i18n = sap.ui.getCore().getModel("i18n").getResourceBundle();
                            console.log("Component : " + oError);
                            sap.m.MessageToast.show(i18n.getText("OPERATION_FAILED"));
                        }
                    });
                },
            };
            this.setModel(this.createDeviceModel(), "device");
            this.setModel(this.createSettingsModel(), "settings");
            this.setModel(new JSONModel(), "global");

            UIComponent.prototype.init.apply(this, arguments);

            // load AMap Api
            this.loadAMapAPI(function () {
                // enable routing
                that.getRouter().initialize();
                that.navToSubApp();
            });

            sap.ui.getCore().setModel(this.getModel("i18n"), "i18n");


        },
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        createSettingsModel: function () {
            var oModel = new JSONModel({
                batchCategory: [{
                        "id": "organization",
                        "name": this.getI18NText("ENTITY_COMPANY"),
                        column: [{
                                id: "NAME",
                                text: this.getI18NText("ENTITY_COMPANY_NAME")
                            },
                            {
                                id: "ORGANIZATION_CODE",
                                text: this.getI18NText("ENTITY_COMPANY_ORGANIZATION_CODE")
                            },
                            {
                                id: "ADDRESS",
                                text: this.getI18NText("ENTITY_COMPANY_ADDRESS")
                            },
                            {
                                id: "CONTACT",
                                text: this.getI18NText("ENTITY_COMPANY_CONTACT")
                            },
                            {
                                id: "CONTACT_NUMBER",
                                text: this.getI18NText("ENTITY_COMPANY_CONTACT_NUMBER")
                            },
                            {
                                id: "PARENT",
                                text: this.getI18NText("ENTITY_COMPANY_PARENT")
                            }
                        ]
                    },
                    {
                        "id": "owner",
                        "name": this.getI18NText("ENTITY_OWNER"),
                        column: [{
                                id: "ID",
                                text: this.getI18NText("ENTITY_OWNER_CITIZEN_ID")
                            },
                            {
                                id: "FIRST_NAME",
                                text: this.getI18NText("ENTITY_OWNER_FIRST_NAME")
                            },
                            {
                                id: "LAST_NAME",
                                text: this.getI18NText("ENTITY_OWNER_LAST_NAME")
                            },
                            {
                                id: "GENDER",
                                text: this.getI18NText("ENTITY_OWNER_GENDER") + this.getI18NText("VALID_GENDER_FORMAT")
                            },
                            {
                                id: "BIRTH_DATE",
                                text: this.getI18NText("ENTITY_OWNER_BIRTH_DATE") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "ACCOUNT",
                                text: this.getI18NText("ENTITY_OWNER_PLATFORM_USER")
                            },
                            {
                                id: "TEL_NO",
                                text: this.getI18NText("ENTITY_OWNER_TELEPHONE")
                            },
                        ]
                    },
                    {
                        "id": "driver",
                        "name": this.getI18NText("ENTITY_DRIVER"),
                        column: [{
                                id: "ID",
                                text: this.getI18NText("ENTITY_DRIVER_ID")
                            },
                            {
                                id: "FIRST_NAME",
                                text: this.getI18NText("ENTITY_DRIVER_FIRST_NAME")
                            },
                            {
                                id: "LAST_NAME",
                                text: this.getI18NText("ENTITY_DRIVER_LAST_NAME")
                            },
                            {
                                id: "GENDER",
                                text: this.getI18NText("ENTITY_DRIVER_GENDER") + this.getI18NText("VALID_GENDER_FORMAT")
                            },
                            {
                                id: "BIRTH_DATE",
                                text: this.getI18NText("ENTITY_DRIVER_BIRTH_DATE") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "PROFESSION",
                                text: this.getI18NText("ENTITY_DRIVER_PROFESSION")
                            },
                            {
                                id: "GET_LICENSE_DATE",
                                text: this.getI18NText("ENTITY_DRIVER_LICENSE_FORM_INITIAL_DATE") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "LICENSE_VALID_FROM",
                                text: this.getI18NText("ENTITY_DRIVER_LIC_VALID_FROM") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "LICENSE_VALID_TO",
                                text: this.getI18NText("ENTITY_DRIVER_LIC_VALID_TO") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "CLASS",
                                text: this.getI18NText("ENTITY_DRIVER_LIC_CLASS")
                            },
                            {
                                id: "OP_CERT_NUMBER",
                                text: this.getI18NText("ENTITY_DRIVER_BIZ_ID")
                            },
                            {
                                id: "OP_CERT_VALID_FROM",
                                text: this.getI18NText("ENTITY_DRIVER_BIZ_VALID_FROM") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "OP_CERT_VALID_TO",
                                text: this.getI18NText("ENTITY_DRIVER_BIZ_VALID_TO") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "OP_CERT_CLASS",
                                text: this.getI18NText("ENTITY_DRIVER_BIZ_CLASS")
                            },
                            // {
                            //     id: "DRIVING_AGE",
                            //     text: this.getI18NText("ENTITY_DRIVER_AGE") 
                            // },
                            {
                                id: "HEALTH_CONDITION",
                                text: this.getI18NText("ENTITY_DRIVER_HEALTH_STATUS")
                            },
                            {
                                id: "TEL_NO",
                                text: this.getI18NText("ENTITY_DRIVER_TELEPHONE")
                            }
                        ]
                    },
                    {
                        "id": "device",
                        "name": this.getI18NText("ENTITY_DEVICE"),
                        column: [{
                                id: "DEVICE_ID",
                                text: this.getI18NText("ENTITY_DEVICE_DEVICE_ID")
                            },
                            {
                                id: "SIM_ID",
                                text: this.getI18NText("SIM_ID")
                            },
                            {
                                id: "MAKER",
                                text: this.getI18NText("ENTITY_DEVICE_MAKER")
                            },
                            {
                                id: "MODEL",
                                text: this.getI18NText("ENTITY_DEVICE_MODEL")
                            },
                            {
                                id: "PRICE",
                                text: this.getI18NText("ENTITY_DEVICE_PRICE")
                            },
                            {
                                id: "MAC_ADDRESS",
                                text: this.getI18NText("ENTITY_DEVICE_MAC_ADDRESS")
                            },
                            {
                                id: "PURCHASE_DATE",
                                text: this.getI18NText("ENTITY_DEVICE_PURCHASE_DATE") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "DESCRIPTION",
                                text: this.getI18NText("ENTITY_DEVICE_DESCRIPTION")
                            }
                        ]
                    },
                    {
                        "id": "sim",
                        "name": this.getI18NText("ENTITY_SIM"),
                        column: [{
                                id: "UID",
                                text: this.getI18NText("ENTITY_SIM_UID")
                            },
                            {
                                id: "PURCHASE_DATE",
                                text: this.getI18NText("ENTITY_SIM_PURCHASE_DATE") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "OPERATOR",
                                text: this.getI18NText("ENTITY_SIM_OPERATOR")
                            }
                        ]
                    },
                    {
                        "id": "vehicle",
                        "name": this.getI18NText("ENTITY_VEHICLE"),
                        column: [{
                                id: "VIN",
                                text: this.getI18NText("ENTITY_VEHICLE_VIN")
                            },
                            {
                                id: "ENGINE_NO",
                                text: this.getI18NText("ENTITY_VEHICLE_ENGINE")
                            },
                            {
                                id: "PLATE_NUMBER",
                                text: this.getI18NText("ENTITY_VEHICLE_PLATE_NUMBER")
                            },
                            {
                                id: "DOC_NUMBER",
                                text: this.getI18NText("ENTITY_VEHICLE_DOC_NUMBER")
                            },
                            {
                                id: "CARD_ID",
                                text: this.getI18NText("ENTITY_VEHICLE_CARD_ID")
                            },
                            {
                                id: "LICENSE_VALID_FROM",
                                text: this.getI18NText("ENTITY_VEHICLE_LIC_VALID_FROM") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "LICENSE_VALID_TO",
                                text: this.getI18NText("ENTITY_VEHICLE_LIC_VALID_TO") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "OP_CERT_NUMBER",
                                text: this.getI18NText("ENTITY_VEHICLE_BIZ_ID")
                            },
                            {
                                id: "OP_CERT_VALID_FROM",
                                text: this.getI18NText("ENTITY_VEHICLE_BIZ_VALID_FROM") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "OP_CERT_VALID_TO",
                                text: this.getI18NText("ENTITY_VEHICLE_BIZ_VALID_TO") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "MAKER",
                                text: this.getI18NText("ENTITY_VEHICLE_MAKER")
                            },
                            {
                                id: "MODEL",
                                text: this.getI18NText("ENTITY_VEHICLE_MODEL")
                            },
                            {
                                id: "PURCHASE_DATE",
                                text: this.getI18NText("ENTITY_VEHICLE_PURCHASE_DATE") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "REF_DEVICE",
                                text: this.getI18NText("ENTITY_VEHICLE_DEVICE_ID")
                            },
                            {
                                id: "OWNERID",
                                text: this.getI18NText("ENTITY_VEHICLE_OWNER_ID")
                            },
                        ]
                    },
                    {
                        "id": "vehicleRel",
                        "name": this.getI18NText("ENTITY_OWNVEHICLE"),
                        column: [{
                                id: "VIN",
                                text: this.getI18NText("ENTITY_VEHICLE_VIN")
                            },
                            {
                                id: "DRIVERID",
                                text: this.getI18NText("ENTITY_DRIVER_ID")
                            },
                            {
                                id: "ORGANIZATION_CODE",
                                text: this.getI18NText("ENTITY_COMPANY_ORGANIZATION_CODE")
                            }
                        ]
                    },
                    {
                        "id": "gpsRaw",
                        "name": this.getI18NText("ENTITY_GPS_DATA"),
                        column: [{
                                id: "DEVICE_ID",
                                text: this.getI18NText("INSTALL_DEVICE_DEVICE_ID")
                            },
                            {
                                id: "DATE_TIME",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_DATETIME") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "LONGITUDE",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_LON")
                            },
                            {
                                id: "LATITUDE",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_LNG")
                            },
                            {
                                id: "ALTITUDE",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_ALT")
                            },
                            {
                                id: "GPS_SPEED",
                                text: this.getI18NText("ENTITY_SPEED")
                            },
                            {
                                id: "ANGLE",
                                text: this.getI18NText("ENTITY_ANGLE")
                            }
                        ]
                    },
                    {
                        "id": "alertRaw",
                        "name": this.getI18NText("ENTITY_ALERT_DATA"),
                        column: [{
                                id: "ALERT_ID",
                                text: this.getI18NText("ENTITY_ALERT_NO")
                            },
                            {
                                id: "DEVICE_ID",
                                text: this.getI18NText("INSTALL_DEVICE_DEVICE_ID")
                            },
                            {
                                id: "CREATED_ON",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_DATETIME") + this.getI18NText("VALID_DATE_FORMAT")
                            },
                            {
                                id: "LONGITUDE",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_LON")
                            },
                            {
                                id: "LATITUDE",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_LNG")
                            },
                            {
                                id: "ALTITUDE",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_ALT")
                            },
                            {
                                id: "GPS_SPEED",
                                text: this.getI18NText("ENTITY_SPEED")
                            },
                            {
                                id: "ANGLE",
                                text: this.getI18NText("ENTITY_ANGLE")
                            },
                            {
                                id: "ALERT_TYPE",
                                text: this.getI18NText("ENTITY_ALERT_TYPE")
                            },
                            {
                                id: "DESCRIPTION",
                                text: this.getI18NText("ENTITY_DESCRIPTION")
                            },
                            {
                                id: "MEDIA_TYPE",
                                text: this.getI18NText("ENTITY_FORENSIC_FILE_TYPE")
                            },
                            {
                                id: "MEDIA_URL",
                                text: this.getI18NText("ENTITY_FORENSIC_FILE_ADDRESS")
                            },
                            {
                                id: "DEVICE_STATUS",
                                text: this.getI18NText("ENTITY_EQUIPMENT_STATUS")
                            }
                        ]
                    },
                    {
                        "id": "accident",
                        "name": this.getI18NText("ENTITY_VEHICLE_ACCIDENT"),
                        column: [{
                                id: "PLATE_NUMBER",
                                text: this.getI18NText("ENTITY_VEHICLE_PLATE_NUMBER")
                            },
                            {
                                id: "LONGITUDE",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_LON")
                            },
                            {
                                id: "LATITUDE",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_LNG")
                            },
                            {
                                id: "DESCRIPTION",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_DESC")
                            },
                            {
                                id: "CREATED_ON",
                                text: this.getI18NText("ENTITY_VEHICLE_ACCIDENT_DATETIME") + this.getI18NText("VALID_DATE_FORMAT")
                            }
                        ]
                    },
                    {
                        "id": "alertThreshold",
                        "name": this.getI18NText("ENTITY_ALERT_THRESHOLD"),
                        column: [{
                                id: "ALERT_ID",
                                text: this.getI18NText("ENTITY_ALERT_THRESHOLD_TYPE")
                            },
                            {
                                id: "THRESHOLD",
                                text: this.getI18NText("ENTITY_ALERT_THRESHOLD_THRESHOLD")
                            },
                            {
                                id: "CREDIT",
                                text: this.getI18NText("ENTITY_ALERT_THRESHOLD_CREDIT")
                            },
                        ]
                    },
                    {
                        "id": "alertFactor",
                        "name": this.getI18NText("ENTITY_ALERT_FACTOR"),
                        column: [{
                                id: "FEATURE",
                                text: this.getI18NText("ENTITY_ALERT_FACTOR_TYPE")
                            },
                            {
                                id: "VALUE",
                                text: this.getI18NText("ENTITY_ALERT_FACTOR_NAME")
                            },
                            {
                                id: "MIN_VALUE",
                                text: this.getI18NText("ENTITY_ALERT_FACTOR_MIN")
                            },
                            {
                                id: "MAX_VALUE",
                                text: this.getI18NText("ENTITY_ALERT_FACTOR_MAX")
                            },
                            {
                                id: "FACTOR",
                                text: this.getI18NText("ENTITY_ALERT_FACTOR_FACTOR")
                            },
                        ]
                    },
                    {
                        "id": "constant",
                        "name": this.getI18NText("ENTITY_SYSTEM_PARAMETER"),
                        column: [{
                                id: "KEY",
                                text: this.getI18NText("ENTITY_SYSTEM_PARAMETER_NAME")
                            },
                            {
                                id: "VALUE",
                                text: this.getI18NText("ENTITY_SYSTEM_PARAMETER_VALUE")
                            },
                        ]
                    }
                ]
            });
            oModel.setDefaultBindingMode("TwoWay");
            return oModel;
        },
        getSetting: function (key) {
            var settings = this.getModel("settings");
            var settingsData = settings.getData();
            return settingsData[key];
        },
        setSetting: function (key, value) {
            var settings = this.getModel("settings");
            var settingsData = settings.getData();
            settingsData[key] = value;
            this.getModel("settings").setData(settingsData);
        },
        extendUI5Library: function () {
            jQuery.sap.sdrive = jQuery.sap.sdrive || {};
            jQuery.sap.sdrive.includeScript = includeScript;
        },
        loadAMapAPI: function (callbackFunc) {
            var p1, p2, that = this;
            p1 = jQuery.sap.sdrive.includeScript({
                    url: "https://webapi.amap.com/loca?key=9cd3770367c1ad599c19b45b14d07074",
                    id: "Loca"
                },
                function () {},
                function () {
                    console.log("failed");
                }
            );

            p2 = jQuery.sap.sdrive.includeScript({
                    url: "https://webapi.amap.com/maps?v=1.4.10&key=9cd3770367c1ad599c19b45b14d07074&plugin=AMap.PolyEditor",
                    id: "AMap"
                },
                function () {},
                function () {
                    console.log("failed");
                }
            );

            var obj = that.getModel("global").getData();
            Promise.all([p1, p2]).then(function (o) {
                callbackFunc();
                obj.mapApiLoaded = true;
            }).catch(function (e) {
                obj.mapApiLoaded = false;
            });
            that.getModel("global").refresh();
        },
        navToSubApp: function () {
            var thatData = this.getComponentData();
            if (thatData && thatData.startupParameters && thatData.startupParameters.subApp) {
                this.getRouter().navTo(subApp);
            }
        }
    });
}, /* bExport= */ true);