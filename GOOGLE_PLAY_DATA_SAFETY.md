# Google Play Store Data Safety Declaration
# Chia Dental Platform App

This document outlines the comprehensive data collection, usage, and sharing practices for the Chia dental platform application, as required by Google Play Store Data Safety policies.

## App Information
- **App Name**: 치아 (Chia)
- **Company**: 비씨디 (BCD)
- **Developer**: 10X Blitz
- **Business Registration**: 235-04-01772

## Data Types Collected

### Personal Information

#### **Name**
- **Collected**: YES
- **Required/Optional**: Required for account creation
- **Purpose**: Account creation, user identification, appointment booking
- **Sharing**: Shared with healthcare providers for appointment purposes
- **Retention**: Until account deletion or 5 years (whichever comes first)

#### **Email Address**
- **Collected**: YES
- **Required/Optional**: Required for account creation
- **Purpose**: Account creation, authentication, communications
- **Sharing**: Not shared with third parties
- **Retention**: Until account deletion

#### **Phone Number**
- **Collected**: YES
- **Required/Optional**: Required
- **Purpose**: SMS notifications, appointment confirmations, two-factor authentication
- **Sharing**: Shared with SMS service provider (SOLAPI)
- **Retention**: Until account deletion

#### **Address**
- **Collected**: YES
- **Required/Optional**: Required
- **Purpose**: Location-based clinic recommendations, service delivery
- **Sharing**: Not shared with third parties
- **Retention**: Until account deletion

#### **Date of Birth**
- **Collected**: YES
- **Required/Optional**: Required
- **Purpose**: Age verification, healthcare service eligibility
- **Sharing**: Shared with healthcare providers for treatment purposes
- **Retention**: Until account deletion or 5 years

#### **Gender**
- **Collected**: YES
- **Required/Optional**: Required
- **Purpose**: Healthcare service personalization
- **Sharing**: Shared with healthcare providers for treatment purposes
- **Retention**: Until account deletion

### Health and Fitness

#### **Health Information**
- **Collected**: YES
- **Required/Optional**: Required for dental services
- **Purpose**: Treatment planning, medical history, appointment scheduling
- **Sharing**: Shared with dental clinics and healthcare providers
- **Retention**: 5 years minimum for medical record purposes

### Financial Information

#### **Payment Info**
- **Collected**: YES (through TossPayments integration)
- **Required/Optional**: Required for paid services
- **Purpose**: Processing payments for dental services
- **Sharing**: Processed by TossPayments SDK
- **Retention**: As per payment processor and legal requirements

### Messages

#### **In-app Messages**
- **Collected**: YES
- **Required/Optional**: Optional
- **Purpose**: Communication between patients and dental professionals
- **Sharing**: Shared with relevant healthcare providers
- **Retention**: Until conversation deletion or account deletion

### Photos and Videos

#### **Photos**
- **Collected**: YES
- **Required/Optional**: Optional
- **Purpose**: Medical documentation, treatment planning, before/after comparisons
- **Sharing**: Shared with dental clinics for treatment purposes
- **Retention**: Until deletion by user or account closure

### Files and Docs

#### **Files and Documents**
- **Collected**: YES
- **Required/Optional**: Optional
- **Purpose**: Medical records, treatment documents, insurance forms
- **Sharing**: Shared with relevant healthcare providers
- **Retention**: 5 years for medical record purposes

### Location

#### **Approximate Location**
- **Collected**: YES
- **Required/Optional**: Optional
- **Purpose**: Finding nearby dental clinics, location-based recommendations
- **Sharing**: Used with Google Maps API for location services
- **Retention**: Not stored permanently

### App Activity

#### **App Interactions**
- **Collected**: YES
- **Required/Optional**: Automatic
- **Purpose**: App functionality, user experience improvement
- **Sharing**: Not shared with third parties
- **Retention**: Until account deletion

## Third-Party Integrations and Data Sharing

### Supabase (Database & Authentication)
- **Data Shared**: All user profile data, authentication tokens, stored files
- **Purpose**: Backend infrastructure, user authentication, data storage
- **Location**: Cloud servers
- **Security**: Encrypted at rest and in transit

