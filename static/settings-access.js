/**
 * TODO: rename
 * @constructor
 */
function SettingsAccess() {
}

SettingsAccess.KEY_FOURSQUARE_TOKEN = 'foursquare_access_token';

SettingsAccess.KEY_USE_FOURSQUARE = 'use_foursquare';

SettingsAccess.KEY_USE_YELP = 'use_yelp';

SettingsAccess.prototype.isAuthedWithFoursquare = function () {
  return !!$.jStorage.get(SettingsAccess.KEY_FOURSQUARE_TOKEN);
};

SettingsAccess.prototype.getFoursquareToken = function () {
  return $.jStorage.get(SettingsAccess.KEY_FOURSQUARE_TOKEN);
};

SettingsAccess.prototype.setFoursquareToken = function (value) {
  $.jStorage.set(SettingsAccess.KEY_FOURSQUARE_TOKEN, value);
};

SettingsAccess.prototype.getUseFoursquare = function () {
  return $.jStorage.get(SettingsAccess.KEY_USE_FOURSQUARE, false);
};

SettingsAccess.prototype.getUseYelp = function () {
  return $.jStorage.get(SettingsAccess.KEY_USE_YELP, true);
};

SettingsAccess.prototype.setUseFoursquare = function (b) {
  return $.jStorage.set(SettingsAccess.KEY_USE_FOURSQUARE, b);
};

SettingsAccess.prototype.setUseYelp = function (b) {
  return $.jStorage.set(SettingsAccess.KEY_USE_YELP, b);
};

// TODO: unused?
SettingsAccess.prototype.check = function ($elt, b) {
  $elt.attr('checked', b || '');
};

// TODO: get rid?
SettingsAccess.prototype.dumpLocalStorage = function () {
  _.each($.jStorage.index(), function (key) {
    console.info(key, $.jStorage.get(key));
  })
};


// TODO: get rid?
SettingsAccess.prototype.clearLocalStorage = function () {
  $.jStorage.flush();
};
