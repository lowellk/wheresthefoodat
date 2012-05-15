/**
 * static utility methods
 */
var util = {
  /**
   * used only for debugging
   */
  dumpLocalStorage: function () {
    _.each($.jStorage.index(), function (key) {
      console.info(key, $.jStorage.get(key));
    })
  },
  /**
   * used only for debugging
   */
  clearLocalStorage: function () {
    $.jStorage.flush();
  }
};
