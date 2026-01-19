# Google Play Console Data Safety Form - Required Actions

## Immediate Actions Required

Based on the codebase analysis, the following data types must be declared in the Google Play Console Data Safety form:

## 1. Personal Information

### ✅ Name
- **Collection**: Required for all user types
- **Purpose**: Account functionality, App functionality
- **Sharing**: YES - shared with dental clinics for appointments
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

### ✅ Email addresses  
- **Collection**: Required for account creation
- **Purpose**: Account functionality, Communications
- **Sharing**: NO
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

### ✅ User IDs
- **Collection**: Automatically generated for all users
- **Purpose**: Account functionality, App functionality  
- **Sharing**: NO
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

### ✅ Address
- **Collection**: Required field in registration
- **Purpose**: Account functionality, App functionality
- **Sharing**: NO
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

### ✅ Phone number
- **Collection**: Required for SMS notifications
- **Purpose**: Account functionality, Communications, Fraud prevention
- **Sharing**: YES - with SMS service provider (SOLAPI)
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

### ✅ Other personal info
- **Collection**: Date of birth, gender, work place
- **Purpose**: Account functionality, App functionality
- **Sharing**: YES - with healthcare providers
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

## 2. Health and Fitness

### ✅ Health info
- **Collection**: Treatment history, medical records, dental information
- **Purpose**: Account functionality, App functionality, Healthcare research
- **Sharing**: YES - with dental clinics and healthcare providers
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES (with legal retention requirements)

## 3. Financial Info

### ✅ Payment info
- **Collection**: Payment details through TossPayments
- **Purpose**: Account functionality, App functionality
- **Sharing**: YES - with payment processor (TossPayments)
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

### ✅ Purchase history
- **Collection**: Treatment payments, reservation payments
- **Purpose**: Account functionality, App functionality
- **Sharing**: YES - with payment processor and healthcare providers
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES (with legal retention requirements)

## 4. Messages

### ✅ In-app messages
- **Collection**: Chat messages between patients and dental professionals
- **Purpose**: Communications, App functionality
- **Sharing**: YES - with relevant healthcare providers
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

## 5. Photos and Videos

### ✅ Photos
- **Collection**: Medical documentation, before/after treatment photos
- **Purpose**: Account functionality, App functionality
- **Sharing**: YES - with dental clinics for treatment planning
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

## 6. Files and Docs

### ✅ Files and docs
- **Collection**: Medical records, insurance documents, treatment plans
- **Purpose**: Account functionality, App functionality
- **Sharing**: YES - with healthcare providers
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES (with legal retention requirements)

## 7. Location

### ✅ Approximate location
- **Collection**: For finding nearby clinics (Google Maps integration)
- **Purpose**: App functionality
- **Sharing**: YES - with Google Maps API
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

## 8. App Activity

### ✅ App interactions
- **Collection**: User navigation, feature usage
- **Purpose**: Analytics, App functionality
- **Sharing**: NO
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

### ✅ Other user-generated content
- **Collection**: Reviews, ratings, clinic information
- **Purpose**: App functionality
- **Sharing**: YES - visible to other users, shared with clinics
- **Data is encrypted in transit**: YES
- **Data can be deleted**: YES

## Data Safety Settings

### Security Practices
✅ **Data is encrypted in transit**: YES (HTTPS/TLS)
✅ **You can request that data be deleted**: YES
✅ **Committed to follow the Families Policy requirements**: YES
✅ **Data is reviewed by third parties**: YES (healthcare compliance)

### Data Collection and Sharing
✅ **App collects or shares user data**: YES
✅ **All user data is optional**: NO (some data required for core functionality)

## Third-Party Integrations to Declare

### 1. Supabase
- **Purpose**: Database and authentication
- **Data shared**: All user data
- **Privacy policy**: Included in app privacy policy

### 2. TossPayments SDK
- **Purpose**: Payment processing
- **Data shared**: Payment information, user details
- **SDK privacy policy**: TossPayments privacy policy applies

### 3. Google Maps API
- **Purpose**: Location services
- **Data shared**: Location coordinates
- **Privacy policy**: Google privacy policy applies

### 4. SOLAPI (SMS Service)
- **Purpose**: SMS notifications
- **Data shared**: Phone numbers, message content
- **Privacy policy**: SOLAPI privacy policy

### 5. Google OAuth
- **Purpose**: Social login
- **Data shared**: Profile information from Google
- **Privacy policy**: Google OAuth privacy policy

### 6. Kakao OAuth
- **Purpose**: Social login for Korean users
- **Data shared**: Profile information from Kakao
- **Privacy policy**: Kakao privacy policy

### 7. React Google Maps
- **Purpose**: Map display and interaction
- **Data shared**: Location data for geocoding
- **Privacy policy**: Google Maps privacy policy

## Key Changes Made to Address Rejection

1. **Comprehensive Data Declaration**: All data types found in the codebase are now properly declared
2. **Third-Party Integration Disclosure**: All SDKs and external services are documented
3. **Accurate Data Sharing Description**: Clear identification of what data is shared and with whom
4. **Healthcare Data Compliance**: Proper handling of sensitive health information
5. **Payment Data Security**: Appropriate declaration of financial data processing
6. **Location Data Transparency**: Clear explanation of location data usage
7. **Communication Data**: Proper declaration of messaging capabilities
8. **File Upload Security**: Documentation of file and photo handling

## Verification Checklist

Before resubmitting to Google Play Store:

- [ ] All identified data types added to Data Safety form
- [ ] Third-party SDK declarations complete
- [ ] Data sharing purposes accurately described
- [ ] Retention policies clearly stated
- [ ] Security measures documented
- [ ] User control options specified
- [ ] Healthcare compliance requirements addressed
- [ ] Payment processing security confirmed
- [ ] Location data usage explained
- [ ] Communication features declared

## Documentation Updates

The following files have been created/updated:
1. **GOOGLE_PLAY_DATA_SAFETY.md** - Comprehensive data safety documentation
2. **GOOGLE_PLAY_CONSOLE_ACTIONS.md** - Specific console configuration guide

These documents should be used to accurately complete the Google Play Console Data Safety form and ensure full compliance with Google Play policies.