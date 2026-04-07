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

        // Plastic reduction effect coefficients (Row 36 from Excel)
        this.effects = {
            bins_small: 0.2,    // Column B: Woodsafe effect
            bins_large: 0.2,    // Column B: Woodsafe effect
            gloves: 1.0,        // Column C: Direct reduction
            pipettes: 0.0,      // Column D: Biobased (no fossil reduction)
            tubes: 0.0,         // Column E: Biobased (no fossil reduction)
            cell_culture: 0.0   // Column F: Biobased (no fossil reduction)
        };

        // Total baseline plastic (from Excel: 100 kg)
        this.totalBaseline = 100;

        // CO2 emission coefficients (kg CO2e per kg plastic reduced)
        this.co2Coefficients = {
            bins: 2.5,
            gloves: 3.0,
            pipettes: 2.8,
            tubes: 2.6,
            cell_culture: 2.9
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
     * Calculate post-challenge plastic amounts for each category
     * Based on Excel formulas from rows 23-25
     */
    calculate() {
        const percentToDecimal = (p) => p / 100;

        // Clinical Waste Bins (Small) - Column B calculation
        // Formula: =B13*(1-Input!C5+B$36*(Input!C5))
        const bins_small_post_row13 = this.baseline.bins_small.row13 *
            (1 - percentToDecimal(this.inputs.bins_small) +
                this.effects.bins_small * percentToDecimal(this.inputs.bins_small));

        const bins_small_post_row14 = this.baseline.bins_small.row14 *
            (1 - percentToDecimal(this.inputs.bins_small) +
                this.effects.bins_small * percentToDecimal(this.inputs.bins_small));

        const bins_small_post = bins_small_post_row13 + bins_small_post_row14;

        // Clinical Waste Bins (Large) - Simplified calculation
        // Using similar logic but for large bins
        const bins_large_reduction = percentToDecimal(this.inputs.bins_large) * this.effects.bins_large;
        const bins_large_post = this.baseline.bins_small.total *
            (1 - percentToDecimal(this.inputs.bins_large) + bins_large_reduction);

        // Combined bins for display
        const bins_total_pre = this.baseline.bins_small.total;
        const bins_total_post = (bins_small_post + bins_large_post) / 2; // Average for display

        // Gloves - Column C calculation
        // Formula: =C13*C$36*(1-Input!C7)
        // Effect is 1.0 (complete reduction), so: C13 * 1.0 * (1 - Input!C7)
        const gloves_post = this.baseline.gloves.total *
            this.effects.gloves * (1 - percentToDecimal(this.inputs.gloves));

        // Pipette Tips - Column D calculation
        // Formula: =D13*(D$36*Input!C9+1*(1-Input!C9))
        // Effect is 0 (biobased, no fossil reduction), so: D13 * (0*Input + 1*(1-Input)) = D13 * (1-Input)
        const pipettes_large_factor = percentToDecimal(this.inputs.pipettes_large);
        const pipettes_medium_factor = percentToDecimal(this.inputs.pipettes_medium);
        const pipettes_small_factor = percentToDecimal(this.inputs.pipettes_small);

        const avg_pipettes_factor = (pipettes_large_factor + pipettes_medium_factor + pipettes_small_factor) / 3;

        const pipettes_post_row13 = this.baseline.pipettes.row13 *
            (this.effects.pipettes * avg_pipettes_factor + 1 * (1 - avg_pipettes_factor));
        const pipettes_post_row14 = this.baseline.pipettes.row14 *
            (this.effects.pipettes * avg_pipettes_factor + 1 * (1 - avg_pipettes_factor));
        const pipettes_post_row15 = this.baseline.pipettes.row15 *
            (this.effects.pipettes * avg_pipettes_factor + 1 * (1 - avg_pipettes_factor));

        const pipettes_post = pipettes_post_row13 + pipettes_post_row14 + pipettes_post_row15;

        // Tubes - Column E calculation
        // Similar to pipettes (effect is 0)
        const tubes_large_factor = percentToDecimal(this.inputs.tubes_large);
        const tubes_small_factor = percentToDecimal(this.inputs.tubes_small);
        const avg_tubes_factor = (tubes_large_factor + tubes_small_factor) / 2;

        const tubes_post_row13 = this.baseline.tubes.row13 *
            (this.effects.tubes * avg_tubes_factor + 1 * (1 - avg_tubes_factor));
        const tubes_post_row14 = this.baseline.tubes.row14 *
            (this.effects.tubes * avg_tubes_factor + 1 * (1 - avg_tubes_factor));

        const tubes_post = tubes_post_row13 + tubes_post_row14;

        // Cell Culture - Column F calculation
        // Effect is 0 (biobased)
        const cell_culture_post = this.baseline.cell_culture.total *
            (this.effects.cell_culture * percentToDecimal(this.inputs.cell_culture) +
                1 * (1 - percentToDecimal(this.inputs.cell_culture)));

        // Total post-challenge plastic
        const total_post = bins_total_post + gloves_post + pipettes_post + tubes_post + cell_culture_post;

        // Reduction percentage
        const reduction_percent = ((this.totalBaseline - total_post) / this.totalBaseline) * 100;
        const remaining_percent = (total_post / this.totalBaseline) * 100;

        // kg saved (weight reduced)
        const kg_saved = this.totalBaseline - total_post;

        // Apply baseline intensity multiplier
        const intensityMultiplier = this.baselineMultipliers[this.baselineIntensity];
        const adjusted_kg_saved = kg_saved * intensityMultiplier;
        const adjusted_total_pre = this.totalBaseline * intensityMultiplier;
        const adjusted_total_post = total_post * intensityMultiplier;

        // Calculate category-specific reductions
        const bins_reduced = (bins_total_pre - bins_total_post) * intensityMultiplier;
        const gloves_reduced = (this.baseline.gloves.total - gloves_post) * intensityMultiplier;
        const pipettes_reduced = (this.baseline.pipettes.total - pipettes_post) * intensityMultiplier;
        const tubes_reduced = (this.baseline.tubes.total - tubes_post) * intensityMultiplier;
        const culture_reduced = (this.baseline.cell_culture.total - cell_culture_post) * intensityMultiplier;

        // Calculate CO2 emissions avoided
        const carbon_avoided =
            bins_reduced * this.co2Coefficients.bins +
            gloves_reduced * this.co2Coefficients.gloves +
            pipettes_reduced * this.co2Coefficients.pipettes +
            tubes_reduced * this.co2Coefficients.tubes +
            culture_reduced * this.co2Coefficients.cell_culture;

        const carbon_total_pre =
            bins_total_pre * intensityMultiplier * this.co2Coefficients.bins +
            this.baseline.gloves.total * intensityMultiplier * this.co2Coefficients.gloves +
            this.baseline.pipettes.total * intensityMultiplier * this.co2Coefficients.pipettes +
            this.baseline.tubes.total * intensityMultiplier * this.co2Coefficients.tubes +
            this.baseline.cell_culture.total * intensityMultiplier * this.co2Coefficients.cell_culture;
        
        const carbon_reduction_percent = carbon_total_pre > 0 ? (carbon_avoided / carbon_total_pre) * 100 : 0;

        // Calculate cost impact based on stakeholder
        const costCoeff = this.costCoefficients[this.stakeholder];
        const cost_impact =
            bins_reduced * costCoeff.bins +
            gloves_reduced * costCoeff.gloves +
            pipettes_reduced * costCoeff.pipettes +
            tubes_reduced * costCoeff.tubes +
            culture_reduced * costCoeff.cell_culture;

        const cost_total_pre =
            bins_total_pre * intensityMultiplier * costCoeff.bins +
            this.baseline.gloves.total * intensityMultiplier * costCoeff.gloves +
            this.baseline.pipettes.total * intensityMultiplier * costCoeff.pipettes +
            this.baseline.tubes.total * intensityMultiplier * costCoeff.tubes +
            this.baseline.cell_culture.total * intensityMultiplier * costCoeff.cell_culture;

        const cost_reduction_percent = cost_total_pre > 0 ? (cost_impact / cost_total_pre) * 100 : 0;

        return {
            categories: {
                bins: {
                    pre: bins_total_pre * intensityMultiplier,
                    post: bins_total_post * intensityMultiplier,
                    change: ((bins_total_pre - bins_total_post) / bins_total_pre) * 100
                },
                gloves: {
                    pre: this.baseline.gloves.total * intensityMultiplier,
                    post: gloves_post * intensityMultiplier,
                    change: ((this.baseline.gloves.total - gloves_post) / this.baseline.gloves.total) * 100
                },
                pipettes: {
                    pre: this.baseline.pipettes.total * intensityMultiplier,
                    post: pipettes_post * intensityMultiplier,
                    change: ((this.baseline.pipettes.total - pipettes_post) / this.baseline.pipettes.total) * 100
                },
                tubes: {
                    pre: this.baseline.tubes.total * intensityMultiplier,
                    post: tubes_post * intensityMultiplier,
                    change: ((this.baseline.tubes.total - tubes_post) / this.baseline.tubes.total) * 100
                },
                cell_culture: {
                    pre: this.baseline.cell_culture.total * intensityMultiplier,
                    post: cell_culture_post * intensityMultiplier,
                    change: ((this.baseline.cell_culture.total - cell_culture_post) / this.baseline.cell_culture.total) * 100
                }
            },
            totals: {
                reduction_percent: Math.max(0, Math.min(100, reduction_percent)),
                remaining_percent: Math.max(0, Math.min(100, remaining_percent)),
                kg_saved: Math.max(0, adjusted_kg_saved),
                carbon_avoided: Math.max(0, carbon_avoided),
                carbon_reduction_percent: Math.max(0, Math.min(100, carbon_reduction_percent)),
                cost_impact: Math.max(0, cost_impact),
                cost_reduction_percent: Math.max(0, Math.min(100, cost_reduction_percent)),
                total_pre: adjusted_total_pre,
                total_post: adjusted_total_post
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
