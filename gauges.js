/**
 * GAUGE VISUALIZATION - Progress Rings & Hero Category Columns
 * Handles animated ring updates + hero category columns animation
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

        // Hero card reference — only for the main plastic-reduction gauge
        if (this.type === 'main') {
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
        }

        // ── Ring gauges (carbon / cost circles) ────────────────────
        if (this.gaugeProgress && this.circumference) {
            const offset = this.circumference * (1 - Math.abs(value) / 100);
            this.gaugeProgress.style.strokeDashoffset = offset;
            this.gaugeProgress.style.stroke = this.getGaugeColor();
        }

        // ── Hero category columns (main gauge only) ─────────────────
        if (this.type === 'main') {
            updateHeroColumns(value);

            // Card outer glow grows with value
            if (this.heroCard) {
                const glowStrength = Math.round(value * 0.7);
                const glowAlpha = (value / 100) * 0.5;
                const borderAlpha = 0.1 + (value / 100) * 0.4;
                this.heroCard.style.boxShadow =
                    `0 0 ${glowStrength}px rgba(78,203,160,${glowAlpha.toFixed(2)}), inset 0 0 80px rgba(78,203,160,0.06)`;
                this.heroCard.style.borderColor = `rgba(78,203,160,${borderAlpha.toFixed(2)})`;
            }

            // Update aria-label
            if (this.heroCard) {
                this.heroCard.setAttribute('aria-label', `Plastic reduction forecast: ${Math.round(value)}% eliminated`);
            }
        }

        // ── Cost cell: direction label + subtle border glow ─────────
        if (this.type === 'cost') {
            const dirEl = document.getElementById('costDirectionLabel');
            const verbEl = document.getElementById('costNetVerb');
            const container = document.getElementById('costCellContainer');

            if (dirEl) {
                dirEl.className = 'cost-dir-pill';
                if (value > 0.5) {
                    dirEl.classList.add('cost-dir-saving');
                    dirEl.textContent = 'Saves';
                    if (verbEl) verbEl.textContent = 'net cost reduction';
                } else if (value < -0.5) {
                    dirEl.classList.add('cost-dir-spending');
                    dirEl.textContent = 'Costs more';
                    if (verbEl) verbEl.textContent = 'net cost increase';
                } else {
                    dirEl.classList.add('cost-dir-neutral');
                    dirEl.textContent = '—';
                    if (verbEl) verbEl.textContent = 'move sliders to model cost';
                }
            }

            if (container) {
                if (value > 0.5) {
                    container.style.borderColor = 'rgba(78, 203, 160, 0.28)';
                    container.style.boxShadow = 'inset 0 0 30px rgba(78, 203, 160, 0.06), 0 1px 3px rgba(0,0,0,0.06)';
                } else if (value < -0.5) {
                    container.style.borderColor = 'rgba(245, 158, 11, 0.28)';
                    container.style.boxShadow = 'inset 0 0 30px rgba(245, 158, 11, 0.06), 0 1px 3px rgba(0,0,0,0.06)';
                } else {
                    container.style.borderColor = 'rgba(255,255,255,0.07)';
                    container.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                }
            }
        }
    }

    getGaugeColor() {
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

// ── SVG icon templates per category ─────────────────────────────────
// Single template per type — CSS classes (icon-fill, icon-rib, icon-ring)
// drive solid vs ghost appearance via .is-ghost on the parent SVG.
const HERO_COL_ICONS = {
    bins: function (color) {
        return `<svg class="col-item" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style="--item-color:${color}">
            <rect class="icon-fill" x="5" y="3" width="14" height="2.5" rx=".8"/>
            <path class="icon-fill" d="M6 6 L18 6 L16.6 21 L7.4 21 Z"/>
            <line class="icon-rib" x1="9.5" y1="9" x2="9.5" y2="18" fill="none"/>
            <line class="icon-rib" x1="12" y1="9" x2="12" y2="18" fill="none"/>
            <line class="icon-rib" x1="14.5" y1="9" x2="14.5" y2="18" fill="none"/>
        </svg>`;
    },
    gloves: function (color) {
        return `<svg class="col-item" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style="--item-color:${color}">
            <path class="icon-fill" d="M6.5 22 L6.5 12 C6.5 8.5,8.5 5,12 5 C15.5 5,17.5 8.5,17.5 12 L17.5 22 Z" stroke-linecap="round"/>
            <line class="icon-rib" x1="9" y1="10.5" x2="9" y2="6.5" stroke-linecap="round" fill="none"/>
            <line class="icon-rib" x1="11.3" y1="10" x2="11.3" y2="5.5" stroke-linecap="round" fill="none"/>
            <line class="icon-rib" x1="13.7" y1="10" x2="13.7" y2="5.5" stroke-linecap="round" fill="none"/>
            <line class="icon-rib" x1="16" y1="10.5" x2="16" y2="7" stroke-linecap="round" fill="none"/>
        </svg>`;
    },
    pipettes: function (color) {
        return `<svg class="col-item" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style="--item-color:${color}">
            <path class="icon-fill" d="M9.5 3 L14.5 3 L14.5 6 L9.5 6 Z"/>
            <path class="icon-fill" d="M9.5 6 L14.5 6 L13 18 L11 18 Z"/>
            <path class="icon-fill" d="M11 18 L13 18 L12.4 22 L11.6 22 Z"/>
        </svg>`;
    },
    tubes: function (color) {
        return `<svg class="col-item" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style="--item-color:${color}">
            <rect class="icon-fill" x="9" y="2.5" width="6" height="2.5" rx=".6"/>
            <path class="icon-fill" d="M10 5 L14 5 L14 19 C14 20.7,13.1 21.8,12 21.8 C10.9 21.8,10 20.7,10 19 Z"/>
            <line class="icon-rib" x1="10.3" y1="8" x2="13.7" y2="8" fill="none"/>
        </svg>`;
    },
    culture: function (color) {
        return `<svg class="col-item" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style="--item-color:${color}">
            <circle class="icon-fill" cx="12" cy="12" r="9"/>
            <circle class="icon-ring" cx="12" cy="12" r="5.5" fill="none"/>
        </svg>`;
    }
};

const HERO_COL_COLORS = {
    bins: '#4ECBA0',
    gloves: '#00AEEF',
    pipettes: '#A78BFA',
    tubes: '#F59E0B',
    culture: '#F87171'
};

/**
 * Build and update the hero Category Columns visualization.
 * Called from GaugeController.renderGauge() on every animation frame.
 * Uses classList.toggle so CSS transitions fire on every state change.
 */
