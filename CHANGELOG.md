# Changelog

All notable changes to FindableAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-01-15

### Added
- **New Feature**: AI Competitor Analysis with automated snapshots
- **Enhancement**: Advanced filtering options for audit logs
- **Security**: Two-factor authentication support
- Dashboard customization for different user roles
- Automated report generation with scheduling
- Export functionality for all data tables

### Changed
- Improved scanning performance by 40%
- Updated UI design system with better contrast ratios
- Enhanced mobile responsiveness across all pages
- Streamlined onboarding flow with progress tracking

### Fixed
- **Bug Fix**: Resolved issue with duplicate site entries
- **Security**: Fixed XSS vulnerability in prompt input
- Corrected timezone handling in reports
- Fixed memory leak in real-time scan updates

### Security
- Updated all dependencies to latest secure versions
- Implemented rate limiting on API endpoints
- Enhanced session management with automatic timeout

## [1.1.3] - 2024-01-02

### Fixed
- **Critical**: Fixed authentication redirect loop
- Resolved issue with PDF report generation
- Corrected scan result accuracy for schema detection

### Security
- Patched potential SQL injection in competitor queries

## [1.1.2] - 2023-12-20

### Changed
- Improved error messaging for failed scans
- Updated pricing plans with new tier options
- Enhanced performance monitoring dashboard

### Fixed
- Fixed issue with scan history pagination
- Resolved mobile layout bugs on iOS devices
- Corrected email notification delivery issues

## [1.1.1] - 2023-12-10

### Added
- Real-time scan progress indicators
- Bulk site import functionality
- Advanced search in competitor analysis

### Fixed
- **Bug Fix**: Resolved timeout issues for large websites
- Fixed incorrect findability score calculations
- Corrected date formatting in reports

## [1.1.0] - 2023-11-25

### Added
- **Major Feature**: Competitor comparison dashboard
- AI prompt simulation with detailed analytics
- Custom report templates
- Team collaboration features for Enterprise plans
- API access for programmatic scanning

### Changed
- Redesigned scanning engine for better accuracy
- Updated subscription management interface
- Improved admin panel with advanced user management

### Deprecated
- Legacy API v1 endpoints (will be removed in v2.0.0)

### Fixed
- Resolved issues with large site scanning
- Fixed incorrect metadata extraction
- Corrected billing cycle calculations

## [1.0.5] - 2023-11-10

### Added
- Multi-language support for scan results
- Enhanced security scanning capabilities
- Automated backup system for user data

### Fixed
- **Security**: Fixed potential data exposure in admin logs
- Resolved payment processing edge cases
- Corrected scan scheduling conflicts

## [1.0.4] - 2023-10-28

### Added
- Dark mode support across all interfaces
- Advanced filtering for scan history
- Integration with popular CMS platforms

### Changed
- Improved scanning speed for websites with many pages
- Enhanced user experience in mobile applications
- Updated documentation with video tutorials

### Fixed
- Fixed issues with special characters in URLs
- Resolved subscription renewal notifications
- Corrected time zone handling in scheduled scans

## [1.0.3] - 2023-10-15

### Fixed
- **Critical**: Resolved database connection issues
- Fixed scan result export functionality
- Corrected user permission inheritance

### Security
- Enhanced encryption for stored user data
- Updated authentication tokens expiration

## [1.0.2] - 2023-10-05

### Added
- Automated scan scheduling
- Enhanced tip generation system
- Performance optimization recommendations

### Fixed
- Resolved email delivery issues
- Fixed dashboard loading performance
- Corrected scan result accuracy metrics

## [1.0.1] - 2023-09-22

### Fixed
- **Bug Fix**: Fixed user registration flow
- Resolved issues with scan initialization
- Corrected dashboard statistics display

### Security
- Implemented additional input validation
- Enhanced API security measures

## [1.0.0] - 2023-09-15

### Added
- **Launch**: Initial release of FindableAI platform
- Core website scanning functionality
- AI findability score calculation
- User dashboard and account management
- Basic reporting system
- Subscription management with Stripe integration
- Admin panel for user management
- RESTful API for developers

### Features
- Website metadata analysis
- Schema markup validation
- Crawlability assessment
- AI prompt testing
- Competitor tracking
- PDF report generation
- Multi-tier subscription plans
- Role-based access control