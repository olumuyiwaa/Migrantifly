// src/app/services/[slug]/page.js
import { notFound } from 'next/navigation';
import { contentApi } from '../../../lib/api';
import ServiceDetailClient from './ServiceDetailClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Generate metadata for the service page
export async function generateMetadata({ params }) {
  try {
    // Await params before accessing
    const { slug } = await params;
    const response = await contentApi.service(slug);
    const service = response?.data;

    if (!service) {
      return {
        title: 'Service Not Found',
        description: 'The requested service could not be found.'
      };
    }

    return {
      title: service.title,
      description: service.metaDescription || service.description,
    };
  } catch (error) {
    console.error('Metadata error:', error);
    return {
      title: 'Service Not Found',
      description: 'The requested service could not be found.',
    };
  }
}

// Main page component
export default async function ServiceDetail({ params }) {
  try {
    // Await params before accessing
    const { slug } = await params;
    const response = await contentApi.service(slug);
    const service = response?.data;

    if (!service) {
      console.log('Service not found for slug:', slug);
      notFound();
    }

    return <ServiceDetailClient service={service} />;
  } catch (error) {
    console.error('Error fetching service:', error);
    // If API fails, try static data as fallback
    try {
      const { slug } = await params;
      const servicesData = (await import('../../../data/services')).default;
      const service = servicesData.find(s => s.slug === slug);
      if (service) {
        console.log('Using fallback static data for:', slug);
        return <ServiceDetailClient service={service} />;
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
    }
    notFound();
  }
}