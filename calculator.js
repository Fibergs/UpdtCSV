/**
 * PLASTIC CHALLENGE CALCULATOR - Core Engine
 * Implements formulas from Excel spreadsheet for calculating plastic reduction
 */

class PlasticCalculator {
    constructor() {
        // Baseline data from Excel (Input2 sheet, rows 13-21)
        this.baseline = {
            // Clinical waste bins small (Column B)
            bins_small: {
                row13: 24.09,
                row14: 6.35,
                total: 30.44
            },
            // Clinical waste bins large + Gloves (Column C)
            gloves: {
                row13: 29.49,  // This represents gloves in the calculation
                total: 29.49
            },
            // Pipette tips (Column D)
            pipettes: {
                row13: 10.94,
                row14: 7.29,
                row15: 0.41,
                total: 18.64
            },
            // Tubes (Column E)
            tubes: {
                row13: 10.91,
                row14: 1.99,
                total: 12.90
            },
            // Cell culture (Column F, sum of rows 13-21)
            cell_culture: {
                total: 8.53
            }
        };

        // Residual fraction at 100% adoption — from Impact CSV (Reduction_Effect_Coeff).
        // Used in formula: Remaining = Baseline × (1 − (Input × (1 − residual)))
        // • bins  0.2 → WoodSafe: 20% plastic residue persists even at full adoption
        // • gloves  0 → direct 1:1 elimination (CSV says "1" meaning 100% efficiency → residual = 0)
        // • biobased  0 → weight fully replaced, but fossil CO₂ credit = 0 (see co2Coefficients)
        this.effects = {
            bins: 0.2,
            gloves: 0,
            pipettes: 0,
            tubes: 0,
            cell_culture: 0
        };

        // WoodSafe Bins: LCA-verified CO₂ data (Miljögiraff AB, Report 1293, 2023 — IPCC GWP 2021 100).
        // Bins use a SUBSTITUTION model, not an elimination model:
        //   CO₂ avoided = kg_adopted × net_delta  (not kg_saved × some factor)
        // net_delta = fossil_pp (5.71) − WoodSafe Bio80 (1.94) = 3.77 kg CO₂e per kg switched.
        // At 100% adoption → 66% CO₂ reduction from bins (confirmed by LCA).
        // The 0.2 residual in this.effects.bins maps directly to the 20% virgin PP
        // content in WoodSafe Bio80's composition (0.204 kg VP / 1.021 kg total ≈ 20%).
        this.woodsafeCO2 = {
            fossil_pp:  5.71,   // kg CO₂e/kg — virgin PP HWC, cradle-to-grave (LCA)
            bio80:      1.94,   // kg CO₂e/kg — WoodSafe Bio80, cradle-to-grave (LCA)
            net_delta:  3.77    // kg CO₂e saved per kg of bins switched to WoodSafe Bio80
        };

        // CO₂ factors for non-bins categories (kg CO₂e per kg plastic weight reduced).
        // Gloves: direct weight reduction (thinner versions or reduced usage) — Impact CSV.
        // Biobased (pipettes/tubes/culture): fossil CO₂ credit = 0 (material swap only).
        this.co2Coefficients = {
            gloves: 8,
            pipettes: 0,        // biobased — fossil reduction efficiency = 0 (Impact CSV)
            tubes: 0,           // biobased
            cell_culture: 0     // biobased
        };

        // Cost impact coefficients ($/kg reduced) by stakeholder
        this.costCoefficients = {
            healthcare: { bins: 5.2, gloves: 8.5, pipettes: 12.0, tubes: 10.5, cell_culture: 15.0 },
            research: { bins: 4.8, gloves: 7.0, pipettes: 14.5, tubes: 12.0, cell_culture: 18.0 },
            university: { bins: 4.0, gloves: 6.5, pipettes: 11.0, tubes: 9.5, cell_culture: 13.0 }
        };

        // Baseline intensity multipliers
        this.baselineMultipliers = {
            low: 0.5,
            medium: 1.0,
            high: 2.0
        };

        // Current stakeholder and intensity
        this.stakeholder = 'healthcare';
        this.baselineIntensity = 'medium';

        // Current input values (percentages 0-100)
        this.inputs = {
            bins_large: 70,
            bins_small: 90,
            gloves: 50,
            pipettes_large: 50,
            pipettes_medium: 50,
            pipettes_small: 50,
            tubes_large: 50,
            tubes_small: 50,
            cell_culture: 30
        };
    }

    /**
     * Calculate post-challenge plastic amounts for each category.
     *
     * Core formula (Logic CSV):
     *   Remaining = Baseline × (1 − (Input × (1 − Residual_Coeff)))
     *
     * Where Residual_Coeff is the floor fraction that persists at 100% adoption:
     *   • bins      0.2 — WoodSafe: 20% plastic always remains (Impact CSV)
     *   • gloves    0   — direct 1:1 elimination (CSV "1" = 100% efficiency → 0 residual)
     *   • biobased  0   — weight fully substituted, but fossil CO₂ credit = 0
     */
    calculate() {
        const d = (p) => p / 100;

        // ── Remaining Weight ──────────────────────────────────────
        // Bins: row13 driven by bins_large (WoodSafe Adoption),
        //       row14 driven by bins_small (Risk Waste Volume).
        // Both rows share the same 0.2 WoodSafe residual.
        const binsLargeRem = this.baseline.bins_small.row13 * (1 - d(this.inputs.bins_large) * (1 - this.effects.bins));
        const binsSmallRem = this.baseline.bins_small.row14 * (1 - d(this.inputs.bins_small) * (1 - this.effects.bins));
        const binsRem      = binsLargeRem + binsSmallRem;

        // Gloves: residual = 0 → simplifies to Baseline × (1 − Input)
        const glovesRem = this.baseline.gloves.total * (1 - d(this.inputs.gloves));

        // Pipettes (biobased, residual = 0): apply per-size input to its own baseline row
        const pipettesRem =
            this.baseline.pipettes.row13 * (1 - d(this.inputs.pipettes_large))  +
            this.baseline.pipettes.row14 * (1 - d(this.inputs.pipettes_medium)) +
            this.baseline.pipettes.row15 * (1 - d(this.inputs.pipettes_small));

        // Tubes (biobased, residual = 0)
        const tubesRem =
            this.baseline.tubes.row13 * (1 - d(this.inputs.tubes_large)) +
            this.baseline.tubes.row14 * (1 - d(this.inputs.tubes_small));

        // Cell Culture (biobased, residual = 0)
        const cultureRem = this.baseline.cell_culture.total * (1 - d(this.inputs.cell_culture));

        // ── Baseline Totals ───────────────────────────────────────
        const binsBase     = this.baseline.bins_small.total;      // 30.44 kg
        const glovesBase   = this.baseline.gloves.total;          // 29.49 kg
        const pipettesBase = this.baseline.pipettes.total;        // 18.64 kg
        const tubesBase    = this.baseline.tubes.total;           // 12.90 kg
        const cultureBase  = this.baseline.cell_culture.total;    //  8.53 kg
        const totalBase    = binsBase + glovesBase + pipettesBase + tubesBase + cultureBase; // 100.00 kg

        // ── Saved Per Category ────────────────────────────────────
        const binsSaved     = binsBase     - binsRem;
        const glovesSaved   = glovesBase   - glovesRem;
        const pipettesSaved = pipettesBase - pipettesRem;
        const tubesSaved    = tubesBase    - tubesRem;
        const cultureSaved  = cultureBase  - cultureRem;
        const totalRem      = binsRem + glovesRem + pipettesRem + tubesRem + cultureRem;
        const totalSaved    = totalBase - totalRem;

        // ── Site Intensity Multiplier ────────────────────────────
        const intensity = this.baselineMultipliers[this.baselineIntensity];

        // ── CO₂ Avoided ──────────────────────────────────────────
        // Bins: substitution model (LCA Miljögiraff 1293).
        //   CO₂ avoided = kg adopted × net_delta  (not kg saved × a factor)
        //   CO₂ baseline = full bins baseline weight × fossil PP footprint
        //   At 100% adoption: avoided / baseline = (30.44 × 3.77) / (30.44 × 5.71) ≈ 66% ✓
        const binsAdoptedWeight = this.baseline.bins_small.row13 * d(this.inputs.bins_large)
                                + this.baseline.bins_small.row14 * d(this.inputs.bins_small);
        const carbonAvoided_bins  = binsAdoptedWeight * this.woodsafeCO2.net_delta;
        const carbonBaseline_bins = binsBase           * this.woodsafeCO2.fossil_pp;

        // Biobased co2Coefficients are already 0 — material swap ≠ fossil CO₂ elimination.
        const carbonAvoided = (
            carbonAvoided_bins +
            glovesSaved   * this.co2Coefficients.gloves +
            pipettesSaved * this.co2Coefficients.pipettes +
            tubesSaved    * this.co2Coefficients.tubes +
            cultureSaved  * this.co2Coefficients.cell_culture
        ) * intensity;

        const carbonBaseline = (
            carbonBaseline_bins +
            glovesBase   * this.co2Coefficients.gloves +
            pipettesBase * this.co2Coefficients.pipettes +
            tubesBase    * this.co2Coefficients.tubes +
            cultureBase  * this.co2Coefficients.cell_culture
        ) * intensity;

        const carbon_reduction_percent = carbonBaseline > 0 ? (carbonAvoided / carbonBaseline) * 100 : 0;

        // ── Cost Impact ───────────────────────────────────────────
        const cc = this.costCoefficients[this.stakeholder];

        // Woodsafe Adoption Premium: 
        // Adopting Woodsafe without reducing Risk Waste Volume negatively affects the budget
        // because Woodsafe bins carry a purchasing premium over fossil bins.
        // We apply a premium penalty per kg of Woodsafe adopted.
        const woodsafe_premium_penalty = 5.5; // Estimated penalty to ensure negative impact if no volume reduction

        const cost_impact = (
            binsSaved     * cc.bins +
            glovesSaved   * cc.gloves +
            pipettesSaved * cc.pipettes +
            tubesSaved    * cc.tubes +
            cultureSaved  * cc.cell_culture
        ) * intensity - (binsAdoptedWeight * woodsafe_premium_penalty * intensity);

        const costBaseline = (
            binsBase     * cc.bins +
            glovesBase   * cc.gloves +
            pipettesBase * cc.pipettes +
            tubesBase    * cc.tubes +
            cultureBase  * cc.cell_culture
        ) * intensity;

        // Ensure cost reduction percent can go negative 
        const cost_reduction_percent = costBaseline > 0 ? (cost_impact / costBaseline) * 100 : 0;


        // ── Result ────────────────────────────────────────────────
        return {
            categories: {
                bins: {
                    pre:    binsBase    * intensity,
                    post:   binsRem     * intensity,
                    change: (binsSaved     / binsBase)     * 100
                },
                gloves: {
                    pre:    glovesBase  * intensity,
                    post:   glovesRem   * intensity,
                    change: (glovesSaved   / glovesBase)   * 100
                },
                pipettes: {
                    pre:    pipettesBase * intensity,
                    post:   pipettesRem  * intensity,
                    change: (pipettesSaved / pipettesBase) * 100
                },
                tubes: {
                    pre:    tubesBase   * intensity,
                    post:   tubesRem    * intensity,
                    change: (tubesSaved    / tubesBase)    * 100
                },
                cell_culture: {
                    pre:    cultureBase * intensity,
                    post:   cultureRem  * intensity,
                    change: (cultureSaved  / cultureBase)  * 100
                }
            },
            totals: {
                reduction_percent:        Math.max(0, Math.min(100, (totalSaved / totalBase) * 100)),
                remaining_percent:        Math.max(0, Math.min(100, (totalRem   / totalBase) * 100)),
                kg_saved:                 Math.max(0, totalSaved * intensity),
                carbon_avoided:           Math.max(0, carbonAvoided),
                carbon_reduction_percent: Math.max(0, Math.min(100, carbon_reduction_percent)),
                cost_impact:              Math.max(0, cost_impact),
                cost_reduction_percent:   Math.max(0, Math.min(100, cost_reduction_percent)),
                total_pre:                totalBase * intensity,
                total_post:               totalRem  * intensity
            }
        };
    }

    /**
     * Update a specific input value
     */
    setInput(key, value) {
        if (this.inputs.hasOwnProperty(key)) {
            this.inputs[key] = Math.max(0, Math.min(100, value));
            return true;
        }
        return false;
    }

    /**
     * Get current input value
     */
    getInput(key) {
        return this.inputs[key] || 0;
    }

    /**
     * Reset all inputs to default values
     */
    reset() {
        this.inputs = {
            bins_large: 70,
            bins_small: 90,
            gloves: 50,
            pipettes_large: 50,
            pipettes_medium: 50,
            pipettes_small: 50,
            tubes_large: 50,
            tubes_small: 50,
            cell_culture: 30
        };
    }

    /**
     * Set all inputs to a specific scenario
     */
    setScenario(scenario) {
        const scenarios = {
            baseline: {
                bins_large: 0, bins_small: 0, gloves: 0,
                pipettes_large: 0, pipettes_medium: 0, pipettes_small: 0,
                tubes_large: 0, tubes_small: 0, cell_culture: 0
            },
            moderate: {
                bins_large: 50, bins_small: 50, gloves: 50,
                pipettes_large: 50, pipettes_medium: 50, pipettes_small: 50,
                tubes_large: 50, tubes_small: 50, cell_culture: 30
            },
            aggressive: {
                bins_large: 100, bins_small: 100, gloves: 100,
                pipettes_large: 100, pipettes_medium: 100, pipettes_small: 100,
                tubes_large: 100, tubes_small: 100, cell_culture: 100
            },
            default: {
                bins_large: 70, bins_small: 90, gloves: 50,
                pipettes_large: 50, pipettes_medium: 50, pipettes_small: 50,
                tubes_large: 50, tubes_small: 50, cell_culture: 30
            }
        };

        if (scenarios[scenario]) {
            this.inputs = { ...scenarios[scenario] };
            return true;
        }
        return false;
    }

    /**
     * Set current stakeholder
     */
    setStakeholder(stakeholder) {
        if (this.costCoefficients[stakeholder]) {
            this.stakeholder = stakeholder;
            return true;
        }
        return false;
    }

    /**
     * Set baseline intensity
     */
    setBaselineIntensity(intensity) {
        if (this.baselineMultipliers[intensity]) {
            this.baselineIntensity = intensity;
            return true;
        }
        return false;
    }
}

// Create global calculator instance
const calculator = new PlasticCalculator();
