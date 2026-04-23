/**
 * PLASTIC CHALLENGE CALCULATOR - Core Engine
 * Formulas from: Plastic_Challenge_Uppsala.xlsx via PLASTIC_CHALLENGE_MASTER_REFERENCE.md
 */

class PlasticCalculator {
    constructor() {
        // Baseline plastic kg — ratios 31:26:20:12:11 (Parts 1.1, 8.1)
        this.baseline = {
            bins: 31.0,
            gloves: 26.0,
            // Pipettes sub-rows scaled to 20 kg total (proportional from original 18.64 kg)
            pipettes_large: 11.74,
            pipettes_medium: 7.82,
            pipettes_small: 0.44,
            // Tubes sub-rows scaled to 12 kg total (proportional from original 12.90 kg)
            tubes_large: 10.15,
            tubes_small: 1.85,
            cell_culture: 11.0
        };

        // Flat totals used for ratio calculations and display (Part 8.1)
        this.baseTotals = {
            bins: 31.0,
            gloves: 26.0,
            pipettes: 20.0,
            tubes: 12.0,
            cell_culture: 11.0
        };

        // Plastic share of total — must sum to 1.0 (Part 1.1)
        this.plastic_ratios = {
            bins: 0.31, gloves: 0.26, pipettes: 0.20, tubes: 0.12, cell_culture: 0.11
        };

        // Cost share of total (Part 1.2) — pipettes/tubes/culture have no cost model yet (Part 7.2)
        this.cost_ratios = { bins: 0.07, gloves: 0.19 };

        // CO2 coefficients kg CO2e per kg plastic (Part 6.1)
        this.co2_coefficients = {
            bins: 6, gloves: 8, pipettes: 7, tubes: 7, cell_culture: 7
        };

        // WoodSafe Bio80 reduces plastic by 80% per bin switched (Part 2.2)
        this.woodsafe_plastic_reduction = 0.80;

        // Gloves account for ~10% of clinical waste bin volume (Part 2.4)
        // Reducing gloves by 1% therefore reduces bin usage by 0.1%
        this.glove_bin_coefficient = 0.10;

        // Current slider values — defaults from Part 13
        this.inputs = {
            bins_woodsafe: 70,
            bins_reduce: 30,
            gloves_replace: 100,
            gloves_reduce: 20,
            pipettes_large: 50,
            pipettes_medium: 50,
            pipettes_small: 50,
            tubes_large: 50,
            tubes_small: 50,
            cell_culture: 30
        };
    }

