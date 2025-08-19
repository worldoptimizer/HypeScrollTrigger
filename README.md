# Hype ScrollTrigger

![Hype-ScrollTrigger](https://playground.maxziebell.de/Hype/ScrollTrigger/HypeScrollTrigger.jpg?)

A modern scroll-based animation library that integrates **GSAP ScrollTrigger** with **Tumult Hype** for high-performance scroll interactions and timeline control.

> Designed specifically for Tumult Hype users! This plugin works with Hype's visual Inspector interface - no hand-coding HTML required.

## Overview

`HypeScrollTrigger` is a JavaScript extension designed for integration with [Tumult Hype](https://tumult.com/hype/), enabling developers and designers to create interactive, scroll-based animations and interactions within their Hype projects. Leveraging the power of GSAP ScrollTrigger, this extension makes it easy to trigger animations as users scroll through a webpage, enhancing the storytelling and user engagement of Hype animations.

Incorporating `HypeScrollTrigger` into your Tumult Hype projects unlocks a new realm of interactive storytelling and user engagement through scroll-driven animations. By utilizing this powerful extension, you can create immersive web experiences that captivate your audience.

## Features

- **Modern Performance**: Built on GSAP ScrollTrigger for superior performance compared to ScrollMagic
- **Smooth Timeline Animation**: Built-in smooth interpolation for silky timeline transitions (enabled by default)
- **Tumult Hype Integration**: Seamless integration with Hype documents and timelines
- **Element Pinning**: Pin elements during scroll with automatic wrapper creation
- **CSS Custom Properties**: Automatic CSS variable updates for scroll progress
- **Data Attribute Configuration**: Easy setup using HTML data attributes via Hype's Identity Inspector
- **Event System**: Comprehensive enter/leave/progress event handling
- **Debug Tools**: Built-in debugging utilities for development
- **Horizontal Scrolling**: Support for horizontal scroll animations
- **Scene Management**: Automatic cleanup and refresh handling
- **Symbol Support**: Works with both Hype main timelines and symbol timelines
- **Integration with Hype Action Events**: When using `HypeActionEvents`, you can easily call functions by using data action attributes to bind scroll progress or events to actions

## Installation

### Requirements

- [GSAP](https://greensock.com/) (3.0+)
- [GSAP ScrollTrigger](https://greensock.com/scrolltrigger/)
- [Tumult Hype](https://tumult.com/hype/) (4.0+)

### Quick Installation (via CDN)

For a quick start, incorporate GSAP ScrollTrigger and HypeScrollTrigger directly into your project by adding the following scripts to the Head section of your Hype document:

**CDN Version**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/worldoptimizer/HypeScrollTrigger/HypeScrollTrigger.min.js"></script>
```

### Setup in production

Download all dependencies and Hype Scroll Trigger, then combine them into a single script file. Include this file in your resources and link to head HTML.

## Understanding Hype's Inspector System

HypeScrollTrigger is designed to work seamlessly with **Tumult Hype's visual interface**. Instead of editing raw HTML, you configure scroll animations using Hype's **Identity Inspector**.

### Setting Data Attributes in Hype:

1. **Select any element** in your Hype scene (rectangle, group, symbol, etc.)
2. **Open Identity Inspector**: 
   - Menu: `View` → `Inspectors` → `Identity`  
   - Or use the Inspector panel if already visible
3. **Locate "Additional HTML Attributes"** section (below Class Name field)
4. **Click the `+` button** to add new attribute pairs
5. **Enter Key and Value**:
   - **Key**: `data-scroll-timeline` 
   - **Value**: `Main Timeline`
6. **Repeat** for additional attributes like `data-scroll-duration`, etc.

### Attribute Key Format:
- Always start with `data-` prefix
- Use kebab-case: `data-scroll-timeline` (not `dataScrollTimeline`)  
- Leave values empty for some boolean attributes like `data-scroll-pin` as the attribute itself is the switch

## Usage

`HypeScrollTrigger` enhances Hype documents by allowing scroll position to control timeline animations. After including the script, scroll animations can be configured programmatically or through data attributes.

### Basic Usage
The extension looks for elements with the `data-scroll-timeline` attribute within each scene to automatically create scroll-driven animations. No manual initialization is needed for basic usage.

## Data Attributes

`HypeScrollTrigger` utilizes `data-attributes` in HTML elements to define and control scroll-driven animations. These attributes allow for a declarative approach to configuring animations, making it easy to integrate and manage animations directly through Hype's Identity Inspector.

### Main Data-Attributes

- **`data-scroll-timeline`**: Links an HTML element to a specific Hype timeline or timelines. Specify one or multiple timeline names separated by commas to trigger upon scrolling. While `data-scroll-offset` and `data-scroll-duration` are essential attributes for defining the start point and length of the scroll animation respectively, if they are not explicitly declared, `HypeScrollTrigger` will assume these values based on the element's bounding box dimensions.

### Basic Data Attributes

| Attribute | Type | Example Value | Description |
|-----------|------|---------------|-------------|
| `data-scroll-timeline` | string | `Main Timeline` | Timeline name(s) to control (comma-separated for multiple) |
| `data-scroll-pin` | boolean | *(leave empty)* | Pins the element in place for the duration of the scroll animation |
| `data-scroll-offset` | number/string | `100` or `50%` | Start point of scroll animation in pixels or percentage of element dimension |
| `data-scroll-duration` | number/string | `200` or `100vh` or `50%` | Duration over which scroll animation runs |
| `data-scroll-trigger` | number | `0.5` | Viewport position to start animation (0=top, 0.5=center, 1=bottom) |
| `data-scroll-reset` | boolean | `false` | If set to `false`, prevents timeline from resetting when scrolled back |
| `data-scroll-horizontal` | boolean | *(leave empty)* | Changes scroll direction from vertical to horizontal |
| `data-scroll-name` | string | `MyScrollArea` | Custom name for behavior events and debugging |

### Offset Examples

| Attribute Usage | Example Value | Description |
|----------------|---------------|-------------|
| Percentage of element | `50%` | Adds half of the element's height to the start point |
| Absolute pixels | `100` | Starts the animation 100 pixels down from the top |

### Duration Examples

| Attribute Usage | Example Value | Description |
|----------------|---------------|-------------|
| Viewport height | `100vh` | Duration equals the full height of the viewport |
| Percentage of element | `50%` | Animation lasts for half of the element's dimension |
| Absolute pixels | `500` | Specifies the animation duration as 500 pixels |

### Smooth Animation Attributes

| Attribute | Type | Default | Example Value | Description |
|-----------|------|---------|---------------|-------------|
| `data-scroll-smooth` | boolean | `true` | `false` | Enables/disables smooth timeline interpolation |
| `data-scroll-smooth-factor` | number | `0.15` | `0.1` | Smooth animation factor (0-1, lower = smoother) |

### CSS Properties Attribute

- **`data-scroll-properties`**: This attribute dynamically links CSS variables to scroll activity, enabling styled effects based on scroll position. It specifies the names of the CSS variables that should be updated within the scope of the Hype document according to scroll progress, duration, and offset.

| Property Value | CSS Variables Created | Description |
|----------------|----------------------|-------------|
| `test` | `--test-progress`, `--test-duration`, `--test-offset`, `--test-trigger-hook` | Custom named variables |
| *(empty)* | `--scroll-progress`, `--scroll-duration`, `--scroll-offset`, `--scroll-trigger-hook` | Default variable names |

#### CSS Properties Example:

**Setup in Hype Inspector:**
```
Key: data-scroll-properties
Value: letterbox
```

**CSS Usage:**
```css
.dynamic-letter-spacing {
  letter-spacing: calc(var(--letterbox-progress) * 5px) !important;
}
```

### Dynamic CSS Class Management

| Attribute | Example Value | Description |
|-----------|---------------|-------------|
| `data-scroll-element-class` | `active-element` | CSS class applied to element when entering scroll timeline |
| `data-scroll-scene-class` | `active-scene` | CSS class applied to entire Hype scene when visible in scroll timeline |

### Indicator-Dependent Data Attributes (Development/Debugging)

| Attribute | Example Value | Description |
|-----------|---------------|-------------|
| `data-indicator-color` | `red` | Customizes color of scroll animation indicators |
| `data-indicator-force` | *(leave empty)* | Forces display of scroll animation indicators |

### Action-Dependent Data Attributes (Requires Hype Action Events)

#### Initialization Actions

| Attribute | Description |
|-----------|-------------|
| `data-scroll-offset-action` | Custom logic to dynamically calculate initial offset |
| `data-scroll-duration-action` | Custom script to calculate scroll effect duration |
| `data-scroll-trigger-action` | Script to dynamically determine triggerHook value |

#### Animation Actions

| Attribute | Description |
|-----------|-------------|
| `data-scroll-progress-action` | Action triggered as scroll animation progresses |
| `data-scroll-enter-action` | Script executed when scroll enters trigger area |
| `data-scroll-leave-action` | Script executed when scroll leaves trigger area |
| `data-scroll-action` | Catch-all action for all events (differentiate by `event.type`) |

## Quick Start Examples

### Basic Timeline Scroll Setup:
1. **Select your element** in the Hype scene
2. **Open Identity Inspector**: `View` → `Inspectors` → `Identity`
3. **Add data attributes** in the "Additional HTML Attributes" section:

| Key | Value |
|-----|-------|
| `data-scroll-timeline` | `Main Timeline` |
| `data-scroll-duration` | `200` |
| `data-scroll-trigger` | `0.5` |

### Pinned Element Setup:
1. **Select your element** to pin during scroll
2. **Identity Inspector** → **Additional HTML Attributes**:

| Key | Value |
|-----|-------|
| `data-scroll-pin` | *(leave empty)* |
| `data-scroll-timeline` | `Main Timeline` |

### Disable Smooth Animation:
1. **Select your element**
2. **Identity Inspector** → **Additional HTML Attributes**:

| Key | Value |
|-----|-------|
| `data-scroll-timeline` | `Main Timeline` |
| `data-scroll-smooth` | `false` |

### CSS Properties Integration:
1. **Select your element**
2. **Identity Inspector** → **Additional HTML Attributes**:

| Key | Value |
|-----|-------|
| `data-scroll-properties` | `scroll` |
| `data-scroll-duration` | `100vh` |

## Behaviors

### Enter and Leave Events

In HypeScrollTrigger, "Enter" and "Leave" events are designed to trigger specific behaviors when scrolling through particular regions on a webpage. The behavior naming convention is based on the timeline name or the scroll name if provided. Triggering is dependent on a name being present in either the timeline or the manually set scroll name.

**Behavior Mechanisms:**

- **Enter**: Activated as the scroll enters a defined region, which can trigger linked animations or actions.
- **Leave**: Triggered when the scroll exits the region, typically used to conclude or reverse animations.

**Examples:**

- General Behavior with Timeline Name (e.g., "Main Timeline"):
  - `Main Timeline Enter`
  - `Main Timeline Leave`
  
- Specific Behavior with Scroll Name (e.g., "MyScrollArea"):
  - `MyScrollArea Enter Forward`
  - `MyScrollArea Enter Reverse`
  - `MyScrollArea Leave Forward`
  - `MyScrollArea Leave Reverse`

The specific naming convention includes the direction of the scroll (`Forward` or `Reverse`) to further refine the behavior based on the scroll movement.

### Custom Behaviors and Event Listening

Custom behaviors are at the heart of `HypeScrollTrigger`, offering a way to extend the interactivity of your Hype projects beyond predefined animations. When a scroll timeline reaches certain milestones, such as the start or end of an animation, `HypeScrollTrigger` can automatically trigger custom behaviors named following a specific convention.

For example, if you have a timeline named "exampleTimeline", the extension can generate custom behaviors like `exampleTimeline Enter Forward` when the scroll enters the timeline boundary moving downwards, or `exampleTimeline Leave Reverse` when scrolling out of the timeline boundary upwards.

## Scope and Event Object in Action Calls

When actions are triggered using Hype Action Events, specific scroll-related properties such as `offset`, `duration`, and `triggerHook` are exposed within the scope of the action. This allows for direct manipulation and calculation within the action scripts. For instance, expressions like `offset + duration / 2` can be used directly in `data-scroll-offset-action` or `data-scroll-duration-action` to compute values dynamically.

In cases where a Hype function is invoked, such as `myOffset()`, Hype automatically populates the function's signature with `hypeDocument`, `element`, and `event`. The scope values (e.g., `duration`, `offset`) are also added to the event object, accessible as `event.duration`, `event.offset`, etc.

## JavaScript API

### Global Configuration

```javascript
// Set default options
HypeScrollTrigger.setDefault({
    options: {
        triggerHook: 0.5,
        smooth: true,
        smoothFactor: 0.15
    },
    behavior: {
        enter: true,
        leave: true
    },
    logBehavior: false,
    addIndicators: false
});

// Get current defaults
const defaults = HypeScrollTrigger.getDefault();
```

### Programmatically Adding Timelines

- **Add a Scroll Timeline**: `hypeDocument.addScrollTimeline(element, timelineName, options)` - Programmatically adds a scroll timeline to the specified element with custom options.

### Advanced Usage Example

```javascript
// Add a scroll timeline to an element with custom options
const myElement = hypeDocument.getElementById('myElement');
const trigger = hypeDocument.addScrollTimeline(myElement, 'exampleTimeline', {
    duration: '50%',
    pin: true,
    smooth: false,
    smoothFactor: 0.1
});
```

### Utility Methods

```javascript
// Refresh all ScrollTriggers
HypeScrollTrigger.refresh();

// Get triggers for a specific scene
const triggers = HypeScrollTrigger.getTriggersForScene('sceneId');

// Debug information
const debugInfo = HypeScrollTrigger.debug();
console.log('GSAP Version:', debugInfo.gsapVersion);
console.log('ScrollTrigger Version:', debugInfo.scrollTriggerVersion);
console.log('Active Triggers:', debugInfo.scrollTriggers);
```

## Advanced Configuration

### Working with Hype Symbols

**Scroll triggers work inside Symbols:**
1. Enter the **Symbol** (double-click)
2. Select elements **within the symbol**
3. Set data attributes on **symbol children** via Identity Inspector
4. Timelines reference the **symbol's internal timelines**

### Working with Flexible Layouts

**For responsive designs:**
- Use **viewport units**: `100vh`, `50vw` for `data-scroll-duration`
- Use **percentage values**: `50%`, `200%` for relative sizing
- ScrollTrigger **automatically recalculates** on window resize
- Use `HypeScrollTrigger.refresh()` after layout changes

### Working with Groups

**Groups can be scroll triggers:**
1. Select the **entire group**
2. Add scroll attributes to the **group element**
3. All children animate together
4. Useful for **complex multi-element** animations

## Debugging

### Enable Visual Indicators

**Globally enable indicators:**
```javascript
// In Head HTML or JavaScript function
HypeScrollTrigger.setDefault('addIndicators', true);
```

**Per element in Hype Inspector:**
1. Select your element
2. **Identity Inspector** → **Additional HTML Attributes**:

| Key | Value |
|-----|-------|
| `data-indicator-force` | *(empty)* |
| `data-indicator-color` | `red` |

### Debug Information

```javascript
const debug = HypeScrollTrigger.debug();
console.log('GSAP Version:', debug.gsapVersion);
console.log('ScrollTrigger Version:', debug.scrollTriggerVersion);
console.log('Active Triggers:', debug.scrollTriggers);
```

## Migration from ScrollMagic

HypeScrollTrigger is designed as a drop-in replacement for HypeScrollMagic:

| ScrollMagic | HypeScrollTrigger |
|-------------|-------------------|
| `data-scroll-magic` | `data-scroll-timeline` |
| Scene controller | Automatic management |
| Manual refresh | Auto-refresh on scene changes |
| Basic interpolation | Smooth timeline option (default enabled) |

## Compatibility
`HypeScrollTrigger` is designed to integrate seamlessly with Tumult Hype and is compatible with most modern web browsers, ensuring a wide audience can experience the scroll-based animations. While future updates may introduce new interfaces or affect backward compatibility, version 1.0.0 should be a straightforward implementation.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [Hype ActionEvents](https://github.com/worldoptimizer/HypeActionEvents) - Enhanced event system for Hype
- [GSAP ScrollTrigger](https://greensock.com/scrolltrigger/) - The underlying animation engine
- [HypeScrollMagic](https://github.com/worldoptimizer/HypeScrollMagic) - Previous ScrollMagic-based version