function updateHeroColumns(reductionPercent) {
    const pct = Math.max(0, Math.min(100, reductionPercent));
    const remaining = Math.max(0, Math.round(7 * (1 - pct / 100)));

    const cols = document.querySelectorAll('.hero-col[data-cat]');
    if (!cols.length) return;

    cols.forEach(function (col) {
        const cat = col.dataset.cat;
        const color = HERO_COL_COLORS[cat];
        const iconFn = HERO_COL_ICONS[cat];
        if (!iconFn || !color) return;

        const stack = col.querySelector('.hero-col-stack');
        if (!stack) return;

        // Build icon skeletons once — CSS handles solid vs ghost appearance
        if (stack.children.length !== 7) {
            stack.innerHTML = '';
            for (var i = 0; i < 7; i++) {
                var tmp = document.createElement('div');
                tmp.innerHTML = iconFn(color);
                stack.appendChild(tmp.firstElementChild);
            }
        }

        // Toggle classes on every call — no replaceChild needed
        var items = stack.querySelectorAll('.col-item');
        items.forEach(function (svg, i) {
            var isGhost = i >= remaining;
            svg.classList.toggle('is-ghost', isGhost);
            svg.classList.toggle('is-top-solid', !isGhost && i === remaining - 1);
            if (isGhost) {
                var dist = i - remaining + 1;
                svg.style.setProperty('--ghost-offset', (dist * -6) + 'px');
                svg.style.opacity = Math.max(0.25, 0.85 - 0.10 * dist);
            } else {
                svg.style.removeProperty('--ghost-offset');
                svg.style.opacity = '';
            }
        });

        col.setAttribute('aria-label',
            cat.charAt(0).toUpperCase() + cat.slice(1) + ': ' + remaining + ' of 7 remaining');
    });
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
    // Build initial columns at 0%
    updateHeroColumns(0);
});

