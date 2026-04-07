export default {
  plugins: ["stylelint-order", "@stylistic/stylelint-plugin"],
  rules: {
    "at-rule-empty-line-before": ["always", { "except": ["first-nested"] }],
    "rule-empty-line-before": ["always", { "except": ["first-nested"] }],
    "declaration-empty-line-before": ["always", { "except": ["first-nested", "after-declaration"] }],
    "custom-property-empty-line-before": ["always", { "except": ["first-nested", "after-custom-property"] }],
    "comment-empty-line-before": ["always", { "except": ["first-nested"] }],

    "order/order": ["custom-properties", "declarations"],

    "@stylistic/selector-list-comma-space-after": "never",
    "@stylistic/selector-list-comma-newline-after": "always",
  }
};