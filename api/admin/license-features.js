// License tier feature definitions - ALL PAYING CUSTOMERS GET FULL FEATURES
// Tiers are for pricing only, not feature restrictions
export const LICENSE_FEATURES = {
  student: {
    name: "Student License",
    price: "$49/year",
    billing_type: "yearly",
    features: {
      // ALL FEATURES ENABLED - Students get everything!
      basic_analysis: true,
      advanced_analysis: true,
      premium_analysis: true,
      enterprise_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      phone_support: true,
      
      // Full capabilities
      max_projects: -1, // unlimited
      max_users: -1, // unlimited
      api_access: "full",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: true,
      
      // All features
      commercial_use: true,
      educational_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
      data_retention_days: -1, // unlimited
      team_collaboration: true,
      api_calls: -1, // unlimited
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true,
      
      // Premium features
      dedicated_account_manager: true,
      custom_deployment: true,
      sso_integration: true,
      ldap_integration: true,
      custom_branding: true,
      advanced_security: true,
      compliance_reports: true,
      data_residency: true,
      custom_training: true
    },
    restrictions: [],
    note: "Student pricing with full professional features"
  },
  
  startup: {
    name: "Startup License",
    price: "$99/month",
    billing_type: "monthly",
    features: {
      // ALL FEATURES ENABLED
      basic_analysis: true,
      advanced_analysis: true,
      premium_analysis: true,
      enterprise_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      phone_support: true,
      
      max_projects: -1,
      max_users: -1,
      api_access: "full",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: true,
      
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
      data_retention_days: -1,
      team_collaboration: true,
      api_calls: -1,
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true,
      
      dedicated_account_manager: true,
      custom_deployment: true,
      sso_integration: true,
      ldap_integration: true,
      custom_branding: true,
      advanced_security: true,
      compliance_reports: true,
      data_residency: true,
      custom_training: true
    },
    restrictions: [],
    note: "Monthly billing with full professional features"
  },
  
  professional: {
    name: "Professional License",
    price: "$199/month",
    billing_type: "monthly",
    features: {
      // ALL FEATURES ENABLED
      basic_analysis: true,
      advanced_analysis: true,
      premium_analysis: true,
      enterprise_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      phone_support: true,
      
      max_projects: -1,
      max_users: -1,
      api_access: "full",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: true,
      
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
      data_retention_days: -1,
      team_collaboration: true,
      api_calls: -1,
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true,
      
      dedicated_account_manager: true,
      custom_deployment: true,
      sso_integration: true,
      ldap_integration: true,
      custom_branding: true,
      advanced_security: true,
      compliance_reports: true,
      data_residency: true,
      custom_training: true
    },
    restrictions: [],
    note: "Full professional features"
  },
  
  professional_yearly: {
    name: "Professional License (Yearly)",
    price: "$1,999/year",
    billing_type: "yearly",
    features: {
      // ALL FEATURES ENABLED
      basic_analysis: true,
      advanced_analysis: true,
      premium_analysis: true,
      enterprise_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      phone_support: true,
      
      max_projects: -1,
      max_users: -1,
      api_access: "full",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: true,
      
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
      data_retention_days: -1,
      team_collaboration: true,
      api_calls: -1,
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true,
      
      dedicated_account_manager: true,
      custom_deployment: true,
      sso_integration: true,
      ldap_integration: true,
      custom_branding: true,
      advanced_security: true,
      compliance_reports: true,
      data_residency: true,
      custom_training: true,
      
      yearly_discount: true
    },
    restrictions: [],
    note: "Yearly billing discount with full professional features"
  },
  
  enterprise: {
    name: "Enterprise License",
    price: "$499/month",
    billing_type: "monthly",
    features: {
      // ALL FEATURES ENABLED
      basic_analysis: true,
      advanced_analysis: true,
      premium_analysis: true,
      enterprise_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      phone_support: true,
      
      max_projects: -1,
      max_users: -1,
      api_access: "full",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: true,
      
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
      data_retention_days: -1,
      team_collaboration: true,
      api_calls: -1,
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true,
      
      dedicated_account_manager: true,
      custom_deployment: true,
      sso_integration: true,
      ldap_integration: true,
      custom_branding: true,
      advanced_security: true,
      compliance_reports: true,
      data_residency: true,
      custom_training: true
    },
    restrictions: [],
    note: "Premium pricing tier with full professional features"
  },
  
  enterprise_yearly: {
    name: "Enterprise License (Yearly)",
    price: "$4,999/year",
    billing_type: "yearly",
    features: {
      // ALL FEATURES ENABLED
      basic_analysis: true,
      advanced_analysis: true,
      premium_analysis: true,
      enterprise_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      phone_support: true,
      
      max_projects: -1,
      max_users: -1,
      api_access: "full",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: true,
      
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
      data_retention_days: -1,
      team_collaboration: true,
      api_calls: -1,
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true,
      
      dedicated_account_manager: true,
      custom_deployment: true,
      sso_integration: true,
      ldap_integration: true,
      custom_branding: true,
      advanced_security: true,
      compliance_reports: true,
      data_residency: true,
      custom_training: true,
      
      yearly_discount: true,
      priority_feature_requests: true
    },
    restrictions: [],
    note: "Premium yearly pricing with full professional features"
  }
};

// Helper function to get features for a license type
export function getFeaturesForLicenseType(licenseType) {
  return LICENSE_FEATURES[licenseType] || null;
}

// Helper function to check if a feature is available for a license type
export function hasFeature(licenseType, featureName) {
  const licenseFeatures = getFeaturesForLicenseType(licenseType);
  return licenseFeatures ? !!licenseFeatures.features[featureName] : false;
}

// Helper function to get feature value (for features with numeric values)
export function getFeatureValue(licenseType, featureName) {
  const licenseFeatures = getFeaturesForLicenseType(licenseType);
  return licenseFeatures ? licenseFeatures.features[featureName] : null;
}