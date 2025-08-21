/*!
 * Hype ScrollTrigger v1.1.0
 * Integrates GSAP ScrollTrigger with Tumult Hype for scroll-based animations and interactions.
 * Copyright (2025) Max Ziebell, (https://maxziebell.de). MIT-license
 */
/*
 * Version-History
 * 1.0.0 Initial release under MIT-license
 * 1.0.1 Fixed pin wrapper nesting issue by checking for existing wrappers before creation
 *       Fixed pin state corruption during rapid scroll direction changes by refreshing trigger state on leave events
 * 1.1.0 Replaced manual RAF smoothing with GSAP timeline proxy system for better performance and smoother animations
 *       Eliminated double timeline execution and timing conflicts between update systems
*/
if ("HypeScrollTrigger" in window === false) window['HypeScrollTrigger'] = (function () {
	const _version = '1.1.0';
	
	// Check for GSAP and ScrollTrigger
	if (!window.gsap || !window.ScrollTrigger) {
		console.error("❌ HypeScrollTrigger: GSAP and ScrollTrigger are required but not available. Please include them before this script.");
		return;
	}
	
	// Register ScrollTrigger plugin
	gsap.registerPlugin(ScrollTrigger);
	
	// Storage for triggers per scene
	const triggers = {};
	const proxyTimelines = new Map();

	/* default options */
	let _default = {
		options: {
			triggerHook: 0.5,
			pin: false,
			reset: true,
			indicatorColor: 'grey',
			// Smooth Scrolling Defaults
			smooth: true,
			smoothDuration: 0.3,
			smoothEase: "power2.out",
		},
		behavior: {
			enter: true,
			leave: true,
		},
		timelineName: 'Main Timeline',
		logBehavior: false,
		addIndicators: false,
		autoProperties: true,
	};

	/**
	 * Create GSAP timeline proxy for smooth Hype timeline control
	 */
	function createTimelineProxy(triggerId, timelineName, api, options = {}) {
		if (proxyTimelines.has(triggerId)) {
			return proxyTimelines.get(triggerId);
		}

		const hypeTimelineDuration = api.durationForTimelineNamed(timelineName);
		if (hypeTimelineDuration === 0 || hypeTimelineDuration === undefined) {
			console.warn("⚠️ Timeline '" + timelineName + "' not found or has zero duration");
			return null;
		}

		// Create virtual GSAP timeline for proxy control
		const proxyTimeline = gsap.timeline({ 
			paused: true
		});

		// Dummy tween that updates Hype timeline on progress
		proxyTimeline.to({}, {
			duration: 1,
			ease: "none",
			onUpdate: function() {
				const progress = proxyTimeline.progress();
				api.goToTimeInTimelineNamed(progress * hypeTimelineDuration, timelineName);
			}
		});

		// Store proxy timeline reference
		proxyTimelines.set(triggerId, {
			proxy: proxyTimeline,
			timelineName: timelineName,
			api: api,
			duration: hypeTimelineDuration,
			smoothEnabled: options.smooth !== false
		});

		return proxyTimelines.get(triggerId);
	}

	/**
	 * Update timeline progress via GSAP proxy
	 */
	function updateTimelineProgress(triggerId, targetProgress, options = {}) {
		const proxyData = proxyTimelines.get(triggerId);
		if (!proxyData) return;

		 // Defensive clamp
		 targetProgress = Math.max(0, Math.min(1, targetProgress));
		 if (!isFinite(targetProgress)) return;

		if (!proxyData.smoothEnabled) {
			// Direct update without smoothing
			proxyData.proxy.progress(targetProgress);
			return;
		}

		// Kill any existing tweens on this proxy timeline
		//gsap.killTweensOf(proxyData.proxy);

		// Use GSAP's built-in smoothing
		gsap.to(proxyData.proxy, {
			progress: targetProgress,
			duration: options.smoothDuration || _default.options.smoothDuration,
			ease: options.smoothEase || _default.options.smoothEase,
			overwrite: 'auto'
		});
	}

	/**
	 * Cleanup proxy timeline
	 */
	function cleanupTimelineProxy(triggerId) {
		const proxyData = proxyTimelines.get(triggerId);
		if (proxyData) {
			gsap.killTweensOf(proxyData.proxy);
			proxyData.proxy.kill();
			proxyTimelines.delete(triggerId);
		}
	}

	/**
	 * Set default options
	 */
	function setDefault(key, value) {
		if (typeof(key) == 'object') {
			_default = key;
			return;
		}
		_default[key] = value;
	}
	
	/**
	 * Get default options
	 */
	function getDefault(key) {
		if (!key) return _default;
		return _default[key];
	}

	/**
	 * Get symbol instance for element
	 */
	function getSymbolInstance(hypeDocument, element) {
		while (element && element !== document) {
			const instance = hypeDocument.getSymbolInstanceById(element.id);
			if (instance) return instance;
			element = element.parentNode;
		}
		return null;
	}

	/**
	 * Convert triggerHook value to GSAP start position
	 */
	function triggerHookToStart(triggerHook, isHorizontal = false) {
		// triggerHook: 0 = top of viewport, 0.5 = center, 1 = bottom
		// GSAP: top, center, bottom for trigger position
		const percentage = triggerHook * 100;
		const viewportPos = `${percentage}%`;
		return viewportPos;
	}

/**
 * Add scroll timeline using GSAP ScrollTrigger
 */
function addScrollTimeline(hypeDocument, element, timelineName, options) {
	try {
		const sceneId = hypeDocument.currentSceneId();
		const hasActionEvents = "HypeActionEvents" in window !== false;
		const scrollName = options.scrollName || timelineName;
		
		// Merge options with defaults
		options = Object.assign({}, _default.options, options);
		
		const sceneElement = document.getElementById(sceneId);
		const isHorizontal = options.horizontal || false;
		const dimension = isHorizontal ? 'width' : 'height';
		
		// Determine the correct scroller
		const scroller = window; // Use window as default scroller
		
		const elementDimension = element.getBoundingClientRect()[dimension];
		const sceneBounds = sceneElement.getBoundingClientRect();
		const elementBounds = element.getBoundingClientRect();
		const cumulativeOffset = isHorizontal ? 
			elementBounds.left - sceneBounds.left : 
			elementBounds.top - sceneBounds.top;
		
		let offset = options.offset !== undefined ? options.offset : cumulativeOffset;
		let duration = options.duration !== undefined ? options.duration : elementDimension;
		let triggerHook = options.triggerHook !== undefined ? options.triggerHook : 0.5;
		
		const symbolInstance = getSymbolInstance(hypeDocument, element);
		const api = symbolInstance ? symbolInstance : hypeDocument;
		
		// --- WRAPPER LOGIC FOR PINNING ---
		let elementToPin = element;
		if (options.pin) {
			// Check if element is already in a pin wrapper
			const existingWrapper = element.closest('.hype-gsap-scroll-pin-wrapper');
			if (existingWrapper) {
				elementToPin = existingWrapper;
			} else {
				// Get element dimensions BEFORE wrapping
				const elementStyles = window.getComputedStyle(element);
				
				const wrapper = document.createElement('div');
				wrapper.classList.add('hype-gsap-scroll-pin-wrapper');
				
				// ONLY copy width and height - let Hype handle positioning
				wrapper.style.width = elementStyles.width;
				wrapper.style.height = elementStyles.height;
				
				element.parentNode.insertBefore(wrapper, element);
				wrapper.appendChild(element);
				elementToPin = wrapper;
			}
		}
		// --- END WRAPPER LOGIC ---
		
		// Parse duration
		if (typeof duration === 'string') {
			if (duration.endsWith('vh')) {
				// Convert viewport height to pixels
				duration = parseFloat(duration) / 100 * window.innerHeight;
			} else if (duration.endsWith('vw')) {
				// Convert viewport width to pixels  
				duration = parseFloat(duration) / 100 * window.innerWidth;
			} else if (duration.endsWith('%')) {
				// Convert percentage of element dimension to pixels
				duration = parseFloat(duration) / 100 * elementDimension;
			} else {
				// Parse as pixel value
				duration = parseFloat(duration);
			}
		}
		
		// Parse offset
		if (typeof offset === 'string') {
			if (offset.endsWith('%')) {
				offset = parseFloat(offset) / 100 * elementDimension + cumulativeOffset;
			} else {
				offset = parseFloat(offset);
			}
		}
		
		// Handle Hype Action Events for dynamic values
		if (hasActionEvents) {
			const scrollCode = options.scrollCode;
			const offsetCode = options.offsetCode || scrollCode;
			const durationCode = options.durationCode || scrollCode;
			const triggerHookCode = options.triggerHookCode || scrollCode;
			const scope = {
				offset: offset,
				duration: duration,
				triggerHook: triggerHook,
			}
			
			if (offsetCode) {
				offset = hypeDocument.triggerAction('return ' + offsetCode, {
					element: element,
					scope: scope,
					event: Object.assign(scope, { type: 'offset' }),
				}) ?? offset;
			}
			if (durationCode) {
				duration = hypeDocument.triggerAction('return ' + durationCode, {
					element: element,
					scope: scope,
					event: Object.assign(scope, { type: 'duration' }),
				}) ?? duration;
			}
			if (triggerHookCode) {
				triggerHook = hypeDocument.triggerAction('return ' + triggerHookCode, {
					element: element,
					scope: scope,
					event: Object.assign(scope, { type: 'triggerHook' }),
				}) ?? triggerHook;
			}
		}
		
		// Store trigger reference for scene management
		const triggerId = element.id;
		
		// Initialize timeline proxy system
		let proxyData = null;
		if (timelineName && api && api.durationForTimelineNamed) {
			// Reset timeline to time 0 first if reset option is true
			if (options.reset) {
				api.pauseTimelineNamed(timelineName);
				api.goToTimeInTimelineNamed(0, timelineName);
			}
			
			// Create GSAP timeline proxy for smooth control
			proxyData = createTimelineProxy(triggerId, timelineName, api, {
				smooth: options.smooth,
				smoothDuration: options.smoothDuration,
				smoothEase: options.smoothEase
			});
		}
		
		// --- EVENT HELPER FUNCTIONS ---
		function triggerBehavior(eventType, event) {
			const eventScrollDirection = event.scrollDirection.charAt(0).toUpperCase() + event.scrollDirection.slice(1).toLowerCase();
			const eventName = scrollName ? scrollName + ' ' : '';
			const behaviorSpecific = eventName + eventType + ' ' + eventScrollDirection;
			const behaviorGeneral = eventName + eventType;
		
			hypeDocument.triggerCustomBehaviorNamed(behaviorSpecific);
			hypeDocument.triggerCustomBehaviorNamed(behaviorGeneral);
	
			if (_default.logBehavior) {
				console.log(behaviorGeneral);
				console.log(behaviorSpecific);
			}
		}
	
		function triggerAction(eventType, event) {
			if (hasActionEvents) {
				const scrollCode = options.scrollCode;
				const code = options[eventType.toLowerCase() + 'Code'] || scrollCode;
				if (code) hypeDocument.triggerAction(code, {
					element: element,
					event: event,
				});
			}
		}
	
		// Create ScrollMagic-compatible event objects
		function createEvent(type, scrollDirection, progress = null) {
			const event = {
				type: type,
				scrollDirection: scrollDirection,
				target: element,
				currentTarget: element
			};
			
			// Add progress for progress events
			if (progress !== null) {
				event.progress = progress;
			}
			
			return event;
		}
		// --- END EVENT HELPER FUNCTIONS ---
		
		// Create ScrollTrigger configuration
		const scrollTriggerConfig = {
			trigger: sceneElement,
			scroller: scroller,
			start: `top+=${offset} ${triggerHookToStart(triggerHook, isHorizontal)}`,
			end: duration === 0 ? `top+=${offset} ${triggerHookToStart(triggerHook, isHorizontal)}` : `top+=${offset + duration} ${triggerHookToStart(triggerHook, isHorizontal)}`,
			
			horizontal: isHorizontal,
			pin: options.pin ? elementToPin : false,
			pinSpacing: false,
			fastScrollEnd: true,
			anticipatePin: 1,
			syncInterval: 16,
			refreshPriority: -1,
			preventOverlaps: true,
			scrub: true,
			invalidateOnRefresh: true,
			
			markers: (_default.addIndicators || options.addIndicators) ? {
				startColor: options.indicatorColor || 'grey',
				endColor: options.indicatorColor || 'grey',
				fontSize: "12px",
				fontWeight: "bold",
				indent: 10
			} : false
		};
		
		// Set up CSS variables if needed
		if (options.hasOwnProperty('properties')) {
			const varName = typeof options.properties === 'string' ? options.properties || 'scroll' : 'scroll';
			const rootElm = varName === 'scroll' ? element : document.getElementById(hypeDocument.documentId());
			rootElm.style.setProperty('--' + varName + '-duration', duration);
			rootElm.style.setProperty('--' + varName + '-offset', offset);
			rootElm.style.setProperty('--' + varName + '-trigger-hook', triggerHook);
			rootElm.style.setProperty('--' + varName + '-progress', 0);
			rootElm.style.setProperty('--' + varName + '-pin', options.pin ? '1' : '0');
			rootElm.style.setProperty('--' + varName + '-start', scrollTriggerConfig.start);
			rootElm.style.setProperty('--' + varName + '-end', scrollTriggerConfig.end);
		}
		
		// Setup callbacks
		scrollTriggerConfig.onUpdate = (self) => {
			const progress = self.progress;
			if (self.oldProgress == progress) return;

			// Update CSS variables
			if (options.hasOwnProperty('properties')) {
				const varName = typeof options.properties === 'string' ? options.properties || 'scroll' : 'scroll';
				const rootElm = varName === 'scroll' ? element : document.getElementById(hypeDocument.documentId());
				rootElm.style.setProperty('--' + varName + '-progress', progress);
			}
			
			// Update timeline via GSAP proxy system
			if (timelineName && proxyData) {
				updateTimelineProgress(triggerId, progress, {
					smoothDuration: options.smoothDuration,
					smoothEase: options.smoothEase
				});
			}
			
			// Trigger action events with ScrollMagic-compatible event object
			if (hasActionEvents) {
				const scrollCode = options.scrollCode;
				const code = options.progressCode || scrollCode;
				if (code) {
					const event = createEvent('progress', self.direction > 0 ? 'FORWARD' : 'REVERSE', progress);
					hypeDocument.triggerAction(code, {
						element: element,
						event: event,
					});
				}
			}
			self.oldProgress = progress;
		};
		
		// Add onRefresh callback to sync timeline on layout changes
		scrollTriggerConfig.onRefresh = (self) => {
			// Update CSS variables
			if (options.hasOwnProperty('properties')) {
				const varName = typeof options.properties === 'string' ? options.properties || 'scroll' : 'scroll';
				const rootElm = varName === 'scroll' ? element : document.getElementById(hypeDocument.documentId());
				rootElm.style.setProperty('--' + varName + '-progress', self.progress);
			}
			
			// Sync timeline to current progress via proxy system (buggy and not needed, will remove soon)
			// if (timelineName && proxyData) {
			//	updateTimelineProgress(triggerId, self.progress, { smoothDuration: 0 });
			//}
		};
		
		// Enter/Leave events with ScrollMagic-compatible event objects
		const shouldTriggerEnter = (scrollName && _default.behavior.enter);
		if (shouldTriggerEnter || options.enterCode) {
			scrollTriggerConfig.onEnter = (self) => {
				const event = createEvent('enter', 'FORWARD');
				
				// Add classes
				if (options.elementClass) {
					element.classList.add(options.elementClass);
				}
				if (options.sceneClass) {
					sceneElement.classList.add(options.sceneClass);
				}
				
				// Trigger behaviors and actions
				if (shouldTriggerEnter) triggerBehavior('Enter', event);
				if (options.enterCode) triggerAction('Enter', event);
			};
	
			scrollTriggerConfig.onEnterBack = (self) => {
				const event = createEvent('enter', 'REVERSE');
				
				// Add classes
				if (options.elementClass) {
					element.classList.add(options.elementClass);
				}
				if (options.sceneClass) {
					sceneElement.classList.add(options.sceneClass);
				}
				
				// Trigger behaviors and actions
				if (shouldTriggerEnter) triggerBehavior('Enter', event);
				if (options.enterCode) triggerAction('Enter', event);
			};
		}
	
		const shouldTriggerLeave = (scrollName && _default.behavior.leave);
		if (shouldTriggerLeave || options.leaveCode) {
			scrollTriggerConfig.onLeave = (self) => {		
				const event = createEvent('leave', 'FORWARD');
				self.refresh();
				// Remove classes
				if (options.elementClass) {
					element.classList.remove(options.elementClass);
				}
				if (options.sceneClass) {
					sceneElement.classList.remove(options.sceneClass);
				}
				
				// Trigger behaviors and actions
				if (shouldTriggerLeave) triggerBehavior('Leave', event);
				if (options.leaveCode) triggerAction('Leave', event);
			};
	
			scrollTriggerConfig.onLeaveBack = (self) => {		
				const event = createEvent('leave', 'REVERSE');

				// Remove classes
				if (options.elementClass) {
					element.classList.remove(options.elementClass);
				}
				if (options.sceneClass) {
					sceneElement.classList.remove(options.sceneClass);
				}
				
				// Trigger behaviors and actions
				if (shouldTriggerLeave) triggerBehavior('Leave', event);
				if (options.leaveCode) triggerAction('Leave', event);
			};
		}
		
		// Create ScrollTrigger
		const trigger = ScrollTrigger.create(scrollTriggerConfig);
		
		// Store trigger for cleanup
		if (!triggers[sceneId]) triggers[sceneId] = [];
		triggers[sceneId].push({ trigger, id: triggerId });
		
		// Initialize timeline proxy with current progress
		if (timelineName && proxyData) {
			const currentProgress = trigger.progress;
			updateTimelineProgress(triggerId, currentProgress, { smoothDuration: 0 });
		}
		
		return trigger;
	
	} catch (error) {
		console.error("❌ Error in addScrollTimeline:", error);
		console.error("Stack trace:", error.stack);
		return null;
	}
}

	/**
	 * Initialize on Hype document load
	 */
	function HypeDocumentLoad(hypeDocument, element, event) {
		// Add method to hypeDocument
		hypeDocument.addScrollTimeline = function (element, timelineName, options) {
			return addScrollTimeline(hypeDocument, element, timelineName, options);
		};
		
		// Configure ScrollTrigger defaults
		
		ScrollTrigger.config({
			limitCallbacks: true,
			syncInterval: 16,
			//autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize"
			
		});
		
	}
	
	/**
	 * Initialize scroll elements on scene load
	 */
	function HypeSceneLoad(hypeDocument, sceneElement) {
		const hasActionEvents = "HypeActionEvents" in window !== false;
		const actionEvents = hasActionEvents ? 
			',[data-scroll-action],[data-scroll-progress-action],[data-scroll-enter-action],[data-scroll-leave-action]' : '';
		
		const selector = '[data-scroll-trigger],[data-scroll-timeline],[data-scroll-pin],[data-scroll-properties],[data-scroll-element-class],[data-scroll-scene-class]' + actionEvents;
		
		const scrollElements = sceneElement.querySelectorAll(selector);
		
		scrollElements.forEach(function (element, index) {
			const timelineNames = element.hasAttribute('data-scroll-timeline') ? 
				(element.getAttribute('data-scroll-timeline') ? 
					element.getAttribute('data-scroll-timeline').split(',').map(name => name.trim()) : 
					[_default.timelineName]) : 
				[null];
			
			const options = {
				pin: element.hasAttribute('data-scroll-pin'),
				offset: element.getAttribute('data-scroll-offset') || undefined,
				duration: element.getAttribute('data-scroll-duration') || undefined,
				triggerHook: element.getAttribute('data-scroll-trigger') ? 
					parseFloat(element.getAttribute('data-scroll-trigger')) : undefined,
				reset: element.getAttribute('data-scroll-reset') === 'false' ? false : true,
				horizontal: element.hasAttribute('data-scroll-horizontal'),
				// Smooth Scrolling Options
				smooth: element.hasAttribute('data-scroll-smooth') ? 
					element.getAttribute('data-scroll-smooth') !== 'false' : undefined,
				smoothDuration: element.getAttribute('data-scroll-smooth-duration') ? 
					parseFloat(element.getAttribute('data-scroll-smooth-duration')) : undefined,
				smoothEase: element.getAttribute('data-scroll-smooth-ease') || undefined,
			};
			
			if (element.hasAttribute('data-scroll-name')) {
				options.scrollName = element.getAttribute('data-scroll-name');
			}
			
			// Handle action events
			if (hasActionEvents) {
				if (element.hasAttribute('data-scroll-action')) 
					options.scrollCode = element.getAttribute('data-scroll-action');
				if (element.hasAttribute('data-scroll-offset-action')) 
					options.offsetCode = element.getAttribute('data-scroll-offset-action');
				if (element.hasAttribute('data-scroll-duration-action')) 
					options.durationCode = element.getAttribute('data-scroll-duration-action');
				if (element.hasAttribute('data-scroll-trigger-action')) 
					options.triggerHookCode = element.getAttribute('data-scroll-trigger-action');
				if (element.hasAttribute('data-scroll-progress-action')) 
					options.progressCode = element.getAttribute('data-scroll-progress-action');
				if (element.hasAttribute('data-scroll-enter-action')) 
					options.enterCode = element.getAttribute('data-scroll-enter-action');
				if (element.hasAttribute('data-scroll-leave-action')) 
					options.leaveCode = element.getAttribute('data-scroll-leave-action');
			}
			
			// Handle classes
			if (element.hasAttribute('data-scroll-element-class')) 
				options.elementClass = element.getAttribute('data-scroll-element-class');
			if (element.hasAttribute('data-scroll-scene-class')) 
				options.sceneClass = element.getAttribute('data-scroll-scene-class');
			
			// Handle properties
			if (element.hasAttribute('data-scroll-properties')) {
				const properties = element.getAttribute('data-scroll-properties');
				if (!(getDefault('autoProperties') && properties == 'false')) {
					options.properties = properties;
				}
			} else if (getDefault('autoProperties')) {
				options.properties = true;
			}
			
			// Handle indicators
			if (element.getAttribute('data-indicator-color')) 
				options.indicatorColor = element.getAttribute('data-indicator-color');
			if (element.hasAttribute('data-indicator-force')) 
				options.addIndicators = true;
			
			// Create scroll timeline for each timeline name
			timelineNames.forEach(timelineName => {
				addScrollTimeline(hypeDocument, element, timelineName, options);
			});
		});
		
		// Refresh ScrollTrigger after scene load
		ScrollTrigger.refresh();
	}
	
	/**
	 * Cleanup on scene unload
	 */
	function HypeSceneUnload(hypeDocument, element) {
		const sceneId = element.id;
		
		// Cleanup proxy timelines
		if (triggers[sceneId]) {
			triggers[sceneId].forEach(({ id }) => {
				cleanupTimelineProxy(id);
			});
		}
		
		// Kill all ScrollTriggers for this scene
		if (triggers[sceneId]) {
			triggers[sceneId].forEach(({ trigger }) => {
				if (trigger) trigger.kill();
			});
			triggers[sceneId] = [];
		}
		
		// Refresh ScrollTrigger
		ScrollTrigger.refresh();
	}
	
	// Register Hype event listeners
	if ("HYPE_eventListeners" in window === false) {
		window.HYPE_eventListeners = Array();
	}
	window.HYPE_eventListeners.push({"type": "HypeDocumentLoad", "callback": HypeDocumentLoad});
	window.HYPE_eventListeners.push({"type": "HypeSceneLoad", "callback": HypeSceneLoad});
	window.HYPE_eventListeners.push({"type": "HypeSceneUnload", "callback": HypeSceneUnload});
	
	// Public API
	return {
		version: _version,
		setDefault: setDefault,
		getDefault: getDefault,
		// Additional utility to manually refresh ScrollTrigger
		refresh: () => {
			ScrollTrigger.refresh();
		},
		// Get all triggers for a scene
		getTriggersForScene: (sceneId) => triggers[sceneId] || [],
		// Debug function to check setup
		debug: () => {
			return {
				gsapVersion: gsap.version,
				scrollTriggerVersion: ScrollTrigger.version,
				triggers: triggers,
				scrollTriggers: ScrollTrigger.getAll(),
				proxyTimelines: proxyTimelines
			};
		}
	};
})();
