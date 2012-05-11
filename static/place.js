/**
 * @constructor
 */
function Place(latitude, longitude, attributes) {
  this.latitude = latitude;
  this.longitude = longitude;
  this.attributes = attributes;
}

/**
 * Create a Place for a business returned by Yelp's API
 */
Place.forYelpBusiness = function(business) {
  var prettyCategories = _.map(business.categories,
    function (category) {
      return category[0];
    }).join(', ');

  var address = business.location.address && business.location.address[0];

  var attributes = _.extend(_.pick(business, [
    'name',
    'review_count',
    'rating_img_url',
    'image_url',
    'mobile_url'
  ]), {
    pretty_categories: prettyCategories,
    pretty_location: address
  });

  return new Place(business.location.coordinate.latitude, business.location.coordinate.longitude, attributes);
};

Place.prototype.getTemplateData = function (currentLocation) {
  return _.extend({}, this.attributes, {
    distance: this.getDistance(currentLocation),
    directions_url: this.urlForDirections(currentLocation),
    map_url: this.urlForMap()
  });
};

Place.MAP_WIDTH = 220;

Place.MAP_HEIGHT = 100;

Place.MAP_ZOOM = 14;

/**
 * Get url for static map for lat/long
 */
Place.prototype.urlForMap = function () {
  var latLng = [this.latitude, this.longitude].join(',');
  var template = 'http://maps.googleapis.com/maps/api/staticmap?center={latLng}' +
    '&zoom={zoom}&size={width}x{height}&sensor=false&markers=color:red%7C{latLng}';
  // yes, I know it's inefficient ;-)
  return template.
    replace(/{latLng}/g, latLng).
    replace(/{width}/g, Place.MAP_WIDTH).
    replace(/{height}/g, Place.MAP_HEIGHT).
    replace(/{zoom}/g, Place.MAP_ZOOM);
};


/**
 * Get the url for google directions from current location to place
 */
Place.prototype.urlForDirections = function (start) {
  var template = "http://maps.google.com/?saddr={start_lat},{start_lng}&daddr={end_lat},{end_lng}";
  return template.replace('{start_lat}', start.latitude)
    .replace('{start_lng}', start.longitude)
    .replace('{end_lat}', this.latitude)
    .replace('{end_lng}', this.longitude)
};


/**
 * Convert from degrees to radians
 */
Place.prototype.toRad = function (angle) {
  return angle * Math.PI / 180;
};


/**
 * http://www.movable-type.co.uk/scripts/latlong.html
 */
Place.prototype.getDistance = function(here) {
  var R = 6371; // km
  var dLat = this.toRad(this.latitude - here.latitude);
  var dLon = this.toRad(this.longitude - here.longitude);
  var lat1 = this.toRad(here.latitude);
  var lat2 = this.toRad(this.latitude);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
};