    calculate() {
        const d = (p) => p / 100;

        // ── Bins: sequential reduce → WoodSafe (Parts 9.1, 2.4) ─────
        const binsBase = this.baseTotals.bins;
        const glove_bin_contribution = d(this.inputs.gloves_reduce) * this.glove_bin_coefficient;
        const effective_bins_reduce = Math.min(1, d(this.inputs.bins_reduce) + glove_bin_contribution);
        const afterReduce = binsBase * (1 - effective_bins_reduce);
        const binsRem = Math.max(0, Math.min(binsBase,
            afterReduce * (1 - d(this.inputs.bins_woodsafe) * this.woodsafe_plastic_reduction)
        ));

        // ── Gloves: combined replace + reduce (Part 9.2) ─────────────
        const glovesBase = this.baseTotals.gloves;
        const r_replace = d(this.inputs.gloves_replace) * (1 - 4 / 6);
        const r_reduce = d(this.inputs.gloves_reduce);
        const glovesReduction = 1 - (1 - r_reduce) * (1 - r_replace);
        const glovesRem = Math.max(0, Math.min(glovesBase,
            glovesBase * (1 - glovesReduction)
        ));

        // ── Pipettes (Part 7.1) ───────────────────────────────────────
        const pipettesBase = this.baseTotals.pipettes;
        const pipettesRem = Math.max(0, Math.min(pipettesBase,
            this.baseline.pipettes_large * (1 - d(this.inputs.pipettes_large)) +
            this.baseline.pipettes_medium * (1 - d(this.inputs.pipettes_medium)) +
            this.baseline.pipettes_small * (1 - d(this.inputs.pipettes_small))
        ));

        // ── Tubes (Part 7.1) ─────────────────────────────────────────
        const tubesBase = this.baseTotals.tubes;
        const tubesRem = Math.max(0, Math.min(tubesBase,
            this.baseline.tubes_large * (1 - d(this.inputs.tubes_large)) +
            this.baseline.tubes_small * (1 - d(this.inputs.tubes_small))
        ));

        // ── Cell Culture (Part 7.1) ───────────────────────────────────
        const cultureBase = this.baseTotals.cell_culture;
        const cultureRem = Math.max(0, Math.min(cultureBase,
            cultureBase * (1 - d(this.inputs.cell_culture))
        ));

        // ── Saved / Totals ────────────────────────────────────────────
        const binsSaved = binsBase - binsRem;
        const glovesSaved = glovesBase - glovesRem;
        const pipettesSaved = pipettesBase - pipettesRem;
        const tubesSaved = tubesBase - tubesRem;
        const cultureSaved = cultureBase - cultureRem;
        const totalBase = binsBase + glovesBase + pipettesBase + tubesBase + cultureBase;
        const totalRem = binsRem + glovesRem + pipettesRem + tubesRem + cultureRem;
        const totalSaved = totalBase - totalRem;

        // ── CO2 (Part 6.2) ────────────────────────────────────────────
        const co2 = this.co2_coefficients;
        // co2_baseline = (0.31×6)+(0.26×8)+(0.20×7)+(0.12×7)+(0.11×7) = 6.95
        const co2_baseline =
            this.plastic_ratios.bins * co2.bins +
            this.plastic_ratios.gloves * co2.gloves +
            this.plastic_ratios.pipettes * co2.pipettes +
            this.plastic_ratios.tubes * co2.tubes +
            this.plastic_ratios.cell_culture * co2.cell_culture;

        const co2_saved_weighted =
            this.plastic_ratios.bins * (binsSaved / binsBase) * co2.bins +
            this.plastic_ratios.gloves * (glovesSaved / glovesBase) * co2.gloves +
            this.plastic_ratios.pipettes * (pipettesSaved / pipettesBase) * co2.pipettes +
            this.plastic_ratios.tubes * (tubesSaved / tubesBase) * co2.tubes +
            this.plastic_ratios.cell_culture * (cultureSaved / cultureBase) * co2.cell_culture;

        const carbon_reduction_percent = co2_baseline > 0
            ? Math.max(0, Math.min(100, (co2_saved_weighted / co2_baseline) * 100))
            : 0;

        const carbon_avoided =
            binsSaved * co2.bins +
            glovesSaved * co2.gloves +
            pipettesSaved * co2.pipettes +
            tubesSaved * co2.tubes +
            cultureSaved * co2.cell_culture;

        // ── Cost (Parts 9.3–9.5) ──────────────────────────────────────
        const bins_cost_chg = this._calcBinsCost(
            d(this.inputs.bins_woodsafe), d(this.inputs.bins_reduce)
        );
        const gloves_cost_chg = this._calcGlovesCost(
            d(this.inputs.gloves_replace), d(this.inputs.gloves_reduce)
        );
        // Positive = cost saving, negative = cost increase
        const cost_reduction_percent =
            (this.cost_ratios.bins * bins_cost_chg + this.cost_ratios.gloves * gloves_cost_chg) * 100;

        // ── Result ────────────────────────────────────────────────────
        return {
            categories: {
                bins: {
                    pre: binsBase,
                    post: binsRem,
                    change: (binsSaved / binsBase) * 100
                },
                gloves: {
                    pre: glovesBase,
                    post: glovesRem,
                    change: (glovesSaved / glovesBase) * 100
                },
                pipettes: {
                    pre: pipettesBase,
                    post: pipettesRem,
                    change: (pipettesSaved / pipettesBase) * 100
                },
                tubes: {
                    pre: tubesBase,
                    post: tubesRem,
                    change: (tubesSaved / tubesBase) * 100
                },
                cell_culture: {
                    pre: cultureBase,
                    post: cultureRem,
                    change: (cultureSaved / cultureBase) * 100
                }
            },
            totals: {
                reduction_percent: Math.max(0, Math.min(100, (totalSaved / totalBase) * 100)),
                remaining_percent: Math.max(0, Math.min(100, (totalRem / totalBase) * 100)),
                kg_saved: Math.max(0, totalSaved),
                carbon_avoided: Math.max(0, carbon_avoided),
                carbon_reduction_percent: carbon_reduction_percent,
                cost_reduction_percent: cost_reduction_percent,
                glove_bin_contribution_pct: glove_bin_contribution * 100
            }
        };
    }

