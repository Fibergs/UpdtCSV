/**
 * FACILITY SETUP — Data capture & Live Summary donut
 * Reads form inputs → updates facilityConfig → redraws donut chart.
 * Does NOT touch calculator.js or alter any calculation results.
 */

window.facilityConfig = {
    bins:        { L50: 8, L25: 6, L12: 4, L6: 4, L3: 3, L2: 2 },
    gloves:      { annual_units: 4334, weight_per_glove_g: 6, material: 'vinyl' },
    consumables: {
        pipettes_large_kg: 11.74, pipettes_medium_kg: 7.82, pipettes_small_kg: 0.44,
        tubes_large_kg: 10.15,   tubes_small_kg: 1.85,      cell_culture_kg: 11.0
    },
    economics: { stakeholder_type: 'healthcare', hazardous_fee_sek: 45 }
};

var FC_DEFAULTS = {
    bins:        { L50: 8, L25: 6, L12: 4, L6: 4, L3: 3, L2: 2 },
    gloves:      { annual_units: 4334, weight_per_glove_g: 6, material: 'vinyl' },
    consumables: {
        pipettes_large_kg: 11.74, pipettes_medium_kg: 7.82, pipettes_small_kg: 0.44,
        tubes_large_kg: 10.15,   tubes_small_kg: 1.85,      cell_culture_kg: 11.0
    },
    economics: { stakeholder_type: 'healthcare', hazardous_fee_sek: 45 }
};

var BIN_WEIGHTS   = { L50: 2.055, L25: 1.325, L12: 0.650, L6: 0.350, L3: 0.220, L2: 0.180 };
var BIN_SIZES     = ['L50', 'L25', 'L12', 'L6', 'L3', 'L2'];
var SEK_PER_USD   = 10.5;
var FC_CIRC       = 2 * Math.PI * 66; // r=66 → ≈414.69

var CONS_MAP = {
    'fc-pip-large':    'pipettes_large_kg',
    'fc-pip-medium':   'pipettes_medium_kg',
    'fc-pip-small':    'pipettes_small_kg',
    'fc-tubes-large':  'tubes_large_kg',
    'fc-tubes-small':  'tubes_small_kg',
    'fc-cell-culture': 'cell_culture_kg'
};

/* ── kg helpers ────────────────────────────────────────────── */
function fcBinsKg() {
    return BIN_SIZES.reduce(function (s, k) {
        return s + (window.facilityConfig.bins[k] || 0) * BIN_WEIGHTS[k];
    }, 0);
}
function fcGlovesKg() {
    var fc = window.facilityConfig.gloves;
    return (fc.annual_units * fc.weight_per_glove_g) / 1000;
}
function fcPipettesKg() {
    var c = window.facilityConfig.consumables;
    return c.pipettes_large_kg + c.pipettes_medium_kg + c.pipettes_small_kg;
}
function fcTubesKg() {
    var c = window.facilityConfig.consumables;
    return c.tubes_large_kg + c.tubes_small_kg;
}
function fcCultureKg() {
    return window.facilityConfig.consumables.cell_culture_kg;
}

/* ── Live donut render ─────────────────────────────────────── */
function fcUpdateDonut() {
    var bins     = Math.max(0, fcBinsKg());
    var gloves   = Math.max(0, fcGlovesKg());
    var pipettes = Math.max(0, fcPipettesKg());
    var tubes    = Math.max(0, fcTubesKg());
    var culture  = Math.max(0, fcCultureKg());
    var total    = bins + gloves + pipettes + tubes + culture;

    var segs = [
        { id: 'fc-seg-bins',     kg: bins,     legId: 'fc-leg-bins',     pctId: 'fc-leg-bins-pct' },
        { id: 'fc-seg-gloves',   kg: gloves,   legId: 'fc-leg-gloves',   pctId: 'fc-leg-gloves-pct' },
        { id: 'fc-seg-pipettes', kg: pipettes, legId: 'fc-leg-pipettes', pctId: 'fc-leg-pipettes-pct' },
        { id: 'fc-seg-tubes',    kg: tubes,    legId: 'fc-leg-tubes',    pctId: 'fc-leg-tubes-pct' },
        { id: 'fc-seg-culture',  kg: culture,  legId: 'fc-leg-culture',  pctId: 'fc-leg-culture-pct' }
    ];

    var cumOffset = 0;
    segs.forEach(function (seg) {
        var el     = document.getElementById(seg.id);
        var legEl  = document.getElementById(seg.legId);
        var pctEl  = document.getElementById(seg.pctId);
        if (!el) return;

        var fraction = total > 0 ? seg.kg / total : 0;
        var segLen   = fraction * FC_CIRC;
        var gap      = (total > 0 && segLen > 0) ? 2 : 0;

        el.style.strokeDasharray  = (Math.max(0, segLen - gap)) + ' ' + FC_CIRC;
        el.style.strokeDashoffset = -cumOffset;
        cumOffset += segLen;

        if (legEl) legEl.textContent = seg.kg.toFixed(1) + ' kg';
        if (pctEl) pctEl.textContent = total > 0 ? Math.round(fraction * 100) + '%' : '0%';
    });

    // Center label
    var centerEl = document.getElementById('fc-donut-center-val');
    if (centerEl) centerEl.textContent = total.toFixed(1);

    // Total badge
    var totalEl = document.getElementById('fc-total-kg');
    if (totalEl) totalEl.textContent = total.toFixed(1);

    // Subtotals
    var binsEl = document.getElementById('fc-bins-total');
    if (binsEl) binsEl.textContent = bins.toFixed(1);

    var glovesEl = document.getElementById('fc-gloves-total');
    if (glovesEl) glovesEl.textContent = gloves.toFixed(1);

    var consEl = document.getElementById('fc-consumables-total');
    if (consEl) consEl.textContent = (pipettes + tubes + culture).toFixed(1);

    // Annual cost estimate
    var feeSek    = window.facilityConfig.economics.hazardous_fee_sek || 0;
    var costEl    = document.getElementById('fc-annual-cost-sek');
    if (costEl) costEl.textContent = Math.round(total * feeSek).toLocaleString('sv-SE');
}

