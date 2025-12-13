import React, { FC, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ReportPayload } from '../types/dataModels';
import { submitReport } from '../api/userApi';

type HelpAndSupportScreenProps = NativeStackScreenProps<RootStackParamList, 'HelpAndSupportScreen'>;

const BLUE_COLOR = '#4C7BE2';

// Dữ liệu FAQ
const FAQ_DATA = [
    {
        id: 1,
        question: "What is Personal Color Analysis and how does PerHue determine my season?",
        answer: "Personal Color Analysis determines the colors that harmonize best with your natural skin tone, hair, and eye color. PerHue uses two methods: AI analysis (based on image data) and Expert Consultation (manual review by certified specialists) to suggest your primary color season (e.g., Cool Winter, Soft Autumn)."
    },
    {
        id: 2,
        question: "Why do I need to upload clear, unedited photos without makeup?",
        answer: "Accurate analysis relies on capturing your true undertones. Makeup, filters, or poor lighting can severely skew the results. We need high-resolution, naturally lit photos to ensure the AI and Experts make the most precise suggestion possible."
    },
    {
        id: 3,
        question: "What is the difference between AI Analysis and Expert Suggestion?",
        answer: "AI Analysis provides instant, algorithm-based results using pattern recognition. Expert Suggestion involves a certified human specialist manually reviewing your photos and profile details to provide nuanced advice, often including personalized notes and explanations."
    },
    {
        id: 4,
        question: "Can I delete the photos and personal data I upload?",
        answer: "Yes. In compliance with our privacy policy, you can request permanent deletion of your images and associated biometric data at any time via your user settings or by contacting our support team. We only use this data for service delivery and model refinement (anonymized)."
    },
    {
        id: 5,
        question: "My result suggests two seasons (e.g., Soft Summer/Soft Autumn). Why?",
        answer: "This often means your features fall between two distinct color categories (a blend). Our suggestions highlight your dominant flow, but indicate that colors from the secondary season may also be highly flattering. We recommend exploring the color palette suggestions for both."
    }
];

const REPORT_TYPES = [
    { type: 'CustomerService', label: 'Customer Service' },
    { type: 'Complaint', label: 'Complaint' },
    { type: 'Support', label: 'Technical Support' },
];

const FAQItem: FC<{ item: typeof FAQ_DATA[0] }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <View style={styles.faqCard}>
            <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.faqQuestionRow}>
                <Text style={styles.faqQuestionText}>{item.question}</Text>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#666" />
            </TouchableOpacity>
            {isOpen && (
                <Text style={styles.faqAnswerText}>{item.answer}</Text>
            )}
        </View>
    );
};



const ReportForm: FC = () => {
    const [content, setContent] = useState('');
    const [type, setType] = useState(REPORT_TYPES[0].type);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!content.trim()) {
            Alert.alert("Input Required", "Please enter your message or report content.");
            return;
        }

        setIsSubmitting(true);
        const payload: ReportPayload = {
            content: content.trim(),
            type: type,
        };

        try {
            await submitReport(payload);
            Toast.show({
                type: 'success',
                text1: 'Report Submitted!',
                text2: 'Thank you for your feedback. We will review your report shortly.',
                visibilityTime: 4000,
            });
            setContent('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Submission failed.';
            Alert.alert("Submission Failed", errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [content, type]);

    const renderTypeButton = (buttonType: string, label: string) => (
        <TouchableOpacity
            key={buttonType}
            style={[
                styles.typeButton,
                type === buttonType && styles.typeButtonActive,
            ]}
            onPress={() => setType(buttonType)}
            disabled={isSubmitting}
        >
            <Text style={type === buttonType ? styles.typeButtonTextActive : styles.typeButtonText}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.reportFormContainer}>
            <Text style={styles.sectionHeading}>Send Feedback or Report an Issue</Text>

            <Text style={styles.label}>Select Category:</Text>
            <View style={styles.typeSelectorContainer}>
                {REPORT_TYPES.map(rt => renderTypeButton(rt.type, rt.label))}
            </View>

            <Text style={styles.label}>Your Message:</Text>
            <TextInput
                style={styles.textArea}
                value={content}
                onChangeText={setContent}
                placeholder={`Type your detailed ${type.toLowerCase()} here...`}
                multiline
                numberOfLines={6}
                editable={!isSubmitting}
            />

            <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting || !content.trim()}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Submit {type}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const HelpAndSupportScreen: FC<HelpAndSupportScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top - 20 }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    <View style={styles.faqSection}>
                        <Text style={styles.sectionHeading}>Frequently Asked Questions (FAQ)</Text>
                        {FAQ_DATA.map((item) => (
                            <FAQItem key={item.id} item={item} />
                        ))}
                    </View>

                    <View style={styles.divider} />
                    <ReportForm />

                    <View style={{ height: insets.bottom + 20 }} />

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default HelpAndSupportScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 30,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BLUE_COLOR,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: BLUE_COLOR,
        paddingLeft: 10,
    },

    // --- FAQ Styles ---
    faqSection: {
        marginBottom: 20,
    },
    faqCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 8,
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    faqQuestionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        paddingRight: 10,
    },
    faqAnswerText: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        lineHeight: 22,
    },

    // --- Report Form Styles ---
    reportFormContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    typeSelectorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 10,
        marginBottom: 15,
    },
    typeButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f9f9f9',
    },
    typeButtonActive: {
        backgroundColor: BLUE_COLOR,
        borderColor: BLUE_COLOR,
    },
    typeButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    typeButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    textArea: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 120,
        marginBottom: 20,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: BLUE_COLOR,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#a0a0a0',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});