    // Part 9.3 — positive = cost saving, negative = cost increase
    _calcBinsCost(bins_woodsafe, bins_reduce) {
        const cost_from_reduce = -bins_reduce;
        const cost_from_replace = (1 - bins_reduce) * bins_woodsafe * 0.5;
        return 1 - (1 + cost_from_reduce) * (1 + cost_from_replace);
    }

    // Part 9.4 — 4g gloves cost 5% more; reducing usage saves money
    _calcGlovesCost(gloves_replace, gloves_reduce) {
        const cost_from_reduce = -gloves_reduce;
        const cost_from_replace = (1 - gloves_reduce) * gloves_replace * 0.05;
        return 1 - (1 + cost_from_reduce) * (1 + cost_from_replace);
    }

    setInput(key, value) {
        if (this.inputs.hasOwnProperty(key)) {
            this.inputs[key] = Math.max(0, Math.min(100, value));
            return true;
        }
        return false;
    }

    getInput(key) {
        return this.inputs[key] || 0;
    }

    // Part 13 defaults
    reset() {
        this.inputs = {
            bins_woodsafe: 70,
            bins_reduce: 30,
            gloves_replace: 100,
            gloves_reduce: 20,
            pipettes_large: 50,
            pipettes_medium: 50,
            pipettes_small: 50,
            tubes_large: 50,
            tubes_small: 50,
            cell_culture: 30
        };
    }

    setScenario(scenario) {
        const scenarios = {
            baseline: {
                bins_woodsafe: 0, bins_reduce: 0,
                gloves_replace: 0, gloves_reduce: 0,
                pipettes_large: 0, pipettes_medium: 0, pipettes_small: 0,
                tubes_large: 0, tubes_small: 0,
                cell_culture: 0
            },
            moderate: {
                bins_woodsafe: 50, bins_reduce: 20,
                gloves_replace: 50, gloves_reduce: 10,
                pipettes_large: 50, pipettes_medium: 50, pipettes_small: 50,
                tubes_large: 50, tubes_small: 50,
                cell_culture: 30
            },
            aggressive: {
                bins_woodsafe: 100, bins_reduce: 70,
                gloves_replace: 100, gloves_reduce: 50,
                pipettes_large: 100, pipettes_medium: 100, pipettes_small: 100,
                tubes_large: 100, tubes_small: 100,
                cell_culture: 100
            },
            default: {
                bins_woodsafe: 70, bins_reduce: 30,
                gloves_replace: 100, gloves_reduce: 20,
                pipettes_large: 50, pipettes_medium: 50, pipettes_small: 50,
                tubes_large: 50, tubes_small: 50,
                cell_culture: 30
            }
        };

        if (scenarios[scenario]) {
            this.inputs = { ...scenarios[scenario] };
            return true;
        }
        return false;
    }
}

const calculator = new PlasticCalculator();