/* ── Wire up "Load Defaults" buttons ───────────────────────── */
function fcApplyBinDefaults() {
    Object.assign(window.facilityConfig.bins, FC_DEFAULTS.bins);
    BIN_SIZES.forEach(function (s) {
        var el = document.getElementById('fc-bins-' + s);
        if (el) el.value = FC_DEFAULTS.bins[s];
    });
}
function fcApplyGloveDefaults() {
    Object.assign(window.facilityConfig.gloves, FC_DEFAULTS.gloves);
    var gu = document.getElementById('fc-gloves-units');
    var gw = document.getElementById('fc-gloves-weight');
    if (gu) gu.value = FC_DEFAULTS.gloves.annual_units;
    if (gw) gw.value = FC_DEFAULTS.gloves.weight_per_glove_g;
    document.querySelectorAll('.setup-toggle-btn[data-material]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.material === FC_DEFAULTS.gloves.material);
    });
}
function fcApplyConsumableDefaults() {
    Object.assign(window.facilityConfig.consumables, FC_DEFAULTS.consumables);
    Object.keys(CONS_MAP).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = FC_DEFAULTS.consumables[CONS_MAP[id]];
    });
}

/* ── DOMContentLoaded ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {

    // Bin inputs
    BIN_SIZES.forEach(function (size) {
        var el = document.getElementById('fc-bins-' + size);
        if (!el) return;
        el.addEventListener('input', function () {
            window.facilityConfig.bins[size] = Math.max(0, parseFloat(this.value) || 0);
            fcUpdateDonut();
        });
    });

    // Glove inputs
    var gloveUnits = document.getElementById('fc-gloves-units');
    if (gloveUnits) {
        gloveUnits.addEventListener('input', function () {
            window.facilityConfig.gloves.annual_units = Math.max(0, parseFloat(this.value) || 0);
            fcUpdateDonut();
        });
    }
    var gloveWeight = document.getElementById('fc-gloves-weight');
    if (gloveWeight) {
        gloveWeight.addEventListener('input', function () {
            window.facilityConfig.gloves.weight_per_glove_g = Math.max(0.1, parseFloat(this.value) || 6);
            fcUpdateDonut();
        });
    }

    // Material toggle
    document.querySelectorAll('.setup-toggle-btn[data-material]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.setup-toggle-btn[data-material]').forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            window.facilityConfig.gloves.material = btn.dataset.material;
        });
    });

    // Consumable inputs
    Object.keys(CONS_MAP).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', function () {
            window.facilityConfig.consumables[CONS_MAP[id]] = Math.max(0, parseFloat(this.value) || 0);
            fcUpdateDonut();
        });
    });

    // Stakeholder select
    var stakeholderSel = document.getElementById('fc-stakeholder');
    if (stakeholderSel) {
        stakeholderSel.addEventListener('change', function () {
            window.facilityConfig.economics.stakeholder_type = this.value;
        });
    }

    // Fee inputs — SEK ↔ USD sync
    var feeSekEl = document.getElementById('fc-fee-sek');
    var feeUsdEl = document.getElementById('fc-fee-usd');
    if (feeSekEl) {
        feeSekEl.addEventListener('input', function () {
            var sek = Math.max(0, parseFloat(this.value) || 0);
            window.facilityConfig.economics.hazardous_fee_sek = sek;
            if (feeUsdEl) feeUsdEl.value = (sek / SEK_PER_USD).toFixed(2);
            fcUpdateDonut();
        });
    }
    if (feeUsdEl) {
        feeUsdEl.addEventListener('input', function () {
            var sek = Math.max(0, (parseFloat(this.value) || 0) * SEK_PER_USD);
            window.facilityConfig.economics.hazardous_fee_sek = sek;
            if (feeSekEl) feeSekEl.value = sek.toFixed(0);
            fcUpdateDonut();
        });
    }

    // Load Defaults buttons
    document.querySelectorAll('.btn-load-defaults[data-defaults-target]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = btn.dataset.defaultsTarget;
            var origLabel = btn.textContent;

            if (target === 'bins')        { fcApplyBinDefaults(); }
            else if (target === 'gloves') { fcApplyGloveDefaults(); }
            else if (target === 'consumables') { fcApplyConsumableDefaults(); }

            fcUpdateDonut();

            btn.textContent = '✓ Applied';
            setTimeout(function () { btn.textContent = origLabel; }, 1500);
        });
    });

    // Initial render
    fcUpdateDonut();
});
