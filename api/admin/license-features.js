// License tier feature definitions
export const LICENSE_FEATURES = {
  student: {
    name: "Student License",
    price: "$49/year",
    features: {
      // Core features
      basic_analysis: true,
      report_generation: true,
      email_support: true,
      
      // Limitations
      max_projects: 3,
      max_users: 1,
      api_access: false,
      advanced_analytics: false,
      custom_integrations: false,
      priority_support: false,
      phone_support: false,
      sla_guarantee: false,
      
      // Specific features
      educational_use_only: true,
      watermarked_reports: true,
      export_formats: ["PDF"],
      data_retention_days: 90
    },
    restrictions: [
      "Educational use only",
      "Reports include watermark",
      "Limited to 3 projects",
      "90-day data retention"
    ]
  },
  
  startup: {
    name: "Startup License",
    price: "$99/month",
    features: {
      // Core features
      basic_analysis: true,
      advanced_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      
      // Capabilities
      max_projects: 15,
      max_users: 5,
      api_access: "basic",
      advanced_analytics: true,
      custom_integrations: false,
      phone_support: false,
      sla_guarantee: false,
      
      // Specific features
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV"],
      data_retention_days: 365,
      team_collaboration: true,
      basic_api_calls: 1000
    },
    restrictions: [
      "Up to 5 team members",
      "Basic API access (1,000 calls/month)",
      "No phone support"
    ]
  },
  
  professional: {
    name: "Professional License",
    price: "$199/month",
    features: {
      // Core features
      basic_analysis: true,
      advanced_analysis: true,
      premium_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      phone_support: true,
      
      // Capabilities
      max_projects: -1, // unlimited
      max_users: -1, // unlimited
      api_access: "full",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: "business_hours",
      
      // Specific features
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML"],
      data_retention_days: 1095, // 3 years
      team_collaboration: true,
      api_calls: 10000,
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true
    },
    restrictions: [
      "SLA applies during business hours only"
    ]
  },
  
  professional_yearly: {
    name: "Professional License (Yearly)",
    price: "$1,999/year",
    features: {
      // Same as professional but with yearly billing discount
      basic_analysis: true,
      advanced_analysis: true,
      premium_analysis: true,
      report_generation: true,
      email_support: true,
      priority_support: true,
      phone_support: true,
      
      max_projects: -1,
      max_users: -1,
      api_access: "full",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: "business_hours",
      
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML"],
      data_retention_days: 1095,
      team_collaboration: true,
      api_calls: 10000,
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true,
      
      // Yearly bonus features
      dedicated_account_manager: false,
      yearly_discount: true
    },
    restrictions: [
      "Annual billing commitment"
    ]
  },
  
  enterprise: {
    name: "Enterprise License",
    price: "$499/month",
    features: {
      // All features enabled
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
      api_access: "enterprise",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: "24x7",
      
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
      data_retention_days: -1, // unlimited
      team_collaboration: true,
      api_calls: 100000,
      white_label_reports: true,
      advanced_permissions: true,
      audit_logging: true,
      
      // Enterprise features
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
    restrictions: []
  },
  
  enterprise_yearly: {
    name: "Enterprise License (Yearly)",
    price: "$4,999/year",
    features: {
      // Same as enterprise with yearly billing
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
      api_access: "enterprise",
      advanced_analytics: true,
      custom_integrations: true,
      sla_guarantee: "24x7",
      
      commercial_use: true,
      watermarked_reports: false,
      export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
      data_retention_days: -1,
      team_collaboration: true,
      api_calls: 100000,
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
      
      // Yearly bonus
      yearly_discount: true,
      priority_feature_requests: true
    },
    restrictions: [
      "Annual billing commitment"
    ]
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