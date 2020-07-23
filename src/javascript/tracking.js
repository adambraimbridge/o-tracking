import settings from './core/settings';
import user from './core/user';
import session from './core/session';
import send from './core/send';
import event from './events/custom';
import page from './events/page-view';
import {init as click} from './events/click';
import core from './core';
import { merge, broadcast } from './utils';
import componentView from './events/component-view';

/**
 * @class Tracking
 */
class Tracking {
	constructor() {
		/**
     	* The version of the tracking module.
     	* @type {string}
     	*/
		this.version = '2.0.10';

		/**
     	* The source of this event.
     	* @type {string}
     	*/
		this.source = 'o-tracking';

		/**
     	* The initialised state of the object.
     	* @type {boolean}
     	*/
		this.initialised = false;
	}

	/**
	 * Turn on/off developer mode. (Can also be activated on init.)
	 * @param {boolean} level - Turn on or off, defaults to false if omitted.
	 * @return {void}
	 */
	// eslint-disable-next-line class-methods-use-this
	developer(level) {
		if (level) {
			settings.set('developer', true);
		} else {
			settings.destroy('developer');
			settings.destroy('no_send');
		}
	}

	/**
	 * Clean up the tracking module.
	 * @return {void}
	 */
	destroy() {
		this.developer(false);
		this.initialised = false;

		settings.destroy('config');
		settings.destroy('page_sent');
	}

	/**
	 * Overload toString method to show the version.
	 * @return {string} The module's version.
	 */
	toString() {
		return 'oTracking version ' + this.version;
	}

	/**
	 * Initialises the Tracking object.
	 *
	 * All options are optional, if a configuration option is missing, the module
	 * will try to initialise using any configuration found in the DOM using the
	 * script config tag.
	 *
	 * @example
	 * <!-- DOM configuration settings -->
	 * <script type='application/json' data-o-tracking-config>
	 * page: {
	 * 	 product: 'desktop'
	 * },
	 * user: {
	 *   user_id: '023ur9jfokwenvcklwnfiwhfoi324'
	 * }
	 * </script>
	 *
	 * @param {Object} config 					- See {@link Tracking} for the configuration options.
	 * @param {boolean=} config.developer        - Optional, if `true`, logs certain actions.
	 * @param {boolean=} config.noSend           - Optional, if `true`, won't send events.
	 * @param {string=} config.configId          - Optional
	 * @param {string=} config.session           - Optional
	 * @param {string=} config.cookieDomain      - Optional
	 *
	 * @return {Tracking} - Returns the tracking object
	 */
	init(config = {}) {
		if (this.initialised) {
			return this;
		}

		const hasDeclarativeConfig = Boolean(
			this._getDeclarativeConfigElement()
		);

		if (hasDeclarativeConfig) {
			config = this._getDeclarativeConfig(config);
		}

		// If there's no config, there is no point initialising!
		// http://stackoverflow.com/a/32108184
		if (Object.keys(config).length === 0 && config.constructor === Object) {
			return null;
		}

		settings.set('version', this.version);
		settings.set('source', this.source);

		settings.set('page_sent', false);

		const cookieDomain = config ? config.cookieDomain : '';

		// Set up the user from stored - may later be updated by config
		user.init('', cookieDomain);
		this.updateConfig(config);

		// Session
		session.init(config.session);

		// Initialize the sending queue.
		send.init();

		this.event.init();
		this.page.init();
		this.initialised = true;
		return this;
	}

	/**
	 * Update the tracking configuration with any state changes. The supplied
	 * config is merged with any existing config; to unset a value, set it as
	 * null or undefined.
	 *
	 * @param {Object} newConfig The configuration object to merge in - see init()
	 * @return {void}
	 */
	updateConfig(newConfig) {
		let config = settings.get('config') || {};

		config = merge(config, newConfig);
		settings.set('config', config);

		// Developer mode
		if (config.developer) {
			this.developer(config.developer);

			if (config.noSend) {
				settings.set('no_send', true);
			}
		}

		if (config.user && config.user.user_id) {
			user.setUser(config.user.user_id);
		}
	}

	/**
	 * Retrieves the <script type='application/json' data-o-tracking-config> element that is in the DOM, otherwise returns null.
	 * @private
	 * @return {HTMLElement|null} - Returns the <script> element if found otherwise returns null.
	 */
	// eslint-disable-next-line class-methods-use-this
	_getDeclarativeConfigElement() {
		return document.querySelector('script[data-o-tracking-config]');
	}

	/**
	 * Initialises additional data using the <script type='application/json' data-o-tracking-config> element in the DOM.
	 * @private
	 * @param {Object} options - A partially, or fully filled options object.  If
	 *                           an option is missing, this method will attempt to
	 *                           initialise it from the DOM.
	 * @return {Object} - The options modified to include the options gathered from the DOM
	 */
	_getDeclarativeConfig(options) {
		const configEl = this._getDeclarativeConfigElement();
		let declarativeConfigString;
		if (configEl) {
			declarativeConfigString = configEl.textContent || configEl.innerText || configEl.innerHTML;
		} else {
			return false;
		}

		let declarativeOptions;

		try {
			declarativeOptions = JSON.parse(declarativeConfigString);
		} catch(e) {
			const configError = new Error('Invalid JSON configuration syntax, check validity for o-tracking configuration: "' + e.message + '"');
			broadcast('oErrors', 'log', {
				error: configError.message,
				info: { module: 'o-tracking' }
			});
			throw configError;
		}

		for (const property in declarativeOptions) {
			if (Object.prototype.hasOwnProperty.call(declarativeOptions, property)) {
				options[property] = options[property] || declarativeOptions[property];
			}
		}

		return options;
	}


	/**
	 * Listen for click events.
	 *
	 * @param {String} category - The event category for clicks.
	 * @param {String} elementsToTrack - A CSS selector string to select elements to track clicks on.
	 * @return {void}
	 */
	// eslint-disable-next-line class-methods-use-this
	click(category, elementsToTrack) {
		click(category, elementsToTrack);
	}
}
/**
 * Track a custom event.
 * @see {@link event}
 */
Tracking.prototype.event = event;

/**
 * Make the page tracking request.
 * @see {@link page}
 */
Tracking.prototype.page = page;

/**
 * To initalise view events for components/elements.
 * @see {@link view#init}
 */
Tracking.prototype.view = componentView;

/**
 * Get the rootID.
 * @see {@link core#getRootID}
 */
Tracking.prototype.getRootID = core.getRootID;

export { Tracking };
