import { useState, useEffect } from 'react'
import { Stack } from 'expo-router'
import { ScreenContainer } from '@/components'
import { LegalContent } from '@/components/ui/LegalContent'
import { apiClient } from '@/services/api'

const FALLBACK_TERMS = `# Terms of Service

**Last Updated: March 2026**

Welcome to Julyu. These Terms of Service ("Terms") govern your access to and use of the Julyu mobile application and related services (the "Service"). By using Julyu, you agree to be bound by these Terms.

## Acceptance of Terms

By creating an account or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, do not use the Service.

## Description of Service

Julyu is a grocery price comparison platform that helps users find the best prices across local stores. The Service includes:

- Product price comparison across participating stores
- Shopping list creation and management
- Receipt scanning and savings tracking
- Personalized deal notifications
- Store locator functionality

## User Accounts

### Registration
To access certain features, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials.

### Account Security
You are responsible for all activity that occurs under your account. Notify us immediately if you suspect unauthorized access to your account.

### Account Termination
We reserve the right to suspend or terminate accounts that violate these Terms, at our sole discretion and without prior notice.

## Acceptable Use

You agree not to:

- Use the Service for any unlawful purpose
- Attempt to gain unauthorized access to our systems
- Interfere with or disrupt the Service or its infrastructure
- Scrape, crawl, or use automated means to access the Service without permission
- Impersonate another person or entity
- Upload malicious content, viruses, or harmful code
- Use the Service to send spam or unsolicited communications

## Pricing Information

### Accuracy
While we strive to provide accurate pricing information, prices displayed in Julyu are for informational purposes only. Actual prices may vary and are determined solely by individual retailers. We do not guarantee the accuracy, completeness, or timeliness of pricing data.

### No Price Guarantees
Julyu does not guarantee that any price shown will be honored by a retailer. Always verify prices at the point of purchase.

## Intellectual Property

### Our Content
The Service, including its design, features, and content, is owned by Julyu and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written consent.

### User Content
By submitting content (such as receipt images or shopping lists), you grant Julyu a non-exclusive, worldwide, royalty-free license to use, process, and store that content for the purpose of providing the Service.

## Privacy

Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference.

## Disclaimers

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.

## Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, JULYU SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

## Indemnification

You agree to indemnify and hold harmless Julyu, its officers, directors, employees, and agents from any claims, liabilities, damages, and expenses arising from your use of the Service or violation of these Terms.

## Changes to Terms

We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms. We will make reasonable efforts to notify you of material changes.

## Governing Law

These Terms are governed by the laws of the State of New York, without regard to conflict of law provisions.

## Contact Us

If you have questions about these Terms, please contact us at:

**Email:** legal@julyu.com
**Address:** Julyu Inc., New York, NY`

export default function TermsOfServiceScreen() {
  const [content, setContent] = useState(FALLBACK_TERMS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTerms() {
      try {
        const response = await apiClient<{ content: string }>('/content/terms-of-service')
        if (response.content) {
          setContent(response.content)
        }
      } catch {
        // Use fallback content
      } finally {
        setIsLoading(false)
      }
    }

    fetchTerms()
  }, [])

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <LegalContent
        title="Terms of Service"
        content={content}
        isLoading={isLoading}
      />
    </ScreenContainer>
  )
}