### TossPayments
- **Data Shared**: Payment information, transaction details, customer identifiers
- **Purpose**: Payment processing for dental services
- **Compliance**: PCI DSS compliant
- **Data Retention**: As per payment processor policies

### SOLAPI (SMS Service)
- **Data Shared**: Phone numbers, SMS content for notifications
- **Purpose**: Send appointment confirmations, verification codes
- **Data Retention**: As per SMS service provider policies

### Google Maps API
- **Data Shared**: Location coordinates for address geocoding
- **Purpose**: Location-based services, clinic mapping
- **Privacy**: Location data processed but not stored

### Google OAuth
- **Data Shared**: Profile information (name, email) from Google account
- **Purpose**: Social login authentication
- **Data Retention**: Until account deletion

### Kakao OAuth
- **Data Shared**: Profile information from Kakao account
- **Purpose**: Social login authentication (Korean users)
- **Data Retention**: Until account deletion

## Data Security Measures

### Encryption
- All sensitive data encrypted in transit (HTTPS/TLS)
- Database encryption at rest
- File uploads encrypted and secured

### Access Controls
- Role-based access control (Patient, Dentist, Admin)
- Authentication required for all data access
- Session management with secure tokens

### Data Processing Location
- Primary servers: Cloud infrastructure (Supabase)
- File storage: Secure cloud storage
- Payment processing: TossPayments infrastructure

## User Rights and Controls

### Data Access
- Users can view their complete data profile
- Medical records accessible through app interface
- Account settings allow data review

### Data Correction
- Users can update profile information
- Medical information updated through healthcare providers
- Real-time synchronization of changes

### Data Deletion
- Account deletion removes user data
- Medical records retained per legal requirements (5 years)
- Immediate removal of optional data

### Data Portability
- Users can export their data
- Medical records can be transferred between providers
- Standard formats for data export

## Children's Privacy
- App not designed for children under 13
- Age verification through date of birth
- Parental consent required for minors (13-18)

## Data Retention Policies

### User Profile Data
- **Retention**: Until account deletion
- **Exception**: Legal requirements may extend retention

### Medical Records
- **Retention**: 5 years minimum (Korean healthcare law)
- **Purpose**: Medical continuity, legal compliance

### Messages/Communications
- **Retention**: Until deletion by user
- **Automatic**: No automatic deletion

### Payment Records
- **Retention**: As required by financial regulations
- **Minimum**: 5 years for tax purposes

### Location Data
- **Retention**: Not permanently stored
- **Purpose**: Real-time service only

## Legal Basis for Processing

### Account Management
- **Basis**: Contractual necessity
- **Purpose**: Service delivery

### Healthcare Services
- **Basis**: Legitimate interest, consent
- **Purpose**: Medical treatment coordination

### Marketing Communications
- **Basis**: Consent (opt-in)
- **Control**: Users can opt-out anytime

### Legal Compliance
- **Basis**: Legal obligation
- **Purpose**: Healthcare regulations, financial laws

## Updates to Data Practices
- Users notified of material changes
- Updated privacy policy published in app
- Consent re-obtained if required by law

## Contact Information
For data privacy questions or requests:
- **Email**: business@10xblitz.com
- **Phone**: 010-5090-9006
- **Company**: BCD (비씨디)
- **Representative**: Junki Hong (홍준기)

## Compliance Standards
- Korean Personal Information Protection Act (PIPA)
- Healthcare data protection regulations
- Google Play Developer Policies
- GDPR compliance for EU users

---
**Last Updated**: January 2025
**Version**: 1.0
**Effective Date**: Upon app publication

## Important Notes for Google Play Console Data Safety Form

### Data Collection Summary
✅ **Collects personal data**: YES
✅ **Shares personal data**: YES (with healthcare providers, payment processors)
✅ **Uses encryption in transit**: YES
✅ **Provides data deletion**: YES (with medical record retention requirements)
✅ **Committed to privacy policy**: YES
✅ **Data reviewed by third party**: YES (required for healthcare compliance)

### Required Declarations
1. **Health and fitness data collected for healthcare services**
2. **Financial data processed through certified payment provider**
3. **Location data used for clinic discovery (not stored)**
4. **Photos/files for medical documentation**
5. **Messages for patient-provider communication**
6. **Third-party integrations properly disclosed**