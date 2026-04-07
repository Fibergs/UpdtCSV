/**
 * INTERACTIVE CONTROLS - Range Sliders
 * Handles user interaction with <input type="range"> controls and updates calculations
 * Adapted from vertical fader controls to native range inputs
 */

class FaderControl {
    constructor(rangeInput) {
        this.input = rangeInput;
        this.controlKey = rangeInput.dataset.control;
        this.value = parseInt(rangeInput.dataset.default) || 0;

        // Set initial value on the input
        this.input.value = this.value;
        this.input.min = 0;
        this.input.max = 100;
        this.input.step = 1;

        // Find associated value display
        const row = rangeInput.closest('.slider-row');
        this.valueDisplay = row ? row.querySelector('.slider-value') : null;

        // Interaction state
        this.enabled = true;

        this.init();
    }

    init() {
        // Set initial visual state
        this.updateVisuals();

        // Listen for input events (real-time as user drags)
        this.input.addEventListener('input', (e) => {
            if (!this.enabled) return;
            this.setValue(parseInt(e.target.value));
            this.updateCalculator();
        });

        // Change event for final value
        this.input.addEventListener('change', (e) => {
            if (!this.enabled) return;
            this.setValue(parseInt(e.target.value));
            this.updateCalculator();
        });
    }

    updateVisuals() {
        // Update input value
        this.input.value = this.value;

        // Update CSS custom property for fill
        const percent = this.value;
        this.input.style.setProperty('--slider-progress', `${percent}%`);

        // Update value display
        if (this.valueDisplay) {
            this.valueDisplay.textContent = this.value;
        }
    }

    updateCalculator() {
        // Update calculator and trigger recalculation
        if (calculator && this.enabled && calculator.setInput(this.controlKey, this.value)) {
            updateDashboard();
        }
    }

    setValue(value) {
        this.value = Math.max(0, Math.min(100, value));
        this.updateVisuals();
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            this.input.closest('.slider-row').classList.remove('disabled');
            this.input.disabled = false;
        } else {
            this.input.closest('.slider-row').classList.add('disabled');
            this.input.disabled = true;
        }
        this.updateCalculator();
    }
}

/**
 * Category Toggle Switch — kept for compatibility but simplified
 */
class CategoryToggle {
    constructor(toggleSwitch, controlKey) {
        this.toggleSwitch = toggleSwitch;
        this.controlKey = controlKey;
        this.isOn = toggleSwitch.classList.contains('on');

        this.init();
    }

    init() {
        this.toggleSwitch.addEventListener('click', () => {
            this.toggle();
        });
    }

    toggle() {
        this.isOn = !this.isOn;

        if (this.isOn) {
            this.toggleSwitch.classList.add('on');
        } else {
            this.toggleSwitch.classList.remove('on');
        }

        // Find the corresponding fader and enable/disable it
        const fader = faderControls.find(f => f.controlKey === this.controlKey);
        if (fader) {
            fader.setEnabled(this.isOn);
        }
    }

    setOn(on) {
        this.isOn = on;
        if (on) {
            this.toggleSwitch.classList.add('on');
        } else {
            this.toggleSwitch.classList.remove('on');
        }
    }
}

/**
 * Update dashboard with latest calculations
 */
function updateDashboard() {
    const results = calculator.calculate();

    // Update gauges
    mainGaugeController.updateGauge(results.totals.reduction_percent);
    costGaugeController.updateGauge(results.totals.cost_reduction_percent);
    carbonGaugeController.updateGauge(results.totals.carbon_reduction_percent);

    // Update triple metrics with animated counting
    animateValue('weightReduced', results.totals.kg_saved, 1, ' kg');
    animateValue('carbonAvoided', results.totals.carbon_avoided, 1, ' kg CO₂e');
    animateValue('costImpact', results.totals.cost_impact, 0, '', '$');

    // Update category breakdowns
    updateCategoryBreakdown('bins', results.categories.bins);
    updateCategoryBreakdown('gloves', results.categories.gloves);
    updateCategoryBreakdown('pipettes', results.categories.pipettes);
    updateCategoryBreakdown('tubes', results.categories.tubes);
    updateCategoryBreakdown('culture', results.categories.cell_culture);
}

/**
 * Animate a metric value smoothly
 */
const animatedValues = {};
function animateValue(elementId, target, decimals = 1, suffix = '', prefix = '') {
    const el = document.getElementById(elementId);
    if (!el) return;

    const key = elementId;
    if (animatedValues[key] === undefined) {
        animatedValues[key] = 0;
    }

    const start = animatedValues[key];
    const diff = target - start;
    const duration = 600;
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + diff * eased;
        animatedValues[key] = current;

        el.textContent = prefix + current.toFixed(decimals) + suffix;

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

/**
 * Update a category breakdown display
 */
function updateCategoryBreakdown(category, data) {
    // Update pre/post values
    const preEl = document.getElementById(`pre_${category}`);
    const postEl = document.getElementById(`post_${category}`);
    const changeEl = document.getElementById(`change_${category}`);
    const barEl = document.getElementById(`bar_${category}`);

    if (preEl) preEl.textContent = data.pre.toFixed(1);
    if (postEl) postEl.textContent = data.post.toFixed(1);

    // Update change percentage
    if (changeEl) {
        const changePercent = data.change;
        changeEl.textContent = changePercent >= 0 ? `-${changePercent.toFixed(1)}%` : `+${Math.abs(changePercent).toFixed(1)}%`;
        changeEl.style.color = changePercent >= 0 ? 'var(--color-accent)' : 'var(--color-danger)';
    }

    // Update bar width
    if (barEl && data.pre > 0) {
        const percentage = (data.post / data.pre) * 100;
        barEl.style.width = `${percentage}%`;
    }
}

// Global arrays
const faderControls = [];
const categoryToggles = [];
let currentStakeholder = 'healthcare';
let currentIntensity = 'medium';

// Initialize all controls on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize range slider controls
    const rangeInputs = document.querySelectorAll('input[type="range"][data-control]');
    rangeInputs.forEach(input => {
        const faderControl = new FaderControl(input);
        faderControls.push(faderControl);
    });

    // Initialize category toggles (if any exist)
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    toggleSwitches.forEach(toggle => {
        const controlKey = toggle.dataset.toggle;
        const categoryToggle = new CategoryToggle(toggle, controlKey);
        categoryToggles.push(categoryToggle);
    });

    // Initialize stakeholder tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // Add active to clicked tab
            button.classList.add('active');

            // Update current stakeholder
            currentStakeholder = button.dataset.stakeholder;

            // Update calculator stakeholder
            calculator.setStakeholder(currentStakeholder);

            // Update stakeholder badge
            updateStakeholderBadge();

            // Update dashboard
            updateDashboard();
        });
    });

    // Initialize baseline intensity buttons
    const intensityButtons = document.querySelectorAll('.intensity-btn');
    intensityButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active from all buttons
            intensityButtons.forEach(btn => btn.classList.remove('active'));

            // Add active to clicked button
            button.classList.add('active');

            // Update current intensity
            currentIntensity = button.dataset.intensity;

            // Update calculator baseline intensity
            calculator.setBaselineIntensity(currentIntensity);

            // Update dashboard
            updateDashboard();
        });
    });

    // Initial calculation update
    updateDashboard();

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Reset each slider to its HTML data-default value
            faderControls.forEach(fader => {
                const defaultValue = parseInt(fader.input.dataset.default) || 0;
                fader.setValue(defaultValue);
                // Also sync the calculator with the slider's intended default
                calculator.setInput(fader.controlKey, defaultValue);
            });

            // Enable all toggles
            categoryToggles.forEach(toggle => {
                toggle.setOn(true);
                const fader = faderControls.find(f => f.controlKey === toggle.controlKey);
                if (fader) {
                    fader.setEnabled(true);
                }
            });

            updateDashboard();

            // Visual feedback
            resetBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                resetBtn.style.transform = 'scale(1)';
            }, 100);
        });
    }

    // Demo button
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            runDemoMode();
        });
    }

    // Subtle reveal animation (restrained)
    const sections = document.querySelectorAll('.reveal-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(8px)';
        setTimeout(() => {
            section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 80 + index * 60);
    });

    // Collapsible category groups
    const groupHeaders = document.querySelectorAll('.category-group-header');
    groupHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const group = header.closest('.category-group');
            group.classList.toggle('collapsed');
        });
    });
});

/**
 * Update stakeholder badge text
 */
function updateStakeholderBadge() {
    const badge = document.getElementById('stakeholderBadge');
    if (!badge) return;
    const names = {
        healthcare: 'Healthcare Centres',
        research: 'Research Labs',
        university: 'Universities'
    };
    badge.textContent = names[currentStakeholder] || 'Healthcare Centres';
}

/**
 * Demo mode - animate through scenarios
 */
function runDemoMode() {
    const scenarios = [
        { name: 'baseline', duration: 2000 },
        { name: 'moderate', duration: 3000 },
        { name: 'aggressive', duration: 3000 },
        { name: 'default', duration: 2000 }
    ];

    let currentScenario = 0;

    function playScenario() {
        if (currentScenario >= scenarios.length) {
            return; // Demo complete
        }

        const scenario = scenarios[currentScenario];
        calculator.setScenario(scenario.name);

        // Update all faders with smooth animation
        faderControls.forEach(fader => {
            const targetValue = calculator.getInput(fader.controlKey);
            animateFaderTo(fader, targetValue, 800);
        });

        updateDashboard();

        currentScenario++;
        setTimeout(playScenario, scenario.duration);
    }

    playScenario();
}

/**
 * Animate a fader to a target value
 */
function animateFaderTo(fader, targetValue, duration) {
    const startValue = fader.value;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-in-out function
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentValue = startValue + (targetValue - startValue) * eased;
        fader.setValue(Math.round(currentValue));

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            updateDashboard();
        }
    }

    requestAnimationFrame(animate);
}
