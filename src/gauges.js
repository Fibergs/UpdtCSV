/**
 * GAUGE VISUALIZATION - Progress Rings
 * Handles animated ring updates with smooth stroke-dashoffset transitions
 * Adapted from needle-based gauges to concentric ring design
 */

class GaugeController {
    constructor(needleId, valueId, progressId, type = 'main') {
        // needleId kept for backward compat — repurposed as ring container
        this.gaugeNeedle = document.getElementById(needleId);
        this.gaugeValue = document.getElementById(valueId);
        this.gaugeProgress = document.getElementById(progressId);
        this.type = type;

        // Current gauge value for animation
        this.currentValue = 0;
        this.targetValue = 0;

        // Animation frame ID
        this.animationFrame = null;

        // Calculate circumference based on element's r attribute if available
        this.circumference = 0;
        if (this.gaugeProgress) {
            const r = parseFloat(this.gaugeProgress.getAttribute('r')) || 54;
            this.circumference = 2 * Math.PI * r;
            // Initialize with full offset (empty ring)
            this.gaugeProgress.style.strokeDasharray = this.circumference;
            this.gaugeProgress.style.strokeDashoffset = this.circumference;
        }
    }

    /**
     * Update the gauge
     * @param {number} percentage - Value from 0-100
     */
    updateGauge(percentage) {
        this.targetValue = Math.max(0, Math.min(100, percentage));

        // Start animation if not already running
        if (!this.animationFrame) {
            this.animateGauge();
        }
    }

    /**
     * Animate gauge to target value with easing
     */
    animateGauge() {
        const diff = this.targetValue - this.currentValue;
        const step = diff * 0.1; // Easing factor

        if (Math.abs(diff) < 0.1) {
            // Close enough, snap to target
            this.currentValue = this.targetValue;
            this.renderGauge();
            this.animationFrame = null;
            return;
        }

        this.currentValue += step;
        this.renderGauge();

        this.animationFrame = requestAnimationFrame(() => this.animateGauge());
    }

    /**
     * Render gauge at current value — uses stroke-dashoffset on a <circle>
     */
    renderGauge() {
        const value = this.currentValue;

        // Update displayed number
        if (this.gaugeValue) {
            this.gaugeValue.textContent = Math.round(value);
        }

        // Update ring fill via stroke-dashoffset
        if (this.gaugeProgress && this.circumference) {
            const offset = this.circumference * (1 - value / 100);
            this.gaugeProgress.style.strokeDashoffset = offset;

            // Update color based on value and type
            const color = this.getGaugeColor(value);
            this.gaugeProgress.style.stroke = color;
        }

        // Update needle element (repurposed — can be used for glow effects)
        if (this.gaugeNeedle) {
            // No rotation needed for rings; keep element for potential glow/label use
        }
    }

    /**
     * Get gauge color based on value
     */
    getGaugeColor(value) {
        if (this.type === 'cost') {
            return '#B45309'; // Cost Impact uses Amber
        }
        if (this.type === 'carbon') {
            return '#1D4ED8'; // Carbon Avoided uses Blue-Slate
        }

        // Main gauge — deep forest green
        return '#00875A';
    }

    /**
     * Initialize gauge to starting position
     */
    initialize(value = 0) {
        this.currentValue = value;
        this.targetValue = value;
        this.renderGauge();
    }
}

// Create global gauge controllers
// IDs preserved from legacy: gaugeNeedle, mainGaugeValue, gaugeProgress, etc.
const mainGaugeController = new GaugeController('gaugeNeedle', 'mainGaugeValue', 'gaugeProgress', 'main');
const costGaugeController = new GaugeController('costNeedle', 'costValue', 'costProgress', 'cost');
const carbonGaugeController = new GaugeController('carbonNeedle', 'carbonValue', 'carbonProgress', 'carbon');

// Initialize gauges on page load
document.addEventListener('DOMContentLoaded', () => {
    mainGaugeController.initialize(51); // Start at default value
    costGaugeController.initialize(0);
    carbonGaugeController.initialize(0);
});
