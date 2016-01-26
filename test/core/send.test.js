/*global require, describe, it, after, sinon, before */

const assert = require('assert');
const Send = require('../../src/javascript/core/send');
const Queue = require("../../src/javascript/core/queue");
const request = {
	id: '1.199.83760034665465.1432907605043.-56cf00f',
	meta: {
		page_id: 'page_id',
		type: 'event'
	},
	user: {
		spoor_session: 'MS4zMTMuNTYxODY1NTk0MjM4MDQuMTQzMjkwNzYwNTAzNi4tNTZjZjAwZg==',
		spoor_id: 'value3'
	},
	device: {
		user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.9.8 Safari/534.34'
	},
	async: true,
	data: {
		category: 'video',
		action: 'seek',
		key: 'pos',
		value: '10',
		parent_id: '1.990.74606760405.1432907605040.-56cf00f'
	}
};

const setup = require('../setup');
const settings = require('../../src/javascript/core/settings');

// PhantomJS doesn't always create a "fresh" environment...

describe('Core.Send', function () {

	after(function () {
		(new Queue('requests')).replace([]);
		settings.destroy('config');  // Empty settings.
	});

	it('should init first', function () {
		assert.doesNotThrow(function () {
			Send.init();
		});
	});

	it('should add a request', function () {
		assert.doesNotThrow(function () {
			Send.add(request);
		});
	});


	describe('fallback transports', function () {
		before(function () {
			setup.unmockTransport();
		});

		after(function () {
			setup.mockTransport();
		});

		it('use xhr by default', function (done) {
			Send.init();
			navigator.sendBeacon = navigator.sendBeacon || true;
			const xhr = window.XMLHttpRequest;
			const dummyXHR = {
				withCredentials: false,
				open: sinon.stub(),
				setRequestHeader: sinon.stub(),
				send: sinon.stub()
			};
			window.XMLHttpRequest = function () {
				return dummyXHR;
			}
			Send.addAndRun(request);
			setTimeout(() => {
				assert.equal(typeof dummyXHR.onerror, 'function');
				assert.equal(typeof dummyXHR.onload, 'function');
				// assert.equal(dummyXHR.onerror.length, 1) // it will get passed the error
				// assert.equal(dummyXHR.onload.length, 0) // it will not get passed an error
				assert.ok(dummyXHR.withCredentials);
				assert.ok(dummyXHR.open.calledWith("POST", "http://test.spoor-api.ft.com", true));
				assert.ok(dummyXHR.setRequestHeader.calledWith('Content-type', 'application/json'));
				assert.ok(dummyXHR.send.calledOnce);
				window.XMLHttpRequest = xhr;
				if (typeof navigator.sendBeacon === 'boolean') {
					delete navigator.sendBeacon;
				}
				done();
			}, 100)
		});

		if (navigator.sendBeacon) {
			it('use sendBeacon when configured', function (done) {
				settings.set('useSendBeacon', true);
				sinon.stub(navigator, 'sendBeacon');
				Send.init();
				Send.addAndRun(request);
				setTimeout(() => {
					assert.ok(navigator.sendBeacon.called);
					navigator.sendBeacon.restore();
					settings.destroy('useSendBeacon');
					done();
				}, 100)
			});
		}


		it('fallback to xhr when sendBeacon not supported', function (done) {
			settings.set('useSendBeacon', true);
			Send.init();
			const b = navigator.sendBeacon;
			navigator.sendBeacon = null;
			const xhr = window.XMLHttpRequest;
			const dummyXHR = {
				withCredentials: false,
				open: sinon.stub(),
				setRequestHeader: sinon.stub(),
				send: sinon.stub()
			};
			window.XMLHttpRequest = function () {
				return dummyXHR;
			}
			Send.addAndRun(request);
			setTimeout(() => {
				assert.equal(typeof dummyXHR.onerror, 'function');
				assert.equal(typeof dummyXHR.onload, 'function');
				// assert.equal(dummyXHR.onerror.length, 1) // it will get passed the error
				// assert.equal(dummyXHR.onload.length, 0) // it will not get passed an error
				assert.ok(dummyXHR.withCredentials);
				assert.ok(dummyXHR.open.calledWith("POST", "http://test.spoor-api.ft.com", true));
				assert.ok(dummyXHR.setRequestHeader.calledWith('Content-type', 'application/json'));
				assert.ok(dummyXHR.send.calledOnce);
				window.XMLHttpRequest = xhr;
				navigator.sendBeacon = b;
				settings.destroy('useSendBeacon');
				done();
			}, 100)
		});

		it('fallback to image when xhr withCredentials and sendBeacon not supported', function (done) {
			Send.init();
			const b = navigator.sendBeacon;
			navigator.sendBeacon = null;
			const xhr = window.XMLHttpRequest;
			window.XMLHttpRequest = function () {
				return {};
			}
			const dummyImage = {
				addEventListener: sinon.stub()
			};
			const i = window.Image;
			window.Image = sinon.stub().returns(dummyImage);
			Send.addAndRun(request);
			setTimeout(() => {
				assert.ok(dummyImage.src, 'http://test.spoor-api.ft.com?data=%7B%22system%22%…1.990.74606760405.1432907605040.-56cf00f%22%7D%7D');
				assert.equal(dummyImage.addEventListener.args[0][0], 'error');
				assert.equal(dummyImage.addEventListener.args[0][1].length, 1);// it will get passed the error
				assert.equal(dummyImage.addEventListener.args[1][0], 'load');
				assert.equal(dummyImage.addEventListener.args[1][1].length, 0);// it will get passed the error
				window.XMLHttpRequest = xhr;
				window.Image = i;
				navigator.sendBeacon = b;
				done();
			}, 100)
		});

		it('fallback to image with attachEvent() when user is living in the past', function (done) {
			Send.init();
			const b = navigator.sendBeacon;
			navigator.sendBeacon = null;
			const xhr = window.XMLHttpRequest;
			window.XMLHttpRequest = function () {
				return {};
			}
			const dummyImage = {
				attachEvent: sinon.stub()
			};
			const i = window.Image;
			window.Image = sinon.stub().returns(dummyImage);
			Send.addAndRun(request);
			setTimeout(() => {
				assert.ok(dummyImage.src, 'http://test.spoor-api.ft.com?data=%7B%22system%22%…1.990.74606760405.1432907605040.-56cf00f%22%7D%7D');
				assert.equal(dummyImage.attachEvent.args[0][0], 'onerror');
				assert.equal(dummyImage.attachEvent.args[0][1].length, 1);// it will get passed the error
				assert.equal(dummyImage.attachEvent.args[1][0], 'onload');
				assert.equal(dummyImage.attachEvent.args[1][1].length, 0);// it will get passed the error
				window.XMLHttpRequest = xhr;
				window.Image = i;
				navigator.sendBeacon = b;
				done();
			}, 100)
		});

		it('should remember offline lag if a request fails.', function () {

			const server = sinon.fakeServer.create(); // Catch AJAX requests

			(new Queue('requests')).replace([]);
			Send.init();
			const b = navigator.sendBeacon;
			navigator.sendBeacon = null;

			server.respondWith([500, { "Content-Type": "plain/text", "Content-Length": 5 }, "NOT OK"]);

			Send.addAndRun(request);
			server.respond();

			assert.ok(new Queue('requests').last().queueTime);
			navigator.sendBeacon = b;
			server.restore();
		});
	})


});
