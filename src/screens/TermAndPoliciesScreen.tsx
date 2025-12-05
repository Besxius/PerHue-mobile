import React, { FC } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type TermsAndPoliciesScreenProps = NativeStackScreenProps<RootStackParamList, 'TermAndPoliciesScreen'>;

const TermsAndPoliciesScreen: FC<TermsAndPoliciesScreenProps> = () => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container]}>
            <ScrollView style={styles.content}>

                <Text style={styles.sectionHeading}>1. Acceptance of Terms</Text>
                <Text style={styles.paragraph}>
                    By accessing or using the PerHue mobile application (the "Service"), you agree to be bound by these Terms of Service and Privacy Policy. If you disagree with any part of the terms, you may not access the Service.
                </Text>

                <Text style={styles.sectionHeading}>2. Service Description (Personal Color Analysis)</Text>
                <Text style={styles.paragraph}>
                    The PerHue Service provides tools, including Artificial Intelligence (AI) and Expert Analysis, to suggest an individual's personal color palette ("Color Type") based on uploaded photographs and self-reported data. The results are provided for informational and consultative purposes only and are not guaranteed medical or dermatological advice.
                </Text>

                <Text style={styles.sectionHeading}>3. Privacy Policy & Data Collection</Text>

                {/* --- Image and Personal Data --- */}
                <Text style={styles.subHeading}>3.1. Image and Biometric Data</Text>
                <Text style={styles.paragraph}>
                    To perform color analysis, the Service requires the upload of **high-resolution images** showing the user's face, skin, and sometimes eyes/hair. These images may contain **biometric data**.
                    We use these images exclusively for the following purposes:
                    {'\n'}• Performing the requested AI or Expert Color Analysis.
                    {'\n'}• Improving and refining our proprietary AI color analysis models (aggregated and anonymized data only).
                    {'\n'}• Providing feedback and expert consultation (if the Expert Service is purchased).
                </Text>
                <Text style={styles.paragraph}>
                    **Retention and Deletion:** User images are retained only for the period necessary to provide the service and for a limited period thereafter for quality assurance. You may request permanent deletion of your images and associated biometric data at any time via your account settings or by contacting us.
                </Text>

                <Text style={styles.subHeading}>3.2. Personal Information (PI)</Text>
                <Text style={styles.paragraph}>
                    We collect PI (name, email, unique device ID) solely for account management, authentication, and service delivery (e.g., sending results or managing subscriptions). We do not sell your personal data to third parties.
                </Text>

                <Text style={styles.sectionHeading}>4. Application Operation and Use</Text>

                <Text style={styles.subHeading}>4.1. Account Registration and Security</Text>
                <Text style={styles.paragraph}>
                    You are responsible for maintaining the confidentiality of your account details. Any activity occurring under your account is your responsibility.
                </Text>

                <Text style={styles.subHeading}>4.2. User Generated Content (UGC)</Text>
                <Text style={styles.paragraph}>
                    Any comments, feedback, or text submitted to our Expert Analysis section or public forums are considered User Generated Content. By submitting UGC, you grant PerHue a non-exclusive, transferable, worldwide, royalty-free license to use, reproduce, and display that content in connection with the Service.
                </Text>

                <Text style={styles.subHeading}>4.3. Fair Usage Policy</Text>
                <Text style={styles.paragraph}>
                    The Service is offered under a fair usage policy. Automated access, data scraping, or any unauthorized use intended to bypass payment mechanisms or API limits is strictly prohibited and will result in immediate account termination.
                </Text>

                <Text style={styles.sectionHeading}>5. Expert Services and Liability</Text>
                <Text style={styles.paragraph}>
                    Expert Consultations are performed by independent, verified professionals. PerHue acts only as a platform facilitator. We are not liable for individual expert opinions, advice, or any dissatisfaction arising from the expert analysis. All results should be treated as professional opinions, not guaranteed truths.
                </Text>

                <Text style={styles.sectionHeading}>6. Governing Law</Text>
                <Text style={styles.paragraph}>
                    These Terms shall be governed by the laws of Vietnam, without regard to its conflict of law provisions.
                </Text>

                <Text style={styles.sectionHeading}>7. Changes to Terms</Text>
                <Text style={styles.paragraph}>
                    We reserve the right to modify or replace these Terms at any time. We will provide at least 30 days' notice before any new terms take effect. Your continued use of the Service after the effective date of the revised Terms constitutes acceptance of the changes.
                </Text>

                <Text style={styles.contactInfo}>
                    Last updated: December 5, 2025
                    {'\n'}Contact: support@perhueapp.com
                </Text>

            </ScrollView>
        </View>
    );
};

export default TermsAndPoliciesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    subHeading: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginTop: 15,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4C7BE2',
        paddingLeft: 10,
    },
    paragraph: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 10,
    },
    contactInfo: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 30,
        marginBottom: 40,
    }
});