/**
 * GAUGE VISUALIZATION - Progress Rings & Hero Fill Card
 * Handles animated ring updates + hero card full-fill animation
 */

class GaugeController {
    constructor(needleId, valueId, progressId, type = 'main') {
        this.gaugeNeedle = document.getElementById(needleId);
        this.gaugeValue = document.getElementById(valueId);
        this.gaugeProgress = document.getElementById(progressId);
        this.type = type;

        this.currentValue = 0;
        this.targetValue = 0;
        this.animationFrame = null;

        // Calculate circumference if it's a ring gauge
        this.circumference = 0;
        if (this.gaugeProgress) {
            const r = parseFloat(this.gaugeProgress.getAttribute('r')) || 54;
            this.circumference = 2 * Math.PI * r;
            this.gaugeProgress.style.strokeDasharray = this.circumference;
            this.gaugeProgress.style.strokeDashoffset = this.circumference;
        }

        // Hero fill elements — only for the main plastic-reduction gauge
        if (this.type === 'main') {
            this.heroFill = document.getElementById('heroProgressFill');
            this.heroBarFill = document.getElementById('heroProgressBarFill');
            this.heroCard = document.getElementById('heroProgressCard');
        }
    }

    updateGauge(percentage) {
        this.targetValue = Math.max(0, Math.min(100, percentage));
        if (!this.animationFrame) {
            this.animateGauge();
        }
    }

    animateGauge() {
        const diff = this.targetValue - this.currentValue;
        const step = diff * 0.1;

        if (Math.abs(diff) < 0.1) {
            this.currentValue = this.targetValue;
            this.renderGauge();
            this.animationFrame = null;
            return;
        }

        this.currentValue += step;
        this.renderGauge();
        this.animationFrame = requestAnimationFrame(() => this.animateGauge());
    }

    renderGauge() {
        const value = this.currentValue;

        // ── Text value ──────────────────────────────────────────────
        if (this.gaugeValue) {
            this.gaugeValue.textContent = Math.round(Math.abs(value));

            if (this.type === 'cost') {
                const signEl = document.getElementById('costValueSign');
                if (signEl) signEl.textContent = value > 0 ? '+' : (value < 0 ? '-' : '');
            }
        }

        // ── Ring gauges (carbon / cost circles) ────────────────────
        if (this.gaugeProgress && this.circumference) {
            const offset = this.circumference * (1 - Math.abs(value) / 100);
            this.gaugeProgress.style.strokeDashoffset = offset;
            this.gaugeProgress.style.stroke = this.getGaugeColor(value);
        }

        // ── Hero progress-fill card (main gauge only) ───────────────
        if (this.type === 'main') {
            // Rising fill layer — more vivid as value grows
            if (this.heroFill) {
                this.heroFill.style.height = `${value}%`;
                // Alpha punches hard even at low values, really visible
                const alpha1 = 0.5 + (value / 100) * 0.45;
                const alpha2 = 0.2 + (value / 100) * 0.35;
                this.heroFill.style.background =
                    `linear-gradient(to top, rgba(78,203,160,${alpha1.toFixed(2)}) 0%, rgba(78,203,160,${alpha2.toFixed(2)}) 55%, rgba(78,203,160,0.05) 100%)`;
            }

            // Bottom accent bar fill
            if (this.heroBarFill) {
                this.heroBarFill.style.width = `${value}%`;
            }

            // Card outer glow grows with value
            if (this.heroCard) {
                const glowStrength = Math.round(value * 0.7);
                const glowAlpha = (value / 100) * 0.5;
                const borderAlpha = 0.1 + (value / 100) * 0.4;
                this.heroCard.style.boxShadow =
                    `0 0 ${glowStrength}px rgba(78,203,160,${glowAlpha.toFixed(2)}), inset 0 0 80px rgba(78,203,160,0.06)`;
                this.heroCard.style.borderColor = `rgba(78,203,160,${borderAlpha.toFixed(2)})`;
            }

            // Number stays white; deepen its ambient glow with value
            if (this.gaugeValue) {
                const ambientGlow = 30 + value * 0.4;
                const glowAlpha = 0.15 + (value / 100) * 0.55;
                const depthAlpha = 0.5 + (value / 100) * 0.35;
                this.gaugeValue.style.textShadow = [
                    `0 1px 0 rgba(255,255,255,0.15)`,
                    `0 -2px 0 rgba(0,0,0,${depthAlpha.toFixed(2)})`,
                    `0 4px 8px rgba(0,0,0,0.6)`,
                    `0 8px 24px rgba(0,0,0,0.4)`,
                    `0 0 ${ambientGlow.toFixed(0)}px rgba(78,203,160,${glowAlpha.toFixed(2)})`
                ].join(', ');
            }
        }

        // ── Cost Impact embedded block coloring ─────────────────────
        if (this.type === 'cost') {
            const container = document.getElementById('costCellContainer');
            if (container) {
                if (value > 0) {
                    container.style.background = 'rgba(78, 203, 160, 0.6)';
                } else if (value < 0) {
                    container.style.background = 'rgba(239, 68, 68, 0.6)';
                } else {
                    container.style.background = 'rgba(158, 155, 148, 0.4)';
                }
            }
        }
    }

    getGaugeColor(value) {
        if (this.type === 'cost') return '#B45309';
        if (this.type === 'carbon') return '#1D4ED8';
        return '#00875A';
    }

    initialize(value = 0) {
        this.currentValue = value;
        this.targetValue = value;
        this.renderGauge();
    }
}

// ── Global gauge controllers ────────────────────────────────────────
const mainGaugeController = new GaugeController('gaugeNeedle', 'mainGaugeValue', 'gaugeProgress', 'main');
const costGaugeController = new GaugeController('costNeedle', 'costValue', 'costProgress', 'cost');
const carbonGaugeController = new GaugeController('carbonNeedle', 'carbonValue', 'carbonProgress', 'carbon');

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    mainGaugeController.initialize(0);
    costGaugeController.initialize(0);
    carbonGaugeController.initialize(0);
});
