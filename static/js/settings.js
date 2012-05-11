//TODO: make some functions private

/**
 * @constructor
 */
function SettingsPage() {
  // TODO: externalize?
  this.foursquareClientId = 'AX52AH1M1OSZAQBVN0DBBWNDFSIT44QRHBLHWPTN1ZDPQ30R';
  this.callbackUrl = window.location.href; // this page
  this.settingsAccess = new SettingsAccess();
}


SettingsPage.prototype.authWithFoursquare = function () {
  window.location.href = 'https://foursquare.com/oauth2/authenticate?client_id=' + this.foursquareClientId
    + '&response_type=token&redirect_uri=' + this.callbackUrl;
};


SettingsPage.prototype.parseHash = function () {
  var matches = /(\w+)=(\w+)/.exec(window.location.hash.substring(1));
  if (!matches) {
    return null;
  }
  var ret = {};
  ret[matches[1]] = matches[2];
  return ret;
};


SettingsPage.prototype.init = function () {
  var parsedHash = this.parseHash();
  if (parsedHash) {
    if ('error' in parsedHash) {
      // TODO: chop off the error hash -> redirect to window.location.pathname
      alert('There was an error: ' + parsedHash['error']);
    }
    else if ('access_token' in parsedHash) {
      var accessToken = parsedHash['access_token'];
      this.settingsAccess.setFoursquareToken(accessToken);
      this.settingsAccess.setUseFoursquare(true);
    }
    else {
      console.error('Unknown hash:', parsedHash)
    }
  }
  this.setupUI();
};


// TODO: more elegant approach
SettingsPage.prototype.setupUI = function () {
  var settingsPage = this;
  var settingsAccess = this.settingsAccess;

  $('.js-yelp-checkbox').attr('checked', settingsAccess.getUseYelp());
  $('.js-yelp-checkbox').click(function () {
    settingsAccess.setUseYelp($(this).is(':checked'));
  });

  $('.js-foursquare-checkbox').attr('checked', settingsAccess.getUseFoursquare());
  $('.js-foursquare-checkbox').click(function () {
    if (!settingsAccess.isAuthedWithFoursquare() && $(this).is(':checked')) {
      if (window.confirm('You must login with your Foursquare account to use their data. OK?')) {
        settingsPage.authWithFoursquare();
      }
      return false;
    }
    settingsAccess.setUseFoursquare($(this).is(':checked'));
  });
};

// hide the url bar
setTimeout(function () {
  window.scrollTo(0, 1);
}, 0);

// load scripts then start the app
$LAB
  .script('js/external/jquery.min.js')
  .script('js/external/underscore.js')
  .script('js/external/jstorage.js')
  .script('js/settings-access.js')
  .wait(function () {
    // TODO: global var
    settingsPage = new SettingsPage();
    settingsPage.init();
    settingsPage.printFoursquarePlaces();
  });
