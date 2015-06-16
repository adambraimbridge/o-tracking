/*global module, require, window */
"use strict";

var Core = require("./core");
var utils = require("./utils");

/**
 * Default properties for events.
 *
 * @type {Object}
 */
var defaultEventConfig = function () {
	return {
		tag: { type: 'event' },
		data: {}
	};
};

/**
 * Track an event.
 *
 * @param obj The event, for example: {
 *   [parent_id] The ID from a parent event if one exists.
 *   [category] The category, for example: video
 *   [action] The action performed, for example: play
 *   [key] Optional, a key for naming an arbitrary value. Examples include the video play amount - 50%, or slideshow slide number.
 *   [value] Optional, the value. Examples include the video play amount - 50%, or slideshow slide number.
 *   [data] Optional, other data related to the event.
 * }
 *
 * @param {Function} callback - Optional, Callback function. Called when request completed.
 */
function event(obj, callback) {
	if (utils.is(obj.category) || utils.is(obj.action)) {
		throw 'Missing category or action values';
	}

	var config = utils.merge(defaultEventConfig(), {
		data: obj
	});

	if (!utils.is(config.data.id)) {
		config.id = config.data.id;
		delete config.data.id;
	}

	Core.track(config, callback);
}

/**
 * Listener for custom events.
 *
 * @param CustomEvent The CustomEvent
 * @private
 */
function listener(e) {
	event(e.detail);
}
utils.addEvent(window, 'oTracking.event', listener);

module.exports = event;
