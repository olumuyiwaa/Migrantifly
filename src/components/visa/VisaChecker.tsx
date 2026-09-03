// components/visa/VisaChecker.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface VisaCheckResult {
    eligible: boolean;
    visaTypes: string[];
    recommendations: string[];
    nextSteps: string[];
}

export const VisaChecker: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        country: '',
        age: '',
        education: '',
        workExperience: '',
        hasJobOffer: '',
        hasPartner: '',
        englishLevel: '',
        occupation: ''
    });
    const [result, setResult] = useState<VisaCheckResult | null>(null);
    const [error, setError] = useState('');

    const countries = [
        { value: 'australia', label: 'Australia' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'usa', label: 'United States' },
        { value: 'canada', label: 'Canada' },
        { value: 'germany', label: 'Germany' },
        { value: 'france', label: 'France' },
        { value: 'japan', label: 'Japan' },
        { value: 'china', label: 'China' },
        { value: 'india', label: 'India' },
        { value: 'south_africa', label: 'South Africa' },
        { value: 'brazil', label: 'Brazil' },
        { value: 'other', label: 'Other' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/visa-checker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to check visa eligibility');
            }

            setResult(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookConsultation = () => {
        router.push('/book-consultation');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Visa Eligibility Checker
                </h2>
                <p className="text-gray-600 mb-6">
                    Answer a few questions to find out which New Zealand visas you may be eligible for.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country of Citizenship *
                            </label>
                            <select
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select your country</option>
                                {countries.map((country) => (
                                    <option key={country.value} value={country.value}>
                                        {country.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Age *
                            </label>
                            <select
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select age range</option>
                                <option value="under18">Under 18</option>
                                <option value="18-30">18-30</option>
                                <option value="31-40">31-40</option>
                                <option value="41-50">41-50</option>
                                <option value="51-55">51-55</option>
                                <option value="over55">Over 55</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Highest Education Level *
                            </label>
                            <select
                                value={formData.education}
                                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select education level</option>
                                <option value="high_school">High School</option>
                                <option value="certificate">Certificate or Diploma</option>
                                <option value="bachelors">Bachelor's Degree</option>
                                <option value="masters">Master's Degree</option>
                                <option value="phd">PhD or Doctorate</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Years of Work Experience *
                            </label>
                            <select
                                value={formData.workExperience}
                                onChange={(e) => setFormData({ ...formData, workExperience: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select experience</option>
                                <option value="none">None</option>
                                <option value="1-2">1-2 years</option>
                                <option value="3-5">3-5 years</option>
                                <option value="6-10">6-10 years</option>
                                <option value="10+">10+ years</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Do you have a job offer in New Zealand? *
                            </label>
                            <select
                                value={formData.hasJobOffer}
                                onChange={(e) => setFormData({ ...formData, hasJobOffer: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Do you have a partner/spouse in New Zealand? *
                            </label>
                            <select
                                value={formData.hasPartner}
                                onChange={(e) => setFormData({ ...formData, hasPartner: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                English Language Level
                            </label>
                            <select
                                value={formData.englishLevel}
                                onChange={(e) => setFormData({ ...formData, englishLevel: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select level</option>
                                <option value="basic">Basic</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced (IELTS 6.5+)</option>
                                <option value="native">Native Speaker</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Checking eligibility...' : 'Check My Eligibility'}
                    </button>
                </form>

                {result && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            Your Eligibility Results
                        </h3>

                        {result.eligible ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                                <p className="text-green-800 font-medium">Good news! You may be eligible for the following visas:</p>
                                <ul className="mt-2 list-disc list-inside text-green-700">
                                    {result.visaTypes.map((visa, index) => (
                                        <li key={index}>{visa}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                <p className="text-yellow-800">
                                    Based on your responses, you may not be immediately eligible for a New Zealand visa.
                                    However, you may qualify for other visa types or additional pathways.
                                </p>
                            </div>
                        )}

                        {result.recommendations.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                                <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
                                <ul className="list-disc list-inside text-blue-700">
                                    {result.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                            <button
                                onClick={handleBookConsultation}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Book Consultation
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};