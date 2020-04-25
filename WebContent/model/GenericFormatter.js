sap.ui.define([
    'sap/ui/core/format/DateFormat'
], function (DateFormat) {
    "use strict";

    return {
        formatDateTime: function(val){
            if(!val){
                return;
            }
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var sPattern = oResourceBundle.getText("DATETIME_PATTERN");
            // var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
            // console.log(sCurrentLocale);
            var formatter = DateFormat.getInstance({
                pattern: sPattern
            });
            return formatter.format(val);
        },

        formatDurationTime: function(val){
            if(!val){
                return;
            }
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var sPattern = oResourceBundle.getText("TIME_PATTERN");
            // var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
            // console.log(sCurrentLocale);
            var formatter = DateFormat.getInstance({
                pattern: sPattern
            });
            return formatter.format(val);
        }, 

        formatDistance: function(val){
            if(!val){
                return 0
            }
            return parseInt(val, 10)/1000
        }
    };

});