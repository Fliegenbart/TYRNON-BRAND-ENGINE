// ============================================
// RULES STORE - Store and manage learned brand rules
// ============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRulesStore = create(
  persist(
    (set, get) => ({
      // State
      rules: {},           // brandId -> Rule[]
      analysisStatus: {},  // brandId -> 'none' | 'analyzing' | 'review' | 'complete'
      extractedAssets: {}, // brandId -> { logos: [], images: [] }

      // Set rules for a brand
      setRulesForBrand: (brandId, rules, extractedAssets = null) => set(state => ({
        rules: { ...state.rules, [brandId]: rules },
        analysisStatus: { ...state.analysisStatus, [brandId]: 'review' },
        ...(extractedAssets && {
          extractedAssets: { ...state.extractedAssets, [brandId]: extractedAssets }
        })
      })),

      // Update analysis status
      setAnalysisStatus: (brandId, status) => set(state => ({
        analysisStatus: { ...state.analysisStatus, [brandId]: status }
      })),

      // Get rules for a brand
      getRulesForBrand: (brandId) => {
        return get().rules[brandId] || [];
      },

      // Get rules for specific asset type
      getRulesForAssetType: (brandId, assetType) => {
        const brandRules = get().rules[brandId] || [];
        return brandRules.filter(r =>
          r.applicableTo.includes(assetType) || r.applicableTo.includes('all')
        );
      },

      // Get rules by category
      getRulesByCategory: (brandId, category) => {
        const brandRules = get().rules[brandId] || [];
        return brandRules.filter(r => r.category === category);
      },

      // Update a single rule
      updateRule: (brandId, ruleId, updates) => set(state => {
        const brandRules = state.rules[brandId] || [];
        const updatedRules = brandRules.map(rule =>
          rule.id === ruleId ? { ...rule, ...updates } : rule
        );
        return {
          rules: { ...state.rules, [brandId]: updatedRules }
        };
      }),

      // Delete a rule
      deleteRule: (brandId, ruleId) => set(state => {
        const brandRules = state.rules[brandId] || [];
        const filteredRules = brandRules.filter(rule => rule.id !== ruleId);
        return {
          rules: { ...state.rules, [brandId]: filteredRules }
        };
      }),

      // Confirm a rule (sets confidence to 1.0)
      confirmRule: (brandId, ruleId) => set(state => {
        const brandRules = state.rules[brandId] || [];
        const updatedRules = brandRules.map(rule =>
          rule.id === ruleId ? { ...rule, confidence: 1.0, confirmed: true } : rule
        );
        return {
          rules: { ...state.rules, [brandId]: updatedRules }
        };
      }),

      // Confirm all rules
      confirmAllRules: (brandId) => set(state => {
        const brandRules = state.rules[brandId] || [];
        const updatedRules = brandRules.map(rule => ({
          ...rule,
          confidence: 1.0,
          confirmed: true
        }));
        return {
          rules: { ...state.rules, [brandId]: updatedRules },
          analysisStatus: { ...state.analysisStatus, [brandId]: 'complete' }
        };
      }),

      // Add a new rule manually
      addRule: (brandId, rule) => set(state => {
        const brandRules = state.rules[brandId] || [];
        const newRule = {
          ...rule,
          id: rule.id || 'rule-' + Math.random().toString(36).substring(2, 9),
          confirmed: true,
          confidence: 1.0
        };
        return {
          rules: { ...state.rules, [brandId]: [...brandRules, newRule] }
        };
      }),

      // Clear all rules for a brand
      clearRules: (brandId) => set(state => ({
        rules: { ...state.rules, [brandId]: [] },
        analysisStatus: { ...state.analysisStatus, [brandId]: 'none' },
        extractedAssets: { ...state.extractedAssets, [brandId]: null }
      })),

      // Export rules as JSON
      exportRules: (brandId) => {
        const brandRules = get().rules[brandId] || [];
        return JSON.stringify(brandRules, null, 2);
      },

      // Import rules from JSON
      importRules: (brandId, json) => {
        try {
          const rules = JSON.parse(json);
          if (Array.isArray(rules)) {
            set(state => ({
              rules: { ...state.rules, [brandId]: rules },
              analysisStatus: { ...state.analysisStatus, [brandId]: 'complete' }
            }));
            return true;
          }
        } catch (e) {
          console.error('Failed to import rules:', e);
        }
        return false;
      },

      // Get analysis status
      getAnalysisStatus: (brandId) => {
        return get().analysisStatus[brandId] || 'none';
      },

      // Get extracted assets
      getExtractedAssets: (brandId) => {
        return get().extractedAssets[brandId] || { logos: [], images: [] };
      },

      // Check if brand has rules
      hasRules: (brandId) => {
        const brandRules = get().rules[brandId] || [];
        return brandRules.length > 0;
      },

      // Get rule summary for a brand
      getRuleSummary: (brandId) => {
        const brandRules = get().rules[brandId] || [];
        return {
          total: brandRules.length,
          confirmed: brandRules.filter(r => r.confirmed).length,
          byCategory: {
            color: brandRules.filter(r => r.category === 'color').length,
            typography: brandRules.filter(r => r.category === 'typography').length,
            spacing: brandRules.filter(r => r.category === 'spacing').length,
            component: brandRules.filter(r => r.category === 'component').length
          }
        };
      }
    }),
    {
      name: 'brand-rules-storage',
      version: 1
    }
  )
);

export default useRulesStore;
