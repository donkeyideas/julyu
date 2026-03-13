import { useState, useEffect } from 'react'
import { Stack } from 'expo-router'
import { ScreenContainer } from '@/components'
import { LegalContent } from '@/components/ui/LegalContent'
import { apiClient } from '@/services/api'

const FALLBACK_PRIVACY_POLICY = `# Privacy Policy

**Last Updated: March 2026**

Julyu ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.

## Information We Collect

### Information You Provide
We collect information you voluntarily provide when you create an account, including your name, email address, and ZIP code. We also collect shopping list data, receipt images, and product preferences that you choose to share with us.

### Automatically Collected Information
When you use Julyu, we automatically collect certain device information, including your device type, operating system version, and unique device identifiers. We also collect usage data such as features accessed, search queries, and interaction patterns to improve our services.

### Location Information
With your permission, we may collect approximate location data based on your ZIP code or device location to provide nearby store information and localized pricing. You can disable location services at any time through your device settings.

## How We Use Your Information

We use the information we collect to:

- Provide, maintain, and improve our services
- Compare grocery prices across stores in your area
- Generate personalized shopping recommendations
- Process and analyze receipt data for savings tracking
- Send notifications about price changes and deals
- Respond to your inquiries and support requests
- Detect, prevent, and address technical issues

## Data Sharing and Disclosure

We do not sell your personal information. We may share your information in the following circumstances:

**Service Providers:** We share data with third-party service providers who assist us in operating our platform, including cloud hosting, analytics, and payment processing.

**Aggregated Data:** We may share aggregated, anonymized data that cannot reasonably be used to identify you, such as general pricing trends and shopping patterns.

**Legal Requirements:** We may disclose your information if required by law, regulation, or legal process.

## Data Security

We implement industry-standard security measures to protect your information, including encryption in transit and at rest, secure authentication, and regular security audits. However, no method of transmission over the internet is 100% secure.

## Data Retention

We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.

## Your Rights

Depending on your location, you may have the right to:

- Access and receive a copy of your personal data
- Correct inaccurate personal data
- Request deletion of your personal data
- Object to or restrict processing of your data
- Data portability

## Children's Privacy

Julyu is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy within the app and updating the "Last Updated" date.

## Contact Us

If you have questions about this Privacy Policy, please contact us at:

**Email:** privacy@julyu.com
**Address:** Julyu Inc., New York, NY`

export default function PrivacyPolicyScreen() {
  const [content, setContent] = useState(FALLBACK_PRIVACY_POLICY)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPrivacyPolicy() {
      try {
        const response = await apiClient<{ content: string }>('/content/privacy-policy')
        if (response.content) {
          setContent(response.content)
        }
      } catch {
        // Use fallback content
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrivacyPolicy()
  }, [])

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <LegalContent
        title="Privacy Policy"
        content={content}
        isLoading={isLoading}
      />
    </ScreenContainer>
  )
}